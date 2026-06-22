import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  StockCount,
  StockCountService,
  CreateStockCountDto,
  UpdateStockCountDto
} from '../../services/stock-count.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  referenceNo?: string;
  warehouseId?: string;
  userId?: string;
  type?: string;
}

function emptyForm(): StockCount {
  return {
    stockCountId: 0,
    referenceNo: '',
    warehouseId: 0,
    categoryId: '',
    brandId: '',
    userId: 0,
    type: '',
    initialFile: '',
    finalFile: '',
    note: '',
    isAdjusted: false,
  };
}

@Component({
  selector: 'app-stock-count',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './stock-count.component.html',
  styleUrls: ['./stock-count.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class StockCountComponent implements OnInit, OnDestroy {
  stockCounts: StockCount[] = [];
  filteredStockCounts: StockCount[] = [];
  selectedStockCount: StockCount | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  adjustedFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: StockCount = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Adjusted', value: true as boolean | null },
    { label: 'Not Adjusted', value: false as boolean | null },
  ];

  readonly typeOptions = [
    { label: 'Full', value: 'full' },
    { label: 'Partial', value: 'partial' },
  ];

  constructor(
    private stockCountService: StockCountService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadStockCounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Stock Count' : 'Edit Stock Count';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.adjustedFilter !== null;
  }

  loadStockCounts(): void {
    this.isLoading = true;
    this.stockCountService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.stockCounts = raw.map(x => this.mapStockCount(x));
        this.totalRecords = res?.totalCount ?? this.stockCounts.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load stock counts. Please try again.'
        });
      }
    });
  }

  private mapStockCount(x: any): StockCount {
    return {
      stockCountId: x.stockCountId ?? x.id ?? 0,
      referenceNo: x.referenceNo ?? '',
      warehouseId: Number(x.warehouseId ?? 0),
      categoryId: x.categoryId ?? '',
      brandId: x.brandId ?? '',
      userId: Number(x.userId ?? 0),
      type: x.type ?? '',
      initialFile: x.initialFile ?? '',
      finalFile: x.finalFile ?? '',
      note: x.note ?? '',
      isAdjusted: x.isAdjusted ?? false,
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
    this.adjustedFilter = null;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredStockCounts = this.stockCounts.filter(sc => {
      const matchesSearch = !term
        || sc.referenceNo.toLowerCase().includes(term)
        || sc.type.toLowerCase().includes(term)
        || String(sc.warehouseId).includes(term)
        || String(sc.userId).includes(term);
      const matchesStatus = this.adjustedFilter === null || sc.isAdjusted === this.adjustedFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(stockCount: StockCount): void {
    this.dialogMode = 'edit';
    this.formData = { ...stockCount };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedStockCount) this.openEditDialog(this.selectedStockCount);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.referenceNo?.trim()) {
      this.formErrors.referenceNo = 'Reference number is required';
    }
    if (!this.formData.warehouseId || this.formData.warehouseId <= 0) {
      this.formErrors.warehouseId = 'Warehouse ID must be greater than 0';
    }
    if (!this.formData.userId || this.formData.userId <= 0) {
      this.formErrors.userId = 'User ID must be greater than 0';
    }
    if (!this.formData.type?.trim()) {
      this.formErrors.type = 'Type is required';
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

  private toCreateDto(f: StockCount): CreateStockCountDto {
    return {
      referenceNo: f.referenceNo.trim(),
      warehouseId: f.warehouseId,
      categoryId: f.categoryId?.trim() || null,
      brandId: f.brandId?.trim() || null,
      userId: f.userId,
      type: f.type.trim(),
      initialFile: f.initialFile?.trim() || null,
      finalFile: f.finalFile?.trim() || null,
      note: f.note?.trim() || null,
      isAdjusted: f.isAdjusted,
    };
  }

  private toUpdateDto(f: StockCount): UpdateStockCountDto {
    return {
      id: f.stockCountId,
      referenceNo: f.referenceNo.trim(),
      warehouseId: f.warehouseId,
      categoryId: f.categoryId?.trim() || null,
      brandId: f.brandId?.trim() || null,
      userId: f.userId,
      type: f.type.trim(),
      initialFile: f.initialFile?.trim() || null,
      finalFile: f.finalFile?.trim() || null,
      note: f.note?.trim() || null,
      isAdjusted: f.isAdjusted,
    };
  }

  private saveAdd(): void {
    this.stockCountService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapStockCount(res?.data ?? res ?? this.formData);
        this.stockCounts = [...this.stockCounts, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Stock Count Added',
          detail: `"${added.referenceNo}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add stock count. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.stockCountService.update(this.formData.stockCountId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.stockCounts.findIndex(sc => sc.stockCountId === this.formData.stockCountId);
        if (idx !== -1) {
          this.stockCounts = [
            ...this.stockCounts.slice(0, idx),
            { ...this.formData },
            ...this.stockCounts.slice(idx + 1)
          ];
        }
        if (this.selectedStockCount?.stockCountId === this.formData.stockCountId) {
          this.selectedStockCount = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Stock Count Updated',
          detail: `"${this.formData.referenceNo}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update stock count. Please try again.'
        });
      }
    });
  }

  confirmDelete(stockCount: StockCount, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${stockCount.referenceNo}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(stockCount)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedStockCount) this.confirmDelete(this.selectedStockCount, event);
  }

  private executeDelete(stockCount: StockCount): void {
    this.stockCountService.delete(stockCount.stockCountId).subscribe({
      next: () => {
        this.stockCounts = this.stockCounts.filter(sc => sc.stockCountId !== stockCount.stockCountId);
        if (this.selectedStockCount?.stockCountId === stockCount.stockCountId) {
          this.selectedStockCount = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Stock Count Deleted',
          detail: `"${stockCount.referenceNo}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete stock count. Please try again.'
        });
      }
    });
  }

  get stockCountReportConfig(): GridReportConfig {
    return {
      title: 'Stock Count List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'stock-counts',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Reference No', field: 'referenceNo' },
        { header: 'Warehouse ID', field: 'warehouseId', align: 'center' },
        { header: 'Type', field: 'type' },
        { header: 'User ID', field: 'userId', align: 'center' },
        {
          header: 'Adjusted',
          field: 'isAdjusted',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredStockCounts.map(sc => ({
        referenceNo: sc.referenceNo,
        warehouseId: sc.warehouseId,
        type: sc.type,
        userId: sc.userId,
        isAdjusted: sc.isAdjusted
      }))
    };
  }
}
