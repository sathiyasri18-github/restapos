import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  Adjustment,
  AdjustmentService,
  CreateAdjustmentDto,
  UpdateAdjustmentDto
} from '../../services/adjustment.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  referenceNo?: string;
  warehouseId?: string;
}

function emptyForm(): Adjustment {
  return {
    adjustmentId: 0,
    referenceNo: '',
    warehouseId: 0,
    document: '',
    totalQty: 0,
    item: 0,
    note: '',
  };
}

@Component({
  selector: 'app-adjustment',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './adjustment.component.html',
  styleUrls: ['./adjustment.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class AdjustmentComponent implements OnInit, OnDestroy {
  adjustments: Adjustment[] = [];
  filteredAdjustments: Adjustment[] = [];
  selectedAdjustment: Adjustment | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Adjustment = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private adjustmentService: AdjustmentService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadAdjustments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Adjustment' : 'Edit Adjustment';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  loadAdjustments(): void {
    this.isLoading = true;
    this.adjustmentService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.adjustments = raw.map(x => this.mapAdjustment(x));
        this.totalRecords = res?.totalCount ?? this.adjustments.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load adjustments. Please try again.'
        });
      }
    });
  }

  private mapAdjustment(x: any): Adjustment {
    return {
      adjustmentId: x.adjustmentId ?? x.id ?? 0,
      referenceNo: x.referenceNo ?? '',
      warehouseId: x.warehouseId ?? 0,
      document: x.document ?? '',
      totalQty: x.totalQty ?? 0,
      item: x.item ?? 0,
      note: x.note ?? '',
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
    this.filteredAdjustments = this.adjustments.filter(a => {
      if (!term) return true;
      return a.referenceNo.toLowerCase().includes(term)
        || (a.note ?? '').toLowerCase().includes(term);
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(adjustment: Adjustment): void {
    this.dialogMode = 'edit';
    this.formData = { ...adjustment };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedAdjustment) this.openEditDialog(this.selectedAdjustment);
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

  private toCreateDto(f: Adjustment): CreateAdjustmentDto {
    return {
      referenceNo: f.referenceNo.trim(),
      warehouseId: f.warehouseId,
      document: f.document?.trim() || null,
      totalQty: f.totalQty ?? 0,
      item: f.item ?? 0,
      note: f.note?.trim() || null,
    };
  }

  private toUpdateDto(f: Adjustment): UpdateAdjustmentDto {
    return {
      id: f.adjustmentId,
      referenceNo: f.referenceNo.trim(),
      warehouseId: f.warehouseId,
      document: f.document?.trim() || null,
      totalQty: f.totalQty ?? 0,
      item: f.item ?? 0,
      note: f.note?.trim() || null,
    };
  }

  private saveAdd(): void {
    this.adjustmentService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapAdjustment(res?.data ?? res ?? this.formData);
        this.adjustments = [...this.adjustments, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Adjustment Added',
          detail: `"${added.referenceNo}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add adjustment. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.adjustmentService.update(this.formData.adjustmentId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.adjustments.findIndex(a => a.adjustmentId === this.formData.adjustmentId);
        if (idx !== -1) {
          this.adjustments = [
            ...this.adjustments.slice(0, idx),
            { ...this.formData },
            ...this.adjustments.slice(idx + 1)
          ];
        }
        if (this.selectedAdjustment?.adjustmentId === this.formData.adjustmentId) {
          this.selectedAdjustment = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Adjustment Updated',
          detail: `"${this.formData.referenceNo}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update adjustment. Please try again.'
        });
      }
    });
  }

  confirmDelete(adjustment: Adjustment, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${adjustment.referenceNo}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(adjustment)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedAdjustment) this.confirmDelete(this.selectedAdjustment, event);
  }

  private executeDelete(adjustment: Adjustment): void {
    this.adjustmentService.delete(adjustment.adjustmentId).subscribe({
      next: () => {
        this.adjustments = this.adjustments.filter(a => a.adjustmentId !== adjustment.adjustmentId);
        if (this.selectedAdjustment?.adjustmentId === adjustment.adjustmentId) {
          this.selectedAdjustment = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Adjustment Deleted',
          detail: `"${adjustment.referenceNo}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete adjustment. Please try again.'
        });
      }
    });
  }

  get adjustmentReportConfig(): GridReportConfig {
    return {
      title: 'Adjustment List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'adjustments',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Reference No', field: 'referenceNo' },
        { header: 'Warehouse ID', field: 'warehouseId', align: 'center' },
        { header: 'Total Qty', field: 'totalQty', align: 'center' },
        { header: 'Items', field: 'item', align: 'center' },
      ],
      rows: this.filteredAdjustments.map(a => ({
        referenceNo: a.referenceNo,
        warehouseId: a.warehouseId,
        totalQty: a.totalQty,
        item: a.item,
      }))
    };
  }
}
