// customer-credit-debit-note.component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatMoney } from '../../common/grid-report';
import { CustomerService } from '../../services/customer.service';
import {
  CreateCustomerCreditDebitNoteDto,
  CustomerCreditDebitNote,
  CustomerCreditDebitNoteService,
  UpdateCustomerCreditDebitNoteDto
} from '../../services/customer-credit-debit-note.service';

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

function emptyForm(): CustomerCreditDebitNote {
  return {
    customerCreditDebitNoteId: 0,
    voucherNo:                 '',
    voucherDate:               new Date(),
    voucherType:               null,
    customerId:                null,
    totalAmount:               null,
    narration:                 '',
  };
}

@Component({
  selector: 'app-customer-credit-debit-note',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './customer-credit-debit-note.component.html',
  styleUrls: ['./customer-credit-debit-note.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CustomerCreditDebitNoteComponent implements OnInit, OnDestroy {

  notes: CustomerCreditDebitNote[] = [];
  selectedNote: CustomerCreditDebitNote | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: CustomerCreditDebitNote = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  customerOptions: SelectOption<number>[] = [];
  private customerMap = new Map<number, string>();

  readonly voucherTypeOptions: SelectOption<number>[] = [
    { label: 'Credit Note', value: 1 },
    { label: 'Debit Note',  value: 2 },
  ];

  private readonly voucherTypeLabels: Record<number, string> = {
    1: 'Credit Note',
    2: 'Debit Note',
  };

  constructor(
    private noteService: CustomerCreditDebitNoteService,
    private customerService: CustomerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadNotes(term));

    this.loadCustomers();
    this.loadNotes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add'
      ? 'Add Customer Credit / Debit Note'
      : 'Edit Customer Credit / Debit Note';
  }

  get hasActiveSearch(): boolean {
    return !!this.searchTerm.trim();
  }

  getVoucherTypeName(type: number | null): string {
    return type != null ? (this.voucherTypeLabels[type] ?? String(type)) : '—';
  }

  getVoucherTypeKey(type: number | null): string {
    if (type === 1) return 'credit';
    if (type === 2) return 'debit';
    return 'other';
  }

  getCustomerName(id: number | null): string {
    if (id == null) return '—';
    return this.customerMap.get(id) ?? String(id);
  }

  formatDate(date: Date | null): string {
    if (!date) return '—';
    return date.toLocaleDateString('en-GB');
  }

  formatAmount(amount: number | null): string {
    if (amount == null) return '—';
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private loadCustomers(): void {
    this.customerService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data)  ? res.data
          : [];
        this.customerMap.clear();
        this.customerOptions = raw.map((x: any) => {
          const id = x.customerId ?? x.id ?? 0;
          const name = x.name ?? `Customer #${id}`;
          this.customerMap.set(id, name);
          return { label: name, value: id };
        });
        this.cdr.detectChanges();
      }
    });
  }

  loadNotes(search = ''): void {
    this.isLoading = true;
    this.noteService.getAll({ search, pageSize: 200 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data)  ? res.data
          : [];
        this.notes = raw.map(x => this.mapNote(x));
        this.totalRecords = res?.totalCount ?? this.notes.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load customer credit/debit notes. Please try again.'
        });
      }
    });
  }

  private mapNote(x: any): CustomerCreditDebitNote {
    return {
      customerCreditDebitNoteId: Number(x.customerCreditDebitNoteId ?? x.id ?? 0),
      voucherNo:                 x.voucherNo ?? '',
      voucherDate:               x.voucherDate ? new Date(x.voucherDate) : null,
      voucherType:               x.voucherType != null ? Number(x.voucherType) : null,
      customerId:                x.customerId != null ? Number(x.customerId) : null,
      totalAmount:               x.totalAmount != null ? Number(x.totalAmount) : null,
      narration:                 x.narration ?? '',
      createdDate:               x.createdDate ? new Date(x.createdDate) : null,
      createdBy:                 x.createdBy ?? null,
      modifiedDate:              x.modifiedDate ? new Date(x.modifiedDate) : null,
      modifiedBy:                x.modifiedBy ?? null,
    };
  }

  onSearchChange(): void {
    this.search$.next(this.searchTerm);
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.loadNotes();
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData   = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(note: CustomerCreditDebitNote): void {
    this.dialogMode = 'edit';
    this.formData   = {
      ...note,
      voucherDate: note.voucherDate ? new Date(note.voucherDate) : null,
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedNote) this.openEditDialog(this.selectedNote);
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

  private toCreateDto(f: CustomerCreditDebitNote): CreateCustomerCreditDebitNoteDto {
    return {
      voucherNo:   f.voucherNo || null,
      voucherDate: f.voucherDate,
      voucherType: f.voucherType,
      customerId:  f.customerId,
      totalAmount: f.totalAmount,
      narration:   f.narration || null,
      createdBy:   null,
    };
  }

  private toUpdateDto(f: CustomerCreditDebitNote): UpdateCustomerCreditDebitNoteDto {
    return {
      voucherNo:   f.voucherNo || null,
      voucherDate: f.voucherDate,
      voucherType: f.voucherType,
      customerId:  f.customerId,
      totalAmount: f.totalAmount,
      narration:   f.narration || null,
      modifiedBy:  null,
    };
  }

  private saveAdd(): void {
    this.noteService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapNote(res?.data ?? res ?? this.formData);
        this.notes = [added, ...this.notes];
        this.totalRecords++;
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Note Added',
          detail: `Note "${added.voucherNo || added.customerCreditDebitNoteId}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add credit/debit note. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.noteService.update(
      this.formData.customerCreditDebitNoteId,
      this.toUpdateDto(this.formData)
    ).subscribe({
      next: () => {
        const idx = this.notes.findIndex(
          n => n.customerCreditDebitNoteId === this.formData.customerCreditDebitNoteId
        );
        if (idx !== -1) {
          this.notes = [
            ...this.notes.slice(0, idx),
            { ...this.formData },
            ...this.notes.slice(idx + 1)
          ];
        }
        if (this.selectedNote?.customerCreditDebitNoteId === this.formData.customerCreditDebitNoteId) {
          this.selectedNote = { ...this.formData };
        }
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Note Updated',
          detail: `Note "${this.formData.voucherNo || this.formData.customerCreditDebitNoteId}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update credit/debit note. Please try again.'
        });
      }
    });
  }

  confirmDelete(note: CustomerCreditDebitNote, event: Event): void {
    event.stopPropagation();
    const label = note.voucherNo || `#${note.customerCreditDebitNoteId}`;
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete note "<strong>${label}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(note)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedNote) this.confirmDelete(this.selectedNote, event);
  }

  private executeDelete(note: CustomerCreditDebitNote): void {
    this.noteService.delete(note.customerCreditDebitNoteId).subscribe({
      next: () => {
        this.notes = this.notes.filter(
          n => n.customerCreditDebitNoteId !== note.customerCreditDebitNoteId
        );
        if (this.selectedNote?.customerCreditDebitNoteId === note.customerCreditDebitNoteId) {
          this.selectedNote = null;
        }
        this.totalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Note Deleted',
          detail: `Note "${note.voucherNo || note.customerCreditDebitNoteId}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete credit/debit note. Please try again.'
        });
      }
    });
  }

  get noteReportConfig(): GridReportConfig {
    return {
      title: 'Customer Credit / Debit Notes',
      subtitle: this.hasActiveSearch ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'customer_credit_debit_notes',
      orientation: 'landscape',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Voucher No.', field: 'voucherNo' },
        { header: 'Date', field: 'voucherDate', format: (v) => this.formatDate(v as Date | null) },
        {
          header: 'Type',
          field: 'voucherType',
          format: (v) => this.getVoucherTypeName(v as number | null)
        },
        {
          header: 'Customer',
          field: 'customerId',
          format: (v) => this.getCustomerName(v as number | null)
        },
        { header: 'Amount', field: 'totalAmount', align: 'right', format: (v) => formatMoney(v) },
        { header: 'Narration', field: 'narration' }
      ],
      rows: this.notes.map(n => ({
        voucherNo: n.voucherNo,
        voucherDate: n.voucherDate,
        voucherType: n.voucherType,
        customerId: n.customerId,
        totalAmount: n.totalAmount,
        narration: n.narration
      }))
    };
  }
}
