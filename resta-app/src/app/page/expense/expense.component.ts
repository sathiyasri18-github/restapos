import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, forkJoin, takeUntil, catchError, of } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import { Expense, ExpenseService, CreateExpenseDto, UpdateExpenseDto } from '../../services/expense.service';
import { ExpenseCategoryService } from '../../services/expense-category.service';
import { WarehouseService } from '../../services/warehouse.service';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';

type DialogMode = 'add' | 'edit';

interface SelectOption {
  label: string;
  value: number;
}

interface FormErrors {
  referenceNo?: string;
  expenseCategoryId?: string;
  warehouseId?: string;
  accountId?: string;
  amount?: string;
}

function emptyForm(): Expense {
  return {
    expenseId: 0,
    referenceNo: '',
    expenseCategoryId: 0,
    warehouseId: 0,
    accountId: 0,
    userId: 0,
    cashRegisterId: null,
    amount: 0,
    note: null,
  };
}

@Component({
  selector: 'app-expense',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.scss'],
  providers: [ConfirmationService, MessageService],
})
export class ExpenseComponent implements OnInit, OnDestroy {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  selectedExpense: Expense | null = null;
  isLoading = false;
  isLookupLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Expense = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  categoryOptions: SelectOption[] = [];
  warehouseOptions: SelectOption[] = [];
  accountOptions: SelectOption[] = [];

  private categoryMap = new Map<number, string>();
  private warehouseMap = new Map<number, string>();
  private accountMap = new Map<number, string>();

  constructor(
    private expenseService: ExpenseService,
    private expenseCategoryService: ExpenseCategoryService,
    private warehouseService: WarehouseService,
    private accountService: AccountService,
    private auth: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.applyFilter());
    this.loadLookups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Expense' : 'Edit Expense';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  private loadLookups(): void {
    this.isLookupLoading = true;
    forkJoin({
      categories: this.expenseCategoryService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      warehouses: this.warehouseService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      accounts: this.accountService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ categories, warehouses, accounts }) => {
        this.categoryOptions = this.mapOptions(categories, 'expenseCategoryId', 'name');
        this.categoryOptions.forEach(o => this.categoryMap.set(o.value, o.label));

        this.warehouseOptions = this.mapOptions(warehouses, 'warehouseId', 'name');
        this.warehouseOptions.forEach(o => this.warehouseMap.set(o.value, o.label));

        this.accountOptions = this.mapOptions(accounts, 'accountId', 'name', 'accountNo');
        this.accountOptions.forEach(o => this.accountMap.set(o.value, o.label));

        this.isLookupLoading = false;
        this.loadExpenses();
      },
      error: () => {
        this.isLookupLoading = false;
        this.loadExpenses();
      },
    });
  }

  private mapOptions(res: any, idKey: string, ...nameKeys: string[]): SelectOption[] {
    const items: any[] = Array.isArray(res) ? res
      : Array.isArray(res?.items) ? res.items
      : Array.isArray(res?.data) ? res.data
      : [];
    return items
      .map(x => ({
        label: String(nameKeys.map(k => x[k]).find(v => v) ?? `#${x[idKey] ?? x.id}`),
        value: Number(x[idKey] ?? x.id ?? 0),
      }))
      .filter(o => o.value > 0);
  }

  loadExpenses(): void {
    this.isLoading = true;
    this.expenseService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.expenses = raw.map(x => this.mapExpense(x));
        this.totalRecords = res?.totalCount ?? this.expenses.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load expenses.' });
      },
    });
  }

  private mapExpense(x: any): Expense {
    return {
      expenseId: x.expenseId ?? x.id ?? 0,
      referenceNo: x.referenceNo ?? '',
      expenseCategoryId: Number(x.expenseCategoryId ?? 0),
      warehouseId: Number(x.warehouseId ?? 0),
      accountId: Number(x.accountId ?? 0),
      userId: Number(x.userId ?? 0),
      cashRegisterId: x.cashRegisterId != null ? Number(x.cashRegisterId) : null,
      amount: Number(x.amount ?? 0),
      note: x.note ?? null,
      createdDate: x.createdDate ?? null,
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
    this.filteredExpenses = this.expenses.filter(e => {
      if (!term) return true;
      return e.referenceNo.toLowerCase().includes(term)
        || (this.categoryMap.get(e.expenseCategoryId) ?? '').toLowerCase().includes(term)
        || (this.warehouseMap.get(e.warehouseId) ?? '').toLowerCase().includes(term)
        || (e.note ?? '').toLowerCase().includes(term);
    });
  }

  categoryLabel(id: number): string {
    return this.categoryMap.get(id) ?? '—';
  }

  warehouseLabel(id: number): string {
    return this.warehouseMap.get(id) ?? '—';
  }

  accountLabel(id: number): string {
    return this.accountMap.get(id) ?? '—';
  }

  formatAmount(value: number): string {
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  generateRefNo(): void {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    this.formData.referenceNo = `EXP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(Date.now()).slice(-5)}`;
    this.formErrors.referenceNo = undefined;
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.generateRefNo();
    this.dialogVisible = true;
  }

  openEditDialog(expense: Expense): void {
    this.dialogMode = 'edit';
    this.formData = { ...expense };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedExpense) this.openEditDialog(this.selectedExpense);
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
    if (!this.formData.expenseCategoryId) {
      this.formErrors.expenseCategoryId = 'Category is required';
    }
    if (!this.formData.warehouseId) {
      this.formErrors.warehouseId = 'Warehouse is required';
    }
    if (!this.formData.accountId) {
      this.formErrors.accountId = 'Account is required';
    }
    if (!this.formData.amount || this.formData.amount <= 0) {
      this.formErrors.amount = 'Amount must be greater than zero';
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

  private currentUserId(): number {
    return this.auth.getUser()?.userId ?? 0;
  }

  private toCreateDto(f: Expense): CreateExpenseDto {
    return {
      referenceNo: f.referenceNo.trim(),
      expenseCategoryId: f.expenseCategoryId,
      warehouseId: f.warehouseId,
      accountId: f.accountId,
      userId: this.currentUserId(),
      cashRegisterId: f.cashRegisterId,
      amount: f.amount,
      note: f.note?.trim() || null,
    };
  }

  private toUpdateDto(f: Expense): UpdateExpenseDto {
    return {
      id: f.expenseId,
      referenceNo: f.referenceNo.trim(),
      expenseCategoryId: f.expenseCategoryId,
      warehouseId: f.warehouseId,
      accountId: f.accountId,
      userId: f.userId || this.currentUserId(),
      cashRegisterId: f.cashRegisterId,
      amount: f.amount,
      note: f.note?.trim() || null,
    };
  }

  private saveAdd(): void {
    this.expenseService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapExpense(res?.data ?? res ?? this.formData);
        this.expenses = [...this.expenses, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Expense Added', detail: `"${added.referenceNo}" was added.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add expense.' });
      },
    });
  }

  private saveEdit(): void {
    this.expenseService.update(this.formData.expenseId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.expenses.findIndex(e => e.expenseId === this.formData.expenseId);
        if (idx !== -1) {
          this.expenses = [...this.expenses.slice(0, idx), { ...this.formData }, ...this.expenses.slice(idx + 1)];
        }
        if (this.selectedExpense?.expenseId === this.formData.expenseId) {
          this.selectedExpense = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Expense Updated', detail: `"${this.formData.referenceNo}" was updated.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update expense.' });
      },
    });
  }

  confirmDelete(expense: Expense, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete expense <strong>${expense.referenceNo}</strong>? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(expense),
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedExpense) this.confirmDelete(this.selectedExpense, event);
  }

  private executeDelete(expense: Expense): void {
    this.expenseService.delete(expense.expenseId).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.expenseId !== expense.expenseId);
        if (this.selectedExpense?.expenseId === expense.expenseId) {
          this.selectedExpense = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `"${expense.referenceNo}" was deleted.` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete expense.' });
      },
    });
  }

  get expenseReportConfig(): GridReportConfig {
    return {
      title: 'Expense List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'expenses',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Reference No', field: 'referenceNo' },
        { header: 'Category', field: '_category' },
        { header: 'Warehouse', field: '_warehouse' },
        { header: 'Account', field: '_account' },
        { header: 'Amount', field: 'amount', align: 'right', format: (v) => this.formatAmount(v as number) },
        { header: 'Date', field: '_date' },
      ],
      rows: this.filteredExpenses.map(e => ({
        referenceNo: e.referenceNo,
        _category: this.categoryLabel(e.expenseCategoryId),
        _warehouse: this.warehouseLabel(e.warehouseId),
        _account: this.accountLabel(e.accountId),
        amount: e.amount,
        _date: this.formatDate(e.createdDate),
      })),
    };
  }
}
