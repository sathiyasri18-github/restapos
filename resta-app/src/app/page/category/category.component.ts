import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  CreateProductCategoryDto,
  ProductCategory,
  ProductCategoryService,
  UpdateProductCategoryDto
} from '../../services/product-category.service';

type DialogMode = 'add' | 'edit';

interface ParentOption {
  label: string;
  value: number | null;
}

interface FormErrors {
  name?: string;
}

function emptyForm(): ProductCategory {
  return {
    categoryId: 0,
    name: '',
    image: null,
    parentId: null,
    isActive: true,
  };
}

@Component({
  selector: 'app-category',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CategoryComponent implements OnInit, OnDestroy {
  categories: ProductCategory[] = [];
  filteredCategories: ProductCategory[] = [];
  selectedCategory: ProductCategory | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  private parentLabels: Record<number, string> = {};

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: ProductCategory = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private categoryService: ProductCategoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Category' : 'Edit Category';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  get parentOptions(): ParentOption[] {
    const excludeId = this.dialogMode === 'edit' ? this.formData.categoryId : 0;
    const options: ParentOption[] = [{ label: '— None —', value: null }];
    for (const c of this.categories) {
      if (c.categoryId !== excludeId) {
        options.push({ label: c.name, value: c.categoryId });
      }
    }
    return options;
  }

  getParentName(parentId: number | null): string {
    if (parentId == null) return '—';
    return this.parentLabels[parentId] ?? String(parentId);
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.categories = raw.map(x => this.mapCategory(x));
        this.totalRecords = res?.totalCount ?? this.categories.length;
        this.rebuildParentLabels();
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load categories. Please try again.'
        });
      }
    });
  }

  private mapCategory(x: any): ProductCategory {
    return {
      categoryId: x.categoryId ?? x.id ?? 0,
      name: x.name ?? x.categoryName ?? '',
      image: x.image ?? null,
      parentId: x.parentId != null ? Number(x.parentId) : null,
      isActive: x.isActive ?? true,
    };
  }

  private rebuildParentLabels(): void {
    this.parentLabels = Object.fromEntries(
      this.categories.map(c => [c.categoryId, c.name])
    );
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
    this.filteredCategories = this.categories.filter(c => {
      const matchesSearch = !term || c.name.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || c.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(category: ProductCategory): void {
    this.dialogMode = 'edit';
    this.formData = { ...category };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedCategory) this.openEditDialog(this.selectedCategory);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};
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

  private toCreateDto(f: ProductCategory): CreateProductCategoryDto {
    return {
      name: f.name.trim(),
      image: f.image?.trim() || null,
      parentId: f.parentId,
      isActive: f.isActive,
    };
  }

  private toUpdateDto(f: ProductCategory): UpdateProductCategoryDto {
    return {
      id: f.categoryId,
      name: f.name.trim(),
      image: f.image?.trim() || null,
      parentId: f.parentId,
      isActive: f.isActive,
    };
  }

  private saveAdd(): void {
    this.categoryService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapCategory(res?.data ?? res ?? this.formData);
        this.categories = [...this.categories, added];
        this.totalRecords++;
        this.rebuildParentLabels();
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Category Added',
          detail: `"${added.name}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add category. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.categoryService.update(this.formData.categoryId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.categories.findIndex(c => c.categoryId === this.formData.categoryId);
        if (idx !== -1) {
          this.categories = [
            ...this.categories.slice(0, idx),
            { ...this.formData },
            ...this.categories.slice(idx + 1)
          ];
        }
        if (this.selectedCategory?.categoryId === this.formData.categoryId) {
          this.selectedCategory = { ...this.formData };
        }
        this.rebuildParentLabels();
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Category Updated',
          detail: `"${this.formData.name}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update category. Please try again.'
        });
      }
    });
  }

  confirmDelete(category: ProductCategory, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${category.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(category)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedCategory) this.confirmDelete(this.selectedCategory, event);
  }

  private executeDelete(category: ProductCategory): void {
    this.categoryService.delete(category.categoryId).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.categoryId !== category.categoryId);
        if (this.selectedCategory?.categoryId === category.categoryId) {
          this.selectedCategory = null;
        }
        this.totalRecords--;
        this.rebuildParentLabels();
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Category Deleted',
          detail: `"${category.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete category. Please try again.'
        });
      }
    });
  }

  get categoryReportConfig(): GridReportConfig {
    return {
      title: 'Category List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'categories',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        {
          header: 'Parent',
          field: 'parentId',
          format: (v) => v != null ? this.getParentName(v as number) : '—'
        },
        { header: 'Image', field: 'image' },
        {
          header: 'Active',
          field: 'isActive',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredCategories.map(c => ({
        name: c.name,
        parentId: c.parentId,
        image: c.image ?? '—',
        isActive: c.isActive
      }))
    };
  }
}
