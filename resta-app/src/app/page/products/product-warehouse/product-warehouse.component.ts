import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatMoney } from '../../../common/grid-report';
import {
  CreateProductWarehouseDto,
  ProductWarehouse,
  ProductWarehouseService,
  UpdateProductWarehouseDto
} from '../../../services/product-warehouse.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  productId?: string;
  warehouseId?: string;
}

function emptyForm(): ProductWarehouse {
  return {
    productWarehouseId: 0,
    productId: '',
    productBatchId: null,
    variantId: null,
    imeiNumber: '',
    warehouseId: 0,
    qty: 0,
    price: null,
  };
}

@Component({
  selector: 'app-product-warehouse',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './product-warehouse.component.html',
  styleUrls: ['./product-warehouse.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ProductWarehouseComponent implements OnInit, OnDestroy {
  items: ProductWarehouse[] = [];
  filteredItems: ProductWarehouse[] = [];
  selectedItem: ProductWarehouse | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: ProductWarehouse = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private productWarehouseService: ProductWarehouseService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.applyFilter());
    this.loadItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Product Warehouse' : 'Edit Product Warehouse';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  loadItems(): void {
    this.isLoading = true;
    this.productWarehouseService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.items = raw.map(x => this.mapItem(x));
        this.totalRecords = res?.totalCount ?? this.items.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load product warehouses. Please try again.'
        });
      }
    });
  }

  private mapItem(x: any): ProductWarehouse {
    return {
      productWarehouseId: x.productWarehouseId ?? x.id ?? 0,
      productId: x.productId != null ? String(x.productId) : '',
      productBatchId: x.productBatchId != null ? Number(x.productBatchId) : null,
      variantId: x.variantId != null ? Number(x.variantId) : null,
      imeiNumber: x.imeiNumber ?? '',
      warehouseId: Number(x.warehouseId ?? 0),
      qty: Number(x.qty ?? 0),
      price: x.price != null ? Number(x.price) : null,
    };
  }

  onSearchChange(): void {
    this.search$.next();
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredItems = this.items.filter(item => {
      if (!term) return true;
      return [
        item.productId,
        item.warehouseId,
        item.productBatchId,
        item.variantId,
        item.imeiNumber,
      ].some(v => v != null && String(v).toLowerCase().includes(term));
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(item: ProductWarehouse): void {
    this.dialogMode = 'edit';
    this.formData = { ...item };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedItem) this.openEditDialog(this.selectedItem);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.productId?.trim()) {
      this.formErrors.productId = 'Product ID is required';
    }
    if (!this.formData.warehouseId || this.formData.warehouseId <= 0) {
      this.formErrors.warehouseId = 'Warehouse ID must be greater than 0';
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

  private toCreateDto(f: ProductWarehouse): CreateProductWarehouseDto {
    return {
      productId: f.productId.trim(),
      productBatchId: f.productBatchId,
      variantId: f.variantId,
      imeiNumber: f.imeiNumber?.trim() || null,
      warehouseId: f.warehouseId,
      qty: f.qty,
      price: f.price,
    };
  }

  private toUpdateDto(f: ProductWarehouse): UpdateProductWarehouseDto {
    return {
      id: f.productWarehouseId,
      ...this.toCreateDto(f),
    };
  }

  private saveAdd(): void {
    this.productWarehouseService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapItem(res?.data ?? res ?? this.formData);
        this.items = [...this.items, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Product Warehouse Added',
          detail: 'Product warehouse was added successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add product warehouse. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.productWarehouseService.update(this.formData.productWarehouseId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.items.findIndex(i => i.productWarehouseId === this.formData.productWarehouseId);
        if (idx !== -1) {
          this.items = [
            ...this.items.slice(0, idx),
            { ...this.formData },
            ...this.items.slice(idx + 1)
          ];
        }
        if (this.selectedItem?.productWarehouseId === this.formData.productWarehouseId) {
          this.selectedItem = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Product Warehouse Updated',
          detail: 'Product warehouse was updated successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update product warehouse. Please try again.'
        });
      }
    });
  }

  confirmDelete(item: ProductWarehouse, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete product warehouse for <strong>${item.productId}</strong>? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(item)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedItem) this.confirmDelete(this.selectedItem, event);
  }

  private executeDelete(item: ProductWarehouse): void {
    this.productWarehouseService.delete(item.productWarehouseId).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.productWarehouseId !== item.productWarehouseId);
        if (this.selectedItem?.productWarehouseId === item.productWarehouseId) {
          this.selectedItem = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Product Warehouse Deleted',
          detail: 'Product warehouse was deleted.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete product warehouse. Please try again.'
        });
      }
    });
  }

  get itemReportConfig(): GridReportConfig {
    return {
      title: 'Product Warehouse List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'product-warehouses',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Product ID', field: 'productId' },
        { header: 'Warehouse ID', field: 'warehouseId' },
        { header: 'Qty', field: 'qty' },
        { header: 'Price', field: 'price', format: (v) => formatMoney(v) },
        { header: 'IMEI', field: 'imeiNumber' },
      ],
      rows: this.filteredItems.map(i => ({
        productId: i.productId,
        warehouseId: i.warehouseId,
        qty: i.qty,
        price: i.price,
        imeiNumber: i.imeiNumber || '—',
      }))
    };
  }
}
