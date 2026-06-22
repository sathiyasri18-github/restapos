import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, forkJoin, of } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { BillerService } from '../../../services/biller.service';
import { CustomerService } from '../../../services/customer.service';
import {
  CreatePosSettingDto,
  PosSetting,
  PosSettingService,
  UpdatePosSettingDto
} from '../../../services/pos-setting.service';
import { WarehouseService } from '../../../services/warehouse.service';

interface SelectOption {
  label: string;
  value: number;
}

interface FormErrors {
  customerId?: string;
  warehouseId?: string;
  billerId?: string;
  productNumber?: string;
  stripeSecretKey?: string;
}

function emptyForm(): PosSetting {
  return {
    posSettingId: 0,
    customerId: 0,
    warehouseId: 0,
    billerId: 0,
    productNumber: 3,
    keybordActive: false,
    stripePublicKey: '',
    stripeSecretKey: '',
  };
}

@Component({
  selector: 'app-pos-setting',
  imports: [AppModule],
  templateUrl: './pos-setting.component.html',
  styleUrls: ['./pos-setting.component.scss'],
  providers: [MessageService]
})
export class PosSettingComponent implements OnInit {
  formData: PosSetting = emptyForm();
  formErrors: FormErrors = {};
  isLoading = false;
  isSaving = false;
  lookupsLoaded = false;

  customerOptions: SelectOption[] = [];
  warehouseOptions: SelectOption[] = [];
  billerOptions: SelectOption[] = [];

  private originalStripeSecretKey = '';

  constructor(
    private posSettingService: PosSettingService,
    private customerService: CustomerService,
    private warehouseService: WarehouseService,
    private billerService: BillerService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  get isEditMode(): boolean {
    return this.formData.posSettingId > 0;
  }

  private loadPage(): void {
    this.isLoading = true;
    forkJoin({
      customers: this.customerService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      warehouses: this.warehouseService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      billers: this.billerService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      settings: this.posSettingService.getAll({ pageSize: 1 }).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ customers, warehouses, billers, settings }) => {
        if (customers) {
          this.customerOptions = this.mapCustomerOptions(customers);
        }
        if (warehouses) {
          this.warehouseOptions = this.mapOptions(warehouses, 'warehouseId', 'name');
        }
        if (billers) {
          this.billerOptions = this.mapBillerOptions(billers);
        }
        this.lookupsLoaded = this.customerOptions.length > 0
          || this.warehouseOptions.length > 0
          || this.billerOptions.length > 0;

        const raw = settings ? this.extractItems(settings) : [];
        if (raw.length) {
          this.formData = this.mapPosSetting(raw[0]);
          this.originalStripeSecretKey = this.formData.stripeSecretKey;
          this.formData.stripeSecretKey = '';
        }

        this.isLoading = false;

        if (!customers && !warehouses && !billers && !settings) {
          this.messageService.add({
            severity: 'error',
            summary: 'Load Failed',
            detail: 'Could not load POS settings. Please try again.'
          });
        } else if (!customers || !warehouses || !billers) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Partial Load',
            detail: 'Some dropdown data could not be loaded.'
          });
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load POS settings. Please try again.'
        });
      }
    });
  }

  private mapPosSetting(x: any): PosSetting {
    return {
      posSettingId: x.posSettingId ?? x.id ?? 0,
      customerId: x.customerId ?? 0,
      warehouseId: x.warehouseId ?? 0,
      billerId: x.billerId ?? 0,
      productNumber: x.productNumber ?? 3,
      keybordActive: x.keybordActive ?? false,
      stripePublicKey: x.stripePublicKey ?? '',
      stripeSecretKey: x.stripeSecretKey ?? '',
    };
  }

  private mapOptions(res: any, idKey: string, ...nameKeys: string[]): SelectOption[] {
    return this.extractItems(res)
      .map((x: any) => {
        const id = Number(x[idKey] ?? x.id ?? 0);
        const name = nameKeys.map(k => x[k]).find(v => v != null && v !== '') ?? `#${id}`;
        return { label: String(name), value: id };
      })
      .filter(option => option.value > 0);
  }

  private mapCustomerOptions(res: any): SelectOption[] {
    return this.extractItems(res)
      .map((x: any) => {
        const id = Number(x.customerId ?? x.id ?? 0);
        const name = x.name ?? x.customerName ?? `#${id}`;
        const phone = x.phoneNumber ?? x.phone ?? '';
        const label = phone ? `${name} (${phone})` : String(name);
        return { label, value: id };
      })
      .filter(option => option.value > 0);
  }

  private mapBillerOptions(res: any): SelectOption[] {
    return this.extractItems(res)
      .filter((x: any) => x.isActive !== false)
      .map((x: any) => {
        const id = Number(x.billerId ?? x.id ?? 0);
        const name = x.name ?? `#${id}`;
        const company = x.companyName ?? '';
        const label = company ? `${name} (${company})` : String(name);
        return { label, value: id };
      })
      .filter(option => option.value > 0);
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.customerId || this.formData.customerId <= 0) {
      this.formErrors.customerId = 'Default customer is required';
    }
    if (!this.formData.warehouseId || this.formData.warehouseId <= 0) {
      this.formErrors.warehouseId = 'Default warehouse is required';
    }
    if (!this.formData.billerId || this.formData.billerId <= 0) {
      this.formErrors.billerId = 'Default biller is required';
    }
    if (this.formData.productNumber == null || this.formData.productNumber < 0) {
      this.formErrors.productNumber = 'Product row count must be 0 or greater';
    }
    if (!this.isEditMode && !this.formData.stripeSecretKey?.trim()) {
      this.formErrors.stripeSecretKey = 'Stripe secret key is required';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  onSubmit(): void {
    if (!this.validate()) return;
    this.isSaving = true;

    if (this.isEditMode) {
      this.saveEdit();
    } else {
      this.saveAdd();
    }
  }

  private resolveStripeSecretKey(): string {
    const entered = this.formData.stripeSecretKey?.trim();
    if (entered) return entered;
    return this.originalStripeSecretKey;
  }

  private toCreateDto(f: PosSetting): CreatePosSettingDto {
    return {
      customerId: f.customerId,
      warehouseId: f.warehouseId,
      billerId: f.billerId,
      productNumber: f.productNumber,
      keybordActive: f.keybordActive,
      stripePublicKey: f.stripePublicKey?.trim() || null,
      stripeSecretKey: f.stripeSecretKey.trim(),
    };
  }

  private toUpdateDto(f: PosSetting): UpdatePosSettingDto {
    return {
      id: f.posSettingId,
      customerId: f.customerId,
      warehouseId: f.warehouseId,
      billerId: f.billerId,
      productNumber: f.productNumber,
      keybordActive: f.keybordActive,
      stripePublicKey: f.stripePublicKey?.trim() || null,
      stripeSecretKey: this.resolveStripeSecretKey(),
    };
  }

  private saveAdd(): void {
    this.posSettingService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        this.formData = this.mapPosSetting(res?.data ?? res ?? this.formData);
        this.originalStripeSecretKey = this.formData.stripeSecretKey;
        this.formData.stripeSecretKey = '';
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'POS settings were saved successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not save POS settings. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.posSettingService.update(this.formData.posSettingId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        this.originalStripeSecretKey = this.resolveStripeSecretKey();
        this.formData.stripeSecretKey = '';
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'POS settings were saved successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not save POS settings. Please try again.'
        });
      }
    });
  }
}
