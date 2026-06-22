import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  Transfer,
  TransferService,
  CreateTransferDto,
  UpdateTransferDto
} from '../../services/transfer.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  referenceNo?: string;
  userId?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
}

function emptyForm(): Transfer {
  return {
    transferId: 0,
    referenceNo: '',
    userId: 0,
    status: 1,
    fromWarehouseId: 0,
    toWarehouseId: 0,
    item: 0,
    totalQty: 0,
    totalTax: 0,
    totalCost: 0,
    shippingCost: null,
    grandTotal: 0,
    document: '',
    note: '',
  };
}

@Component({
  selector: 'app-transfer',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class TransferComponent implements OnInit, OnDestroy {
  transfers: Transfer[] = [];
  filteredTransfers: Transfer[] = [];
  selectedTransfer: Transfer | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Transfer = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusOptions = [
    { label: 'Pending', value: 0 },
    { label: 'Completed', value: 1 },
    { label: 'Cancelled', value: 2 },
  ];

  constructor(
    private transferService: TransferService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadTransfers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Transfer' : 'Edit Transfer';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  getStatusLabel(status: number): string {
    return this.statusOptions.find(o => o.value === status)?.label ?? String(status);
  }

  formatAmount(value: number | null | undefined): string {
    if (value == null) return '—';
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  loadTransfers(): void {
    this.isLoading = true;
    this.transferService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.transfers = raw.map(x => this.mapTransfer(x));
        this.totalRecords = res?.totalCount ?? this.transfers.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load transfers. Please try again.'
        });
      }
    });
  }

  private mapTransfer(x: any): Transfer {
    return {
      transferId: x.transferId ?? x.id ?? 0,
      referenceNo: x.referenceNo ?? '',
      userId: Number(x.userId ?? 0),
      status: Number(x.status ?? 0),
      fromWarehouseId: Number(x.fromWarehouseId ?? 0),
      toWarehouseId: Number(x.toWarehouseId ?? 0),
      item: Number(x.item ?? 0),
      totalQty: Number(x.totalQty ?? 0),
      totalTax: Number(x.totalTax ?? 0),
      totalCost: Number(x.totalCost ?? 0),
      shippingCost: x.shippingCost != null ? Number(x.shippingCost) : null,
      grandTotal: Number(x.grandTotal ?? 0),
      document: x.document ?? '',
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
    this.filteredTransfers = this.transfers.filter(t => {
      if (!term) return true;
      return t.referenceNo.toLowerCase().includes(term)
        || String(t.fromWarehouseId).includes(term)
        || String(t.toWarehouseId).includes(term)
        || this.getStatusLabel(t.status).toLowerCase().includes(term)
        || String(t.grandTotal).includes(term);
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(transfer: Transfer): void {
    this.dialogMode = 'edit';
    this.formData = { ...transfer };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedTransfer) this.openEditDialog(this.selectedTransfer);
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
    if (!this.formData.userId || this.formData.userId <= 0) {
      this.formErrors.userId = 'User ID must be greater than 0';
    }
    if (!this.formData.fromWarehouseId || this.formData.fromWarehouseId <= 0) {
      this.formErrors.fromWarehouseId = 'From warehouse ID must be greater than 0';
    }
    if (!this.formData.toWarehouseId || this.formData.toWarehouseId <= 0) {
      this.formErrors.toWarehouseId = 'To warehouse ID must be greater than 0';
    }
    if (this.formData.fromWarehouseId > 0
      && this.formData.toWarehouseId > 0
      && this.formData.fromWarehouseId === this.formData.toWarehouseId) {
      this.formErrors.toWarehouseId = 'To warehouse must differ from from warehouse';
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

  private toCreateDto(f: Transfer): CreateTransferDto {
    return {
      referenceNo: f.referenceNo.trim(),
      userId: f.userId,
      status: f.status,
      fromWarehouseId: f.fromWarehouseId,
      toWarehouseId: f.toWarehouseId,
      item: f.item,
      totalQty: f.totalQty,
      totalTax: f.totalTax,
      totalCost: f.totalCost,
      shippingCost: f.shippingCost,
      grandTotal: f.grandTotal,
      document: f.document?.trim() || null,
      note: f.note?.trim() || null,
    };
  }

  private toUpdateDto(f: Transfer): UpdateTransferDto {
    return {
      id: f.transferId,
      referenceNo: f.referenceNo.trim(),
      userId: f.userId,
      status: f.status,
      fromWarehouseId: f.fromWarehouseId,
      toWarehouseId: f.toWarehouseId,
      item: f.item,
      totalQty: f.totalQty,
      totalTax: f.totalTax,
      totalCost: f.totalCost,
      shippingCost: f.shippingCost,
      grandTotal: f.grandTotal,
      document: f.document?.trim() || null,
      note: f.note?.trim() || null,
    };
  }

  private saveAdd(): void {
    this.transferService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapTransfer(res?.data ?? res ?? this.formData);
        this.transfers = [...this.transfers, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Transfer Added',
          detail: `"${added.referenceNo}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add transfer. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.transferService.update(this.formData.transferId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.transfers.findIndex(t => t.transferId === this.formData.transferId);
        if (idx !== -1) {
          this.transfers = [
            ...this.transfers.slice(0, idx),
            { ...this.formData },
            ...this.transfers.slice(idx + 1)
          ];
        }
        if (this.selectedTransfer?.transferId === this.formData.transferId) {
          this.selectedTransfer = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Transfer Updated',
          detail: `"${this.formData.referenceNo}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update transfer. Please try again.'
        });
      }
    });
  }

  confirmDelete(transfer: Transfer, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${transfer.referenceNo}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(transfer)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedTransfer) this.confirmDelete(this.selectedTransfer, event);
  }

  private executeDelete(transfer: Transfer): void {
    this.transferService.delete(transfer.transferId).subscribe({
      next: () => {
        this.transfers = this.transfers.filter(t => t.transferId !== transfer.transferId);
        if (this.selectedTransfer?.transferId === transfer.transferId) {
          this.selectedTransfer = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Transfer Deleted',
          detail: `"${transfer.referenceNo}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete transfer. Please try again.'
        });
      }
    });
  }

  get transferReportConfig(): GridReportConfig {
    return {
      title: 'Transfer List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'transfers',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Reference No', field: 'referenceNo' },
        { header: 'From Warehouse', field: 'fromWarehouseId', align: 'center' },
        { header: 'To Warehouse', field: 'toWarehouseId', align: 'center' },
        { header: 'Status', field: 'status' },
        { header: 'Grand Total', field: 'grandTotal', align: 'right' },
      ],
      rows: this.filteredTransfers.map(t => ({
        referenceNo: t.referenceNo,
        fromWarehouseId: t.fromWarehouseId,
        toWarehouseId: t.toWarehouseId,
        status: this.getStatusLabel(t.status),
        grandTotal: this.formatAmount(t.grandTotal),
      }))
    };
  }
}
