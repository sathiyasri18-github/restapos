// supplier.component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import {
  Supplier,
  SupplierService,
  CreateSupplierDto,
  UpdateSupplierDto
} from '../../services/supplier.service';
import { EntityCustomFieldsComponent } from '../../components/entity-custom-fields/entity-custom-fields.component';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  name?: string;
  companyName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
}

function emptyForm(): Supplier {
  return {
    supplierId: 0,
    name: '',
    image: '',
    companyName: '',
    vatNumber: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isActive: true,
  };
}

@Component({
  selector: 'app-supplier',
  imports: [AppModule, EntityCustomFieldsComponent, GridReportToolbarComponent],
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class SupplierComponent implements OnInit, OnDestroy {

  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Supplier = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  @ViewChild(EntityCustomFieldsComponent) entityCustomFields?: EntityCustomFieldsComponent;

  constructor(
    private supplierService: SupplierService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Supplier' : 'Edit Supplier';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  loadSuppliers(): void {
    this.isLoading = true;
    this.supplierService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data)  ? res.data
          : [];
        this.suppliers = raw.map(x => this.mapSupplier(x));
        this.totalRecords = res?.totalCount ?? this.suppliers.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load suppliers. Please try again.'
        });
      }
    });
  }

  private mapSupplier(x: any): Supplier {
    return {
      supplierId:  x.supplierId ?? x.id ?? 0,
      name:        x.name ?? '',
      image:       x.image ?? '',
      companyName: x.companyName ?? '',
      vatNumber:   x.vatNumber ?? '',
      email:       x.email ?? '',
      phoneNumber: x.phoneNumber ?? '',
      address:     x.address ?? '',
      city:        x.city ?? '',
      state:       x.state ?? '',
      postalCode:  x.postalCode ?? '',
      country:     x.country ?? '',
      isActive:    x.isActive ?? true,
    };
  }

  onSearchChange(): void {
    this.search$.next();
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.activeFilter = null;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredSuppliers = this.suppliers.filter(s => {
      const matchesSearch = !term
        || s.name.toLowerCase().includes(term)
        || s.companyName.toLowerCase().includes(term)
        || s.phoneNumber.toLowerCase().includes(term)
        || s.email.toLowerCase().includes(term)
        || s.city.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || s.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData   = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(supplier: Supplier): void {
    this.dialogMode = 'edit';
    this.formData   = { ...supplier };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedSupplier) this.openEditDialog(this.selectedSupplier);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving   = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.name?.trim()) {
      this.formErrors.name = 'Supplier name is required';
    }
    if (!this.formData.companyName?.trim()) {
      this.formErrors.companyName = 'Company name is required';
    }
    if (!this.formData.phoneNumber?.trim()) {
      this.formErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{7,15}$/.test(this.formData.phoneNumber.replace(/[\s\-]/g, ''))) {
      this.formErrors.phoneNumber = 'Enter a valid phone number';
    }
    if (!this.formData.email?.trim()) {
      this.formErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
      this.formErrors.email = 'Enter a valid email address';
    }
    if (!this.formData.address?.trim()) {
      this.formErrors.address = 'Address is required';
    }
    if (!this.formData.city?.trim()) {
      this.formErrors.city = 'City is required';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    if (this.entityCustomFields && !this.entityCustomFields.validate()) return;
    this.isSaving = true;
    if (this.dialogMode === 'add') {
      this.saveAdd();
    } else {
      this.saveEdit();
    }
  }

  private toCreateDto(f: Supplier): CreateSupplierDto {
    return {
      name:        f.name.trim(),
      image:       f.image?.trim() || null,
      companyName: f.companyName.trim(),
      vatNumber:   f.vatNumber?.trim() || null,
      email:       f.email.trim(),
      phoneNumber: f.phoneNumber.trim(),
      address:     f.address.trim(),
      city:        f.city.trim(),
      state:       f.state?.trim() || null,
      postalCode:  f.postalCode?.trim() || null,
      country:     f.country?.trim() || null,
      isActive:    f.isActive,
    };
  }

  private toUpdateDto(f: Supplier): UpdateSupplierDto {
    return {
      id:          f.supplierId,
      name:        f.name.trim(),
      image:       f.image?.trim() || null,
      companyName: f.companyName.trim(),
      vatNumber:   f.vatNumber?.trim() || null,
      email:       f.email.trim(),
      phoneNumber: f.phoneNumber.trim(),
      address:     f.address.trim(),
      city:        f.city.trim(),
      state:       f.state?.trim() || null,
      postalCode:  f.postalCode?.trim() || null,
      country:     f.country?.trim() || null,
      isActive:    f.isActive,
    };
  }

  private saveAdd(): void {
    this.supplierService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapSupplier(res?.data ?? res ?? this.formData);
        this.persistCustomFields(added.supplierId, () => {
          this.suppliers = [...this.suppliers, added];
          this.totalRecords++;
          this.applyFilter();
          this.dialogVisible = false;
          this.isSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Supplier Added',
            detail: `"${added.name}" was added successfully.`
          });
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add supplier. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.supplierService.update(this.formData.supplierId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        this.persistCustomFields(this.formData.supplierId, () => {
          const idx = this.suppliers.findIndex(s => s.supplierId === this.formData.supplierId);
          if (idx !== -1) {
            this.suppliers = [
              ...this.suppliers.slice(0, idx),
              { ...this.formData },
              ...this.suppliers.slice(idx + 1)
            ];
          }
          if (this.selectedSupplier?.supplierId === this.formData.supplierId) {
            this.selectedSupplier = { ...this.formData };
          }
          this.applyFilter();
          this.dialogVisible = false;
          this.isSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Supplier Updated',
            detail: `"${this.formData.name}" was updated successfully.`
          });
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update supplier. Please try again.'
        });
      }
    });
  }

  private persistCustomFields(entityId: number, onComplete: () => void): void {
    const cf = this.entityCustomFields;
    if (!cf?.hasFields) {
      onComplete();
      return;
    }
    cf.saveValues(entityId).subscribe({
      next: () => onComplete(),
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'Custom Fields',
          detail: 'Supplier saved but additional field values could not be saved.'
        });
        onComplete();
      }
    });
  }

  confirmDelete(supplier: Supplier, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${supplier.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(supplier)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedSupplier) this.confirmDelete(this.selectedSupplier, event);
  }

  private executeDelete(supplier: Supplier): void {
    this.supplierService.delete(supplier.supplierId).subscribe({
      next: () => {
        this.suppliers = this.suppliers.filter(s => s.supplierId !== supplier.supplierId);
        if (this.selectedSupplier?.supplierId === supplier.supplierId) {
          this.selectedSupplier = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Supplier Deleted',
          detail: `"${supplier.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete supplier. Please try again.'
        });
      }
    });
  }

  get supplierReportConfig(): GridReportConfig {
    return {
      title: 'Supplier List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'suppliers',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Company', field: 'companyName' },
        { header: 'City', field: 'city' },
        { header: 'Phone', field: 'phoneNumber' },
        { header: 'Email', field: 'email' },
        { header: 'VAT No.', field: 'vatNumber' },
        {
          header: 'Active',
          field: 'isActive',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredSuppliers.map(s => ({
        name: s.name,
        companyName: s.companyName,
        city: s.city,
        phoneNumber: s.phoneNumber,
        email: s.email,
        vatNumber: s.vatNumber || '—',
        isActive: s.isActive
      }))
    };
  }
}
