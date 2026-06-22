import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, of } from 'rxjs';
import { AppModule } from '../../module/app.module';
import {
  CreateGeneralSettingDto,
  GeneralSetting,
  GeneralSettingService,
  UpdateGeneralSettingDto
} from '../../services/general-setting.service';

interface FormErrors {
  siteTitle?: string;
  currency?: string;
  staffAccess?: string;
  dateFormat?: string;
  theme?: string;
  currencyPosition?: string;
}

function emptyForm(): GeneralSetting {
  return {
    generalSettingId: 0,
    siteTitle: '',
    siteLogo: '',
    isRtl: false,
    currency: '',
    staffAccess: '',
    dateFormat: '',
    developedBy: '',
    invoiceFormat: '',
    state: null,
    theme: '',
    currencyPosition: '',
  };
}

@Component({
  selector: 'app-general-setting',
  imports: [AppModule],
  templateUrl: './general-setting.component.html',
  styleUrls: ['./general-setting.component.scss'],
  providers: [MessageService]
})
export class GeneralSettingComponent implements OnInit {
  formData: GeneralSetting = emptyForm();
  formErrors: FormErrors = {};
  isLoading = false;
  isSaving = false;

  constructor(
    private generalSettingService: GeneralSettingService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSetting();
  }

  get isEditMode(): boolean {
    return this.formData.generalSettingId > 0;
  }

  private loadSetting(): void {
    this.isLoading = true;
    this.generalSettingService.getAll({ pageSize: 1 }).pipe(
      catchError(() => of(null))
    ).subscribe({
      next: (res: any) => {
        const raw = this.extractItems(res);
        if (raw.length) {
          this.formData = this.mapSetting(raw[0]);
        }
        this.isLoading = false;
        if (!res) {
          this.messageService.add({
            severity: 'error',
            summary: 'Load Failed',
            detail: 'Could not load general settings. Please try again.'
          });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load general settings. Please try again.'
        });
      }
    });
  }

  private mapSetting(x: any): GeneralSetting {
    return {
      generalSettingId: x.generalSettingId ?? x.id ?? 0,
      siteTitle: x.siteTitle ?? '',
      siteLogo: x.siteLogo ?? '',
      isRtl: x.isRtl ?? false,
      currency: x.currency ?? '',
      staffAccess: x.staffAccess ?? '',
      dateFormat: x.dateFormat ?? '',
      developedBy: x.developedBy ?? '',
      invoiceFormat: x.invoiceFormat ?? '',
      state: x.state ?? null,
      theme: x.theme ?? '',
      currencyPosition: x.currencyPosition ?? '',
    };
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.siteTitle?.trim()) {
      this.formErrors.siteTitle = 'Site title is required';
    }
    if (!this.formData.currency?.trim()) {
      this.formErrors.currency = 'Currency is required';
    }
    if (!this.formData.staffAccess?.trim()) {
      this.formErrors.staffAccess = 'Staff access is required';
    }
    if (!this.formData.dateFormat?.trim()) {
      this.formErrors.dateFormat = 'Date format is required';
    }
    if (!this.formData.theme?.trim()) {
      this.formErrors.theme = 'Theme is required';
    }
    if (!this.formData.currencyPosition?.trim()) {
      this.formErrors.currencyPosition = 'Currency position is required';
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

  private toCreateDto(f: GeneralSetting): CreateGeneralSettingDto {
    return {
      siteTitle: f.siteTitle.trim(),
      siteLogo: f.siteLogo?.trim() || null,
      isRtl: f.isRtl,
      currency: f.currency.trim(),
      staffAccess: f.staffAccess.trim(),
      dateFormat: f.dateFormat.trim(),
      developedBy: f.developedBy?.trim() || null,
      invoiceFormat: f.invoiceFormat?.trim() || null,
      state: f.state,
      theme: f.theme.trim(),
      currencyPosition: f.currencyPosition.trim(),
    };
  }

  private toUpdateDto(f: GeneralSetting): UpdateGeneralSettingDto {
    return {
      id: f.generalSettingId,
      siteTitle: f.siteTitle.trim(),
      siteLogo: f.siteLogo?.trim() || null,
      isRtl: f.isRtl,
      currency: f.currency.trim(),
      staffAccess: f.staffAccess.trim(),
      dateFormat: f.dateFormat.trim(),
      developedBy: f.developedBy?.trim() || null,
      invoiceFormat: f.invoiceFormat?.trim() || null,
      state: f.state,
      theme: f.theme.trim(),
      currencyPosition: f.currencyPosition.trim(),
    };
  }

  private saveAdd(): void {
    this.generalSettingService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        this.formData = this.mapSetting(res?.data ?? res ?? this.formData);
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'General settings were saved successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not save general settings. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.generalSettingService.update(this.formData.generalSettingId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'General settings were saved successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not save general settings. Please try again.'
        });
      }
    });
  }
}
