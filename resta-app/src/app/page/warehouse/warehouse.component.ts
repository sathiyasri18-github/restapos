import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  Warehouse,
  WarehouseService,
  CreateWarehouseDto,
  UpdateWarehouseDto
} from '../../services/warehouse.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

function emptyForm(): Warehouse {
  return {
    warehouseId: 0,
    name: '',
    phone: '',
    email: '',
    address: '',
    isActive: true,
  };
}

@Component({
  selector: 'app-warehouse',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class WarehouseComponent implements OnInit, OnDestroy {
  warehouses: Warehouse[] = [];
  filteredWarehouses: Warehouse[] = [];
  selectedWarehouse: Warehouse | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Warehouse = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private warehouseService: WarehouseService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Warehouse' : 'Edit Warehouse';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  loadWarehouses(): void {
    this.isLoading = true;
    this.warehouseService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.warehouses = raw.map(x => this.mapWarehouse(x));
        this.totalRecords = res?.totalCount ?? this.warehouses.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load warehouses. Please try again.'
        });
      }
    });
  }

  private mapWarehouse(x: any): Warehouse {
    return {
      warehouseId: x.warehouseId ?? x.id ?? 0,
      name: x.name ?? '',
      phone: x.phone ?? '',
      email: x.email ?? '',
      address: x.address ?? '',
      isActive: x.isActive ?? true,
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
    this.filteredWarehouses = this.warehouses.filter(w => {
      const matchesSearch = !term
        || w.name.toLowerCase().includes(term)
        || w.phone.toLowerCase().includes(term)
        || w.email.toLowerCase().includes(term)
        || w.address.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || w.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(warehouse: Warehouse): void {
    this.dialogMode = 'edit';
    this.formData = { ...warehouse };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedWarehouse) this.openEditDialog(this.selectedWarehouse);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.name?.trim()) {
      this.formErrors.name = 'Warehouse name is required';
    }
    if (!this.formData.address?.trim()) {
      this.formErrors.address = 'Address is required';
    }
    if (this.formData.phone && !/^\d{7,15}$/.test(this.formData.phone.replace(/[\s\-]/g, ''))) {
      this.formErrors.phone = 'Enter a valid phone number';
    }
    if (this.formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
      this.formErrors.email = 'Enter a valid email address';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    if (this.dialogMode === 'add') {
      this.saveAdd();
    } else {
      this.saveEdit();
    }
  }

  private toCreateDto(f: Warehouse): CreateWarehouseDto {
    return {
      name: f.name.trim(),
      phone: f.phone?.trim() || null,
      email: f.email?.trim() || null,
      address: f.address.trim(),
      isActive: f.isActive,
    };
  }

  private toUpdateDto(f: Warehouse): UpdateWarehouseDto {
    return {
      id: f.warehouseId,
      name: f.name.trim(),
      phone: f.phone?.trim() || null,
      email: f.email?.trim() || null,
      address: f.address.trim(),
      isActive: f.isActive,
    };
  }

  private saveAdd(): void {
    this.warehouseService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapWarehouse(res?.data ?? res ?? this.formData);
        this.warehouses = [...this.warehouses, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Warehouse Added',
          detail: `"${added.name}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add warehouse. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.warehouseService.update(this.formData.warehouseId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.warehouses.findIndex(w => w.warehouseId === this.formData.warehouseId);
        if (idx !== -1) {
          this.warehouses = [
            ...this.warehouses.slice(0, idx),
            { ...this.formData },
            ...this.warehouses.slice(idx + 1)
          ];
        }
        if (this.selectedWarehouse?.warehouseId === this.formData.warehouseId) {
          this.selectedWarehouse = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Warehouse Updated',
          detail: `"${this.formData.name}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update warehouse. Please try again.'
        });
      }
    });
  }

  confirmDelete(warehouse: Warehouse, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${warehouse.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(warehouse)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedWarehouse) this.confirmDelete(this.selectedWarehouse, event);
  }

  private executeDelete(warehouse: Warehouse): void {
    this.warehouseService.delete(warehouse.warehouseId).subscribe({
      next: () => {
        this.warehouses = this.warehouses.filter(w => w.warehouseId !== warehouse.warehouseId);
        if (this.selectedWarehouse?.warehouseId === warehouse.warehouseId) {
          this.selectedWarehouse = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Warehouse Deleted',
          detail: `"${warehouse.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete warehouse. Please try again.'
        });
      }
    });
  }

  get warehouseReportConfig(): GridReportConfig {
    return {
      title: 'Warehouse List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'warehouses',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Phone', field: 'phone' },
        { header: 'Email', field: 'email' },
        { header: 'Address', field: 'address' },
        {
          header: 'Active',
          field: 'isActive',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredWarehouses.map(w => ({
        name: w.name,
        phone: w.phone || '—',
        email: w.email || '—',
        address: w.address,
        isActive: w.isActive
      }))
    };
  }
}
