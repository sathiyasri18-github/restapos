import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatMoney } from '../../../common/grid-report';
import {
  CreateProductTransferDto,
  ProductTransfer,
  ProductTransferService,
  UpdateProductTransferDto
} from '../../../services/product-transfer.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  transferId?: string;
  productId?: string;
  purchaseUnitId?: string;
}

function emptyForm(): ProductTransfer {
  return {
    productTransferId: 0,
    transferId: 0,
    productId: 0,
    productBatchId: null,
    variantId: null,
    imeiNumber: '',
    qty: 0,
    purchaseUnitId: 0,
    netUnitCost: 0,
    taxRate: 0,
    tax: 0,
    total: 0,
  };
}

@Component({
  selector: 'app-product-transfer',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './product-transfer.component.html',
  styleUrls: ['./product-transfer.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ProductTransferComponent implements OnInit, OnDestroy {
  items: ProductTransfer[] = [];
  filteredItems: ProductTransfer[] = [];
  selectedItem: ProductTransfer | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: ProductTransfer = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private productTransferService: ProductTransferService,
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
    return this.dialogMode === 'add' ? 'Add Product Transfer' : 'Edit Product Transfer';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  loadItems(): void {
    this.isLoading = true;
    this.productTransferService.getAll({ pageSize: 500 }).subscribe({
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
          detail: 'Could not load product transfers. Please try again.'
        });
      }
    });
  }

  private mapItem(x: any): ProductTransfer {
    return {
      productTransferId: x.productTransferId ?? x.id ?? 0,
      transferId: Number(x.transferId ?? 0),
      productId: Number(x.productId ?? 0),
      productBatchId: x.productBatchId != null ? Number(x.productBatchId) : null,
      variantId: x.variantId != null ? Number(x.variantId) : null,
      imeiNumber: x.imeiNumber ?? '',
      qty: Number(x.qty ?? 0),
      purchaseUnitId: Number(x.purchaseUnitId ?? 0),
      netUnitCost: Number(x.netUnitCost ?? 0),
      taxRate: Number(x.taxRate ?? 0),
      tax: Number(x.tax ?? 0),
      total: Number(x.total ?? 0),
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
        item.transferId,
        item.productId,
        item.productBatchId,
        item.variantId,
        item.imeiNumber,
        item.purchaseUnitId,
      ].some(v => v != null && String(v).toLowerCase().includes(term));
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(item: ProductTransfer): void {
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

    if (!this.formData.transferId || this.formData.transferId <= 0) {
      this.formErrors.transferId = 'Transfer ID must be greater than 0';
    }
    if (!this.formData.productId || this.formData.productId <= 0) {
      this.formErrors.productId = 'Product ID must be greater than 0';
    }
    if (!this.formData.purchaseUnitId || this.formData.purchaseUnitId <= 0) {
      this.formErrors.purchaseUnitId = 'Purchase unit ID must be greater than 0';
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

  private toCreateDto(f: ProductTransfer): CreateProductTransferDto {
    return {
      transferId: f.transferId,
      productId: f.productId,
      productBatchId: f.productBatchId,
      variantId: f.variantId,
      imeiNumber: f.imeiNumber?.trim() || null,
      qty: f.qty,
      purchaseUnitId: f.purchaseUnitId,
      netUnitCost: f.netUnitCost,
      taxRate: f.taxRate,
      tax: f.tax,
      total: f.total,
    };
  }

  private toUpdateDto(f: ProductTransfer): UpdateProductTransferDto {
    return {
      id: f.productTransferId,
      ...this.toCreateDto(f),
    };
  }

  private saveAdd(): void {
    this.productTransferService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapItem(res?.data ?? res ?? this.formData);
        this.items = [...this.items, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Product Transfer Added',
          detail: 'Product transfer was added successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add product transfer. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.productTransferService.update(this.formData.productTransferId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.items.findIndex(i => i.productTransferId === this.formData.productTransferId);
        if (idx !== -1) {
          this.items = [
            ...this.items.slice(0, idx),
            { ...this.formData },
            ...this.items.slice(idx + 1)
          ];
        }
        if (this.selectedItem?.productTransferId === this.formData.productTransferId) {
          this.selectedItem = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Product Transfer Updated',
          detail: 'Product transfer was updated successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update product transfer. Please try again.'
        });
      }
    });
  }

  confirmDelete(item: ProductTransfer, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete product transfer <strong>#${item.productTransferId}</strong>? This action cannot be undone.`,
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

  private executeDelete(item: ProductTransfer): void {
    this.productTransferService.delete(item.productTransferId).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.productTransferId !== item.productTransferId);
        if (this.selectedItem?.productTransferId === item.productTransferId) {
          this.selectedItem = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Product Transfer Deleted',
          detail: 'Product transfer was deleted.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete product transfer. Please try again.'
        });
      }
    });
  }

  get itemReportConfig(): GridReportConfig {
    return {
      title: 'Product Transfer List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'product-transfers',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Transfer ID', field: 'transferId' },
        { header: 'Product ID', field: 'productId' },
        { header: 'Qty', field: 'qty' },
        { header: 'Unit ID', field: 'purchaseUnitId' },
        { header: 'Net Cost', field: 'netUnitCost', format: (v) => formatMoney(v) },
        { header: 'Total', field: 'total', format: (v) => formatMoney(v) },
      ],
      rows: this.filteredItems.map(i => ({
        transferId: i.transferId,
        productId: i.productId,
        qty: i.qty,
        purchaseUnitId: i.purchaseUnitId,
        netUnitCost: i.netUnitCost,
        total: i.total,
      }))
    };
  }
}
