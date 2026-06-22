import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatDate } from '../../../common/grid-report';
import {
  CreateProductBatchDto,
  ProductBatch,
  ProductBatchService,
  UpdateProductBatchDto
} from '../../../services/product-batch.service';

type DialogMode = 'add' | 'edit';

interface BatchForm {
  productBatchId: number;
  productId: number;
  batchNo: string;
  expiredDate: Date | null;
  qty: number;
}

interface FormErrors {
  productId?: string;
  batchNo?: string;
}

function emptyForm(): BatchForm {
  return {
    productBatchId: 0,
    productId: 0,
    batchNo: '',
    expiredDate: null,
    qty: 0,
  };
}

@Component({
  selector: 'app-product-batch',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './product-batch.component.html',
  styleUrls: ['./product-batch.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ProductBatchComponent implements OnInit, OnDestroy {
  items: ProductBatch[] = [];
  filteredItems: ProductBatch[] = [];
  selectedItem: ProductBatch | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: BatchForm = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private productBatchService: ProductBatchService,
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
    return this.dialogMode === 'add' ? 'Add Product Batch' : 'Edit Product Batch';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  loadItems(): void {
    this.isLoading = true;
    this.productBatchService.getAll({ pageSize: 500 }).subscribe({
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
          detail: 'Could not load product batches. Please try again.'
        });
      }
    });
  }

  private mapItem(x: any): ProductBatch {
    return {
      productBatchId: x.productBatchId ?? x.id ?? 0,
      productId: Number(x.productId ?? 0),
      batchNo: x.batchNo ?? '',
      expiredDate: x.expiredDate ?? '',
      qty: Number(x.qty ?? 0),
    };
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parts = String(value).split('T')[0].split('-');
    if (parts.length === 3) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private toDateOnly(d: Date | null): string {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  formatExpiredDate(value: string): string {
    const d = this.parseDate(value);
    return d ? formatDate(d) : '—';
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
        item.batchNo,
        item.productId,
        item.expiredDate,
      ].some(v => v != null && String(v).toLowerCase().includes(term));
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(item: ProductBatch): void {
    this.dialogMode = 'edit';
    this.formData = {
      productBatchId: item.productBatchId,
      productId: item.productId,
      batchNo: item.batchNo,
      expiredDate: this.parseDate(item.expiredDate),
      qty: item.qty,
    };
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

    if (!this.formData.productId || this.formData.productId <= 0) {
      this.formErrors.productId = 'Product ID must be greater than 0';
    }
    if (!this.formData.batchNo?.trim()) {
      this.formErrors.batchNo = 'Batch number is required';
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

  private toCreateDto(f: BatchForm): CreateProductBatchDto {
    return {
      productId: f.productId,
      batchNo: f.batchNo.trim(),
      expiredDate: this.toDateOnly(f.expiredDate),
      qty: f.qty,
    };
  }

  private toUpdateDto(f: BatchForm): UpdateProductBatchDto {
    return {
      id: f.productBatchId,
      ...this.toCreateDto(f),
    };
  }

  private toProductBatch(f: BatchForm): ProductBatch {
    return {
      productBatchId: f.productBatchId,
      productId: f.productId,
      batchNo: f.batchNo.trim(),
      expiredDate: this.toDateOnly(f.expiredDate),
      qty: f.qty,
    };
  }

  private saveAdd(): void {
    this.productBatchService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapItem(res?.data ?? res ?? this.toProductBatch(this.formData));
        this.items = [...this.items, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Product Batch Added',
          detail: `"${added.batchNo}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add product batch. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.productBatchService.update(this.formData.productBatchId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const updated = this.toProductBatch(this.formData);
        const idx = this.items.findIndex(i => i.productBatchId === this.formData.productBatchId);
        if (idx !== -1) {
          this.items = [
            ...this.items.slice(0, idx),
            updated,
            ...this.items.slice(idx + 1)
          ];
        }
        if (this.selectedItem?.productBatchId === this.formData.productBatchId) {
          this.selectedItem = updated;
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Product Batch Updated',
          detail: `"${this.formData.batchNo}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update product batch. Please try again.'
        });
      }
    });
  }

  confirmDelete(item: ProductBatch, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete batch <strong>${item.batchNo}</strong>? This action cannot be undone.`,
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

  private executeDelete(item: ProductBatch): void {
    this.productBatchService.delete(item.productBatchId).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.productBatchId !== item.productBatchId);
        if (this.selectedItem?.productBatchId === item.productBatchId) {
          this.selectedItem = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Product Batch Deleted',
          detail: `"${item.batchNo}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete product batch. Please try again.'
        });
      }
    });
  }

  get itemReportConfig(): GridReportConfig {
    return {
      title: 'Product Batch List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'product-batches',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Batch No', field: 'batchNo' },
        { header: 'Product ID', field: 'productId' },
        { header: 'Expired Date', field: 'expiredDate', format: (v) => formatDate(v) },
        { header: 'Qty', field: 'qty' },
      ],
      rows: this.filteredItems.map(i => ({
        batchNo: i.batchNo,
        productId: i.productId,
        expiredDate: this.parseDate(i.expiredDate),
        qty: i.qty,
      }))
    };
  }
}
