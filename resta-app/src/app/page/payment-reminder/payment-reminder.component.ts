import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, forkJoin, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import {
  GridReportConfig,
  GridReportToolbarComponent,
  formatDate,
  formatMoney,
  formatYesNo
} from '../../common/grid-report';
import { CategoryService } from '../../services/category.service';
import { CategoryType, CategoryTypeService } from '../../services/category-type.service';
import { CustomerService } from '../../services/customer.service';
import {
  CreatePaymentReminderDto,
  PaymentReminder,
  PaymentReminderService,
  UpdatePaymentReminderDto
} from '../../services/payment-reminder.service';

type DialogMode = 'add' | 'edit';

interface SelectOption<T = number> {
  label: string;
  value: T;
}

interface FormErrors {
  customerId?:     string;
  reminderTypeId?: string;
  reminderDate?:   string;
}

const REMINDER_TYPE_CODES = ['PAYMENT_REMINDER', 'REMINDER_TYPE'] as const;

function emptyForm(): PaymentReminder {
  return {
    paymentReminderId: 0,
    customerId:        0,
    reminderTypeId:    0,
    reminderDate:      new Date(),
    dueDate:           null,
    amount:            null,
    remarks:           '',
    isSent:            false,
    sentDate:          null,
  };
}

@Component({
  selector: 'app-payment-reminder',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './payment-reminder.component.html',
  styleUrls: ['./payment-reminder.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class PaymentReminderComponent implements OnInit, OnDestroy {

  reminders: PaymentReminder[] = [];
  selectedReminder: PaymentReminder | null = null;
  isLoading = false;
  lookupsLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: PaymentReminder = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;
  isLoadingDetail = false;

  customerOptions: SelectOption<number>[] = [];
  reminderTypeOptions: SelectOption<number>[] = [];
  private customerMap = new Map<number, string>();
  private reminderTypeMap = new Map<number, string>();

  constructor(
    private paymentReminderService: PaymentReminderService,
    private customerService: CustomerService,
    private categoryTypeService: CategoryTypeService,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadReminders(term));

    this.loadLookups();
    this.loadReminders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Payment Reminder' : 'Edit Payment Reminder';
  }

  get hasActiveSearch(): boolean {
    return !!this.searchTerm.trim();
  }

  formatDate(value: Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatAmount(amount: number | null): string {
    if (amount == null) return '—';
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getCustomerName(id: number): string {
    return this.customerMap.get(id) ?? '—';
  }

  getReminderTypeName(id: number): string {
    return this.reminderTypeMap.get(id) ?? '—';
  }

  onSearchChange(): void {
    this.search$.next(this.searchTerm);
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.loadReminders();
  }

  loadLookups(): void {
    this.lookupsLoading = true;
    forkJoin({
      customers: this.customerService.getAll({ pageSize: 500 }),
      types:     this.categoryTypeService.getAll({ pageSize: 200 }),
    }).subscribe({
      next: ({ customers, types }) => {
        this.bindCustomers(customers);
        const typeList = this.extractItems(types) as CategoryType[];
        const typeId = REMINDER_TYPE_CODES
          .map(code => typeList.find(t => t.categoryTypeCode?.toUpperCase() === code)?.categoryTypeId)
          .find(id => id != null);

        if (typeId) {
          this.categoryService.getAll({ categoryTypeId: typeId, pageSize: 500 }).subscribe({
            next: (cats) => {
              this.bindReminderTypes(cats);
              this.lookupsLoading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.lookupsLoading = false;
            }
          });
        } else {
          this.categoryService.getAll({ pageSize: 500 }).subscribe({
            next: (cats) => {
              this.bindReminderTypes(cats);
              this.lookupsLoading = false;
              this.cdr.detectChanges();
            },
            error: () => { this.lookupsLoading = false; }
          });
        }
      },
      error: () => {
        this.lookupsLoading = false;
        this.messageService.add({ severity: 'warn', summary: 'Lookups', detail: 'Could not load reference data.' });
      }
    });
  }

  private bindCustomers(res: any): void {
    const list = this.extractItems(res);
    this.customerMap.clear();
    this.customerOptions = list.map((c: any) => {
      const id = c.customerId ?? c.id ?? 0;
      const name = c.name ?? c.customerName ?? '';
      this.customerMap.set(id, name);
      return { label: name, value: id };
    });
  }

  private bindReminderTypes(res: any): void {
    const list = this.extractItems(res);
    this.reminderTypeMap.clear();
    this.reminderTypeOptions = list.map((c: any) => {
      const id = c.categoryId ?? c.id ?? 0;
      const name = c.categoryName ?? '';
      this.reminderTypeMap.set(id, name);
      return { label: name, value: id };
    });
  }

  loadReminders(search = ''): void {
    this.isLoading = true;
    this.paymentReminderService.getAll({ search, pageSize: 200 }).subscribe({
      next: (res: any) => {
        const raw = this.extractItems(res);
        this.reminders = raw.map((x: any) => this.mapReminder(x));
        this.totalRecords = res?.totalCount ?? this.reminders.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load payment reminders.'
        });
      }
    });
  }

  private mapReminder(x: any): PaymentReminder {
    return {
      paymentReminderId: Number(x.paymentReminderId ?? x.id ?? 0),
      customerId:        Number(x.customerId ?? 0),
      reminderTypeId:    Number(x.reminderTypeId ?? 0),
      reminderDate:      x.reminderDate ? this.parseDate(x.reminderDate) : null,
      dueDate:           x.dueDate ? this.parseDate(x.dueDate) : null,
      amount:            x.amount != null ? Number(x.amount) : null,
      remarks:           x.remarks ?? '',
      isSent:            !!x.isSent,
      sentDate:          x.sentDate ? new Date(x.sentDate) : null,
      customerName:      x.customerName,
      reminderTypeName:  x.reminderTypeName,
    };
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private parseDate(value: string | Date): Date {
    if (value instanceof Date) return value;
    const parts = String(value).split('T')[0].split('-');
    if (parts.length === 3) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return new Date(value);
  }

  private toDateOnly(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    if (this.reminderTypeOptions.length) this.formData.reminderTypeId = this.reminderTypeOptions[0].value;
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(item: PaymentReminder): void {
    this.dialogMode = 'edit';
    this.formErrors = {};
    this.dialogVisible = true;
    this.isLoadingDetail = true;
    this.formData = { ...item };

    this.paymentReminderService.getById(item.paymentReminderId).subscribe({
      next: (res: any) => {
        this.formData = this.mapReminder(res?.data ?? res);
        this.isLoadingDetail = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingDetail = false;
        this.messageService.add({
          severity: 'warn',
          summary: 'Load Details',
          detail: 'Could not load full reminder details.'
        });
      }
    });
  }

  onEditSelected(): void {
    if (this.selectedReminder) this.openEditDialog(this.selectedReminder);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
    this.isLoadingDetail = false;
  }

  onIsSentChange(): void {
    if (this.formData.isSent && !this.formData.sentDate) {
      this.formData.sentDate = new Date();
    }
    if (!this.formData.isSent) {
      this.formData.sentDate = null;
    }
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.formData.customerId) this.formErrors.customerId = 'Customer is required';
    if (!this.formData.reminderTypeId) this.formErrors.reminderTypeId = 'Reminder type is required';
    if (!this.formData.reminderDate) this.formErrors.reminderDate = 'Reminder date is required';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    this.dialogMode === 'add' ? this.saveAdd() : this.saveEdit();
  }

  private toCreateDto(f: PaymentReminder): CreatePaymentReminderDto {
    return {
      customerId:     f.customerId,
      reminderTypeId:   f.reminderTypeId,
      reminderDate:     this.toDateOnly(f.reminderDate)!,
      dueDate:          this.toDateOnly(f.dueDate),
      amount:           f.amount,
      remarks:          f.remarks?.trim() || null,
      isSent:           f.isSent,
      sentDate:         f.isSent ? (f.sentDate?.toISOString() ?? new Date().toISOString()) : null,
      createdBy:        null,
    };
  }

  private toUpdateDto(f: PaymentReminder): UpdatePaymentReminderDto {
    return {
      customerId:     f.customerId,
      reminderTypeId:   f.reminderTypeId,
      reminderDate:     this.toDateOnly(f.reminderDate)!,
      dueDate:          this.toDateOnly(f.dueDate),
      amount:           f.amount,
      remarks:          f.remarks?.trim() || null,
      isSent:           f.isSent,
      sentDate:         f.isSent ? this.toDateOnly(f.sentDate) : null,
      modifiedBy:       null,
    };
  }

  private saveAdd(): void {
    this.paymentReminderService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapReminder(res?.data ?? res ?? this.formData);
        this.reminders = [...this.reminders, added];
        this.totalRecords++;
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Added', detail: 'Payment reminder created.' });
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: err?.error?.title ?? err?.error ?? 'Could not add payment reminder.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.paymentReminderService.update(this.formData.paymentReminderId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.reminders.findIndex(r => r.paymentReminderId === this.formData.paymentReminderId);
        if (idx !== -1) {
          this.reminders = [
            ...this.reminders.slice(0, idx),
            { ...this.formData },
            ...this.reminders.slice(idx + 1)
          ];
        }
        if (this.selectedReminder?.paymentReminderId === this.formData.paymentReminderId) {
          this.selectedReminder = { ...this.formData };
        }
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Payment reminder updated.' });
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err?.error?.title ?? err?.error ?? 'Could not update payment reminder.'
        });
      }
    });
  }

  confirmDelete(item: PaymentReminder, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete payment reminder #<strong>${item.paymentReminderId}</strong>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(item)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedReminder) this.confirmDelete(this.selectedReminder, event);
  }

  private executeDelete(item: PaymentReminder): void {
    this.paymentReminderService.delete(item.paymentReminderId).subscribe({
      next: () => {
        this.reminders = this.reminders.filter(r => r.paymentReminderId !== item.paymentReminderId);
        if (this.selectedReminder?.paymentReminderId === item.paymentReminderId) {
          this.selectedReminder = null;
        }
        this.totalRecords--;
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Payment reminder deleted.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete payment reminder.' });
      }
    });
  }

  get reminderReportConfig(): GridReportConfig {
    return {
      title: 'Payment Reminders',
      subtitle: this.hasActiveSearch ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'payment_reminders',
      orientation: 'landscape',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Reminder Date', field: 'reminderDate', format: (v) => formatDate(v) },
        {
          header: 'Customer',
          field: 'customerId',
          format: (v, row) =>
            String(row['customerName'] ?? this.getCustomerName(v as number))
        },
        {
          header: 'Reminder Type',
          field: 'reminderTypeId',
          format: (v, row) =>
            String(row['reminderTypeName'] ?? this.getReminderTypeName(v as number))
        },
        { header: 'Due Date', field: 'dueDate', format: (v) => formatDate(v) },
        { header: 'Amount', field: 'amount', align: 'right', format: (v) => formatMoney(v) },
        { header: 'Sent', field: 'isSent', format: (v) => formatYesNo(v) }
      ],
      rows: this.reminders.map(r => ({
        reminderDate: r.reminderDate,
        customerId: r.customerId,
        customerName: r.customerName,
        reminderTypeId: r.reminderTypeId,
        reminderTypeName: r.reminderTypeName,
        dueDate: r.dueDate,
        amount: r.amount,
        isSent: r.isSent
      }))
    };
  }
}
