// voucher-entry.component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatDate, formatMoney } from '../../common/grid-report';
import { AccountHeadService } from '../../services/account-head.service';
import {
  CreateVoucherEntryDto,
  UpdateVoucherEntryDto,
  VoucherEntry,
  VoucherEntryService
} from '../../services/voucher-entry.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  voucherNo?:   string;
  totalAmount?: string;
  narration?:   string;
}

interface SelectOption<T> {
  label: string;
  value: T;
}

function emptyForm(): VoucherEntry {
  return {
    voucherEntryId: 0,
    voucherNo:      '',
    voucherDate:    new Date(),
    voucherType:    null,
    accountHeadId:  null,
    totalAmount:    null,
    narration:      '',
  };
}

@Component({
  selector: 'app-voucher-entry',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './voucher-entry.component.html',
  styleUrls: ['./voucher-entry.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class VoucherEntryComponent implements OnInit, OnDestroy {

  voucherEntries: VoucherEntry[] = [];
  selectedVoucher: VoucherEntry | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: VoucherEntry = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  accountHeadOptions: SelectOption<number>[] = [];
  private accountHeadMap = new Map<number, string>();

  readonly voucherTypeOptions: SelectOption<number>[] = [
    { label: 'Receipt',  value: 1 },
    { label: 'Payment',  value: 2 },
    { label: 'Journal',  value: 3 },
    { label: 'Contra',   value: 4 },
  ];

  private readonly voucherTypeLabels: Record<number, string> = {
    1: 'Receipt',
    2: 'Payment',
    3: 'Journal',
    4: 'Contra',
  };

  constructor(
    private voucherEntryService: VoucherEntryService,
    private accountHeadService: AccountHeadService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadVoucherEntries(term));

    this.loadAccountHeads();
    this.loadVoucherEntries();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Voucher Entry' : 'Edit Voucher Entry';
  }

  get hasActiveSearch(): boolean {
    return !!this.searchTerm.trim();
  }

  getVoucherTypeName(type: number | null): string {
    return type != null ? (this.voucherTypeLabels[type] ?? String(type)) : '—';
  }

  getAccountHeadName(id: number | null): string {
    if (id == null) return '—';
    return this.accountHeadMap.get(id) ?? String(id);
  }

  formatDate(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleDateString('en-GB');
  }

  formatAmount(amount: number | null): string {
    if (amount == null) return '—';
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private loadAccountHeads(): void {
    this.accountHeadService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data)  ? res.data
          : [];
        this.accountHeadMap.clear();
        this.accountHeadOptions = raw.map((x: any) => {
          const id = x.accountHeadId ?? x.id ?? 0;
          const name = x.name ?? `Account #${id}`;
          this.accountHeadMap.set(id, name);
          return { label: name, value: id };
        });
        this.cdr.detectChanges();
      }
    });
  }

  loadVoucherEntries(search = ''): void {
    this.isLoading = true;
    this.voucherEntryService.getAll({ search, pageSize: 200 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data)  ? res.data
          : [];
        this.voucherEntries = raw.map(x => this.mapVoucherEntry(x));
        this.totalRecords = res?.totalCount ?? this.voucherEntries.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load voucher entries. Please try again.'
        });
      }
    });
  }

  private mapVoucherEntry(x: any): VoucherEntry {
    return {
      voucherEntryId: Number(x.voucherEntryId ?? x.id ?? 0),
      voucherNo:      x.voucherNo ?? '',
      voucherDate:    x.voucherDate ? new Date(x.voucherDate) : null,
      voucherType:    x.voucherType != null ? Number(x.voucherType) : null,
      accountHeadId:  x.accountHeadId != null ? Number(x.accountHeadId) : null,
      totalAmount:    x.totalAmount != null ? Number(x.totalAmount) : null,
      narration:      x.narration ?? '',
      createdDate:    x.createdDate ? new Date(x.createdDate) : null,
      createdBy:      x.createdBy ?? null,
      modifiedDate:   x.modifiedDate ? new Date(x.modifiedDate) : null,
      modifiedBy:     x.modifiedBy ?? null,
    };
  }

  onSearchChange(): void {
    this.search$.next(this.searchTerm);
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.loadVoucherEntries();
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData   = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(voucher: VoucherEntry): void {
    this.dialogMode = 'edit';
    this.formData   = {
      ...voucher,
      voucherDate: voucher.voucherDate ? new Date(voucher.voucherDate) : null,
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedVoucher) this.openEditDialog(this.selectedVoucher);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving   = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (this.formData.voucherNo && this.formData.voucherNo.length > 20) {
      this.formErrors.voucherNo = 'Voucher number must not exceed 20 characters';
    }
    if (this.formData.totalAmount != null && this.formData.totalAmount < 0) {
      this.formErrors.totalAmount = 'Total amount cannot be negative';
    }
    if (this.formData.narration && this.formData.narration.length > 500) {
      this.formErrors.narration = 'Narration must not exceed 500 characters';
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

  private toCreateDto(f: VoucherEntry): CreateVoucherEntryDto {
    return {
      voucherNo:     f.voucherNo || null,
      voucherDate:   f.voucherDate,
      voucherType:   f.voucherType,
      accountHeadId: f.accountHeadId,
      totalAmount:   f.totalAmount,
      narration:     f.narration || null,
      createdBy:     null,
    };
  }

  private toUpdateDto(f: VoucherEntry): UpdateVoucherEntryDto {
    return {
      voucherNo:     f.voucherNo || null,
      voucherDate:   f.voucherDate,
      voucherType:   f.voucherType,
      accountHeadId: f.accountHeadId,
      totalAmount:   f.totalAmount,
      narration:     f.narration || null,
      modifiedBy:    null,
    };
  }

  private saveAdd(): void {
    this.voucherEntryService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapVoucherEntry(res?.data ?? res ?? this.formData);
        this.voucherEntries = [added, ...this.voucherEntries];
        this.totalRecords++;
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Voucher Added',
          detail: `Voucher "${added.voucherNo || added.voucherEntryId}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add voucher entry. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.voucherEntryService.update(
      this.formData.voucherEntryId,
      this.toUpdateDto(this.formData)
    ).subscribe({
      next: () => {
        const idx = this.voucherEntries.findIndex(
          v => v.voucherEntryId === this.formData.voucherEntryId
        );
        if (idx !== -1) {
          this.voucherEntries = [
            ...this.voucherEntries.slice(0, idx),
            { ...this.formData },
            ...this.voucherEntries.slice(idx + 1)
          ];
        }
        if (this.selectedVoucher?.voucherEntryId === this.formData.voucherEntryId) {
          this.selectedVoucher = { ...this.formData };
        }
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Voucher Updated',
          detail: `Voucher "${this.formData.voucherNo || this.formData.voucherEntryId}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update voucher entry. Please try again.'
        });
      }
    });
  }

  confirmDelete(voucher: VoucherEntry, event: Event): void {
    event.stopPropagation();
    const label = voucher.voucherNo || `#${voucher.voucherEntryId}`;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete voucher "<strong>${label}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(voucher)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedVoucher) this.confirmDelete(this.selectedVoucher, event);
  }

  private executeDelete(voucher: VoucherEntry): void {
    this.voucherEntryService.delete(voucher.voucherEntryId).subscribe({
      next: () => {
        this.voucherEntries = this.voucherEntries.filter(
          v => v.voucherEntryId !== voucher.voucherEntryId
        );
        if (this.selectedVoucher?.voucherEntryId === voucher.voucherEntryId) {
          this.selectedVoucher = null;
        }
        this.totalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Voucher Deleted',
          detail: `Voucher "${voucher.voucherNo || voucher.voucherEntryId}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete voucher entry. Please try again.'
        });
      }
    });
  }

  get voucherReportConfig(): GridReportConfig {
    return {
      title: 'Voucher Entry List',
      subtitle: this.hasActiveSearch ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'voucher_entries',
      orientation: 'landscape',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Voucher No.', field: 'voucherNo' },
        { header: 'Date', field: 'voucherDate', format: (v) => formatDate(v) },
        { header: 'Type', field: 'voucherType' },
        {
          header: 'Account Head',
          field: 'accountHeadId',
          format: (v) => v != null ? this.getAccountHeadName(v as number) : '—'
        },
        { header: 'Amount', field: 'totalAmount', align: 'right', format: (v) => formatMoney(v) },
        { header: 'Narration', field: 'narration' }
      ],
      rows: this.voucherEntries.map(v => ({
        voucherNo: v.voucherNo,
        voucherDate: v.voucherDate,
        voucherType: v.voucherType,
        accountHeadId: v.accountHeadId,
        totalAmount: v.totalAmount,
        narration: v.narration
      }))
    };
  }
}
