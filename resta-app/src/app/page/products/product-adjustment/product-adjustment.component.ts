import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../../common/grid-report';
import {
  CreateProductAdjustmentDto,
  ProductAdjustment,
  ProductAdjustmentService,
  UpdateProductAdjustmentDto
} from '../../../services/product-adjustment.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  adjustmentId?: string;
  productId?: string;
  action?: string;
}

function emptyForm(): ProductAdjustment {
  return {
    productAdjustmentId: 0,
    adjustmentId: 0,
    productId: 0,
    variantId: null,
    qty: 0,
    action: '',
  };
}

@Component({
  selector: 'app-product-adjustment',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './product-adjustment.component.html',
  styleUrls: ['./product-adjustment.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ProductAdjustmentComponent implements OnInit, OnDestroy {
  items: ProductAdjustment[] = [];
  filteredItems: ProductAdjustment[] = [];
  selectedItem: ProductAdjustment | null = null;
  isLoading = false;
  totalRecords = 0;

  idSearchTerm = '';
  actionSearchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: ProductAdjustment = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private productAdjustmentService: ProductAdjustmentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Product Adjustment' : 'Edit Product Adjustment';
  }

  get hasActiveFilters(): boolean {
    return !!this.idSearchTerm.trim() || !!this.actionSearchTerm.trim();
  }

  loadItems(): void {
    this.isLoading = true;
    this.productAdjustmentService.getAll({ pageSize: 500 }).subscribe({
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
          detail: 'Could not load product adjustments. Please try again.'
        });
      }
    });
  }

  private mapItem(x: any): ProductAdjustment {
    return {
      productAdjustmentId: x.productAdjustmentId ?? x.id ?? 0,
      adjustmentId: Number(x.adjustmentId ?? 0),
      productId: Number(x.productId ?? 0),
      variantId: x.variantId != null ? Number(x.variantId) : null,
      qty: Number(x.qty ?? 0),
      action: x.action ?? '',
    };
  }

  onSearchChange(): void {
    this.search$.next();
  }

  onClearSearch(): void {
    this.idSearchTerm = '';
    this.actionSearchTerm = '';
    this.applyFilter();
  }

  private applyFilter(): void {
    const idTerm = this.idSearchTerm.trim();
    const actionTerm = this.actionSearchTerm.trim().toLowerCase();

    this.filteredItems = this.items.filter(item => {
      const matchesIds = !idTerm || [
        item.productAdjustmentId,
        item.adjustmentId,
        item.productId,
        item.variantId
      ].some(id => id != null && String(id).includes(idTerm));

      const matchesAction = !actionTerm
        || item.action.toLowerCase().includes(actionTerm);

      return matchesIds && matchesAction;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(item: ProductAdjustment): void {
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

    if (!this.formData.adjustmentId || this.formData.adjustmentId <= 0) {
      this.formErrors.adjustmentId = 'Adjustment ID must be greater than 0';
    }
    if (!this.formData.productId || this.formData.productId <= 0) {
      this.formErrors.productId = 'Product ID must be greater than 0';
    }
    if (!this.formData.action?.trim()) {
      this.formErrors.action = 'Action is required';
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

  private toCreateDto(f: ProductAdjustment): CreateProductAdjustmentDto {
    return {
      adjustmentId: f.adjustmentId,
      productId: f.productId,
      variantId: f.variantId,
      qty: f.qty,
      action: f.action.trim(),
    };
  }

  private toUpdateDto(f: ProductAdjustment): UpdateProductAdjustmentDto {
    return {
      id: f.productAdjustmentId,
      adjustmentId: f.adjustmentId,
      productId: f.productId,
      variantId: f.variantId,
      qty: f.qty,
      action: f.action.trim(),
    };
  }

  private saveAdd(): void {
    this.productAdjustmentService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapItem(res?.data ?? res ?? this.formData);
        this.items = [...this.items, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Adjustment Added',
          detail: 'Product adjustment was added successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add product adjustment. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.productAdjustmentService.update(
      this.formData.productAdjustmentId,
      this.toUpdateDto(this.formData)
    ).subscribe({
      next: () => {
        const idx = this.items.findIndex(i => i.productAdjustmentId === this.formData.productAdjustmentId);
        if (idx !== -1) {
          this.items = [
            ...this.items.slice(0, idx),
            { ...this.formData },
            ...this.items.slice(idx + 1)
          ];
        }
        if (this.selectedItem?.productAdjustmentId === this.formData.productAdjustmentId) {
          this.selectedItem = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Adjustment Updated',
          detail: 'Product adjustment was updated successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update product adjustment. Please try again.'
        });
      }
    });
  }

  confirmDelete(item: ProductAdjustment, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete product adjustment #<strong>${item.productAdjustmentId}</strong>? This action cannot be undone.`,
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

  private executeDelete(item: ProductAdjustment): void {
    this.productAdjustmentService.delete(item.productAdjustmentId).subscribe({
      next: () => {
        this.items = this.items.filter(i => i.productAdjustmentId !== item.productAdjustmentId);
        if (this.selectedItem?.productAdjustmentId === item.productAdjustmentId) {
          this.selectedItem = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Adjustment Deleted',
          detail: 'Product adjustment was deleted.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete product adjustment. Please try again.'
        });
      }
    });
  }

  getSelectedLabel(): string {
    if (!this.selectedItem) return '';
    return `#${this.selectedItem.productAdjustmentId} — Adj ${this.selectedItem.adjustmentId}`;
  }

  get productAdjustmentReportConfig(): GridReportConfig {
    return {
      title: 'Product Adjustment List',
      subtitle: this.hasActiveFilters
        ? `IDs: ${this.idSearchTerm || '—'} | Action: ${this.actionSearchTerm || '—'}`
        : undefined,
      fileName: 'product-adjustments',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Adjustment ID', field: 'adjustmentId', align: 'center' },
        { header: 'Product ID', field: 'productId', align: 'center' },
        { header: 'Qty', field: 'qty', align: 'right' },
        { header: 'Action', field: 'action' },
      ],
      rows: this.filteredItems.map(i => ({
        adjustmentId: i.adjustmentId,
        productId: i.productId,
        qty: i.qty,
        action: i.action,
      }))
    };
  }
}
