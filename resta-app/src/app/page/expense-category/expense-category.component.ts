import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  ExpenseCategory,
  ExpenseCategoryService,
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto
} from '../../services/expense-category.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  code?: string;
  name?: string;
}

function emptyForm(): ExpenseCategory {
  return {
    expenseCategoryId: 0,
    code: '',
    name: '',
    isActive: true,
  };
}

@Component({
  selector: 'app-expense-category',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './expense-category.component.html',
  styleUrls: ['./expense-category.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ExpenseCategoryComponent implements OnInit, OnDestroy {
  expenseCategories: ExpenseCategory[] = [];
  filteredExpenseCategories: ExpenseCategory[] = [];
  selectedExpenseCategory: ExpenseCategory | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: ExpenseCategory = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private expenseCategoryService: ExpenseCategoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadExpenseCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Expense Category' : 'Edit Expense Category';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  loadExpenseCategories(): void {
    this.isLoading = true;
    this.expenseCategoryService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.expenseCategories = raw.map(x => this.mapExpenseCategory(x));
        this.totalRecords = res?.totalCount ?? this.expenseCategories.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load expense categories. Please try again.'
        });
      }
    });
  }

  private mapExpenseCategory(x: any): ExpenseCategory {
    return {
      expenseCategoryId: x.expenseCategoryId ?? x.id ?? 0,
      code: x.code ?? '',
      name: x.name ?? '',
      isActive: x.isActive ?? true,
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
    this.activeFilter = null;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredExpenseCategories = this.expenseCategories.filter(ec => {
      const matchesSearch = !term
        || ec.code.toLowerCase().includes(term)
        || ec.name.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || ec.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(expenseCategory: ExpenseCategory): void {
    this.dialogMode = 'edit';
    this.formData = { ...expenseCategory };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedExpenseCategory) this.openEditDialog(this.selectedExpenseCategory);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.code?.trim()) {
      this.formErrors.code = 'Category code is required';
    }
    if (!this.formData.name?.trim()) {
      this.formErrors.name = 'Category name is required';
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

  private toCreateDto(f: ExpenseCategory): CreateExpenseCategoryDto {
    return {
      code: f.code.trim().toUpperCase(),
      name: f.name.trim(),
      isActive: f.isActive,
    };
  }

  private toUpdateDto(f: ExpenseCategory): UpdateExpenseCategoryDto {
    return {
      id: f.expenseCategoryId,
      code: f.code.trim().toUpperCase(),
      name: f.name.trim(),
      isActive: f.isActive,
    };
  }

  private saveAdd(): void {
    this.expenseCategoryService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapExpenseCategory(res?.data ?? res ?? this.formData);
        this.expenseCategories = [...this.expenseCategories, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Expense Category Added',
          detail: `"${added.name}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add expense category. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.expenseCategoryService.update(
      this.formData.expenseCategoryId,
      this.toUpdateDto(this.formData)
    ).subscribe({
      next: () => {
        const idx = this.expenseCategories.findIndex(
          ec => ec.expenseCategoryId === this.formData.expenseCategoryId
        );
        if (idx !== -1) {
          this.expenseCategories = [
            ...this.expenseCategories.slice(0, idx),
            { ...this.formData },
            ...this.expenseCategories.slice(idx + 1)
          ];
        }
        if (this.selectedExpenseCategory?.expenseCategoryId === this.formData.expenseCategoryId) {
          this.selectedExpenseCategory = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Expense Category Updated',
          detail: `"${this.formData.name}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update expense category. Please try again.'
        });
      }
    });
  }

  confirmDelete(expenseCategory: ExpenseCategory, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${expenseCategory.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(expenseCategory)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedExpenseCategory) this.confirmDelete(this.selectedExpenseCategory, event);
  }

  private executeDelete(expenseCategory: ExpenseCategory): void {
    this.expenseCategoryService.delete(expenseCategory.expenseCategoryId).subscribe({
      next: () => {
        this.expenseCategories = this.expenseCategories.filter(
          ec => ec.expenseCategoryId !== expenseCategory.expenseCategoryId
        );
        if (this.selectedExpenseCategory?.expenseCategoryId === expenseCategory.expenseCategoryId) {
          this.selectedExpenseCategory = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Expense Category Deleted',
          detail: `"${expenseCategory.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete expense category. Please try again.'
        });
      }
    });
  }

  get expenseCategoryReportConfig(): GridReportConfig {
    return {
      title: 'Expense Category List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'expense-categories',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Code', field: 'code' },
        { header: 'Name', field: 'name' },
        {
          header: 'Active',
          field: 'isActive',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredExpenseCategories.map(ec => ({
        code: ec.code,
        name: ec.name,
        isActive: ec.isActive
      }))
    };
  }
}
