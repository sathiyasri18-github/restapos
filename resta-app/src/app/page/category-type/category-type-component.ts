// category-type-component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  Category,
  CategoryService,
  CreateCategoryDto,
  UpdateCategoryDto
} from '../../services/category.service';
import {
  CategoryType,
  CategoryTypeService,
  CreateCategoryTypeDto,
  UpdateCategoryTypeDto
} from '../../services/category-type.service';

type DialogMode = 'add' | 'edit';

interface TypeFormErrors {
  categoryTypeCode?: string;
  categoryTypeName?: string;
}

interface CatFormErrors {
  categoryName?: string;
}

function emptyTypeForm(): CategoryType {
  return { categoryTypeId: 0, categoryTypeCode: '', categoryTypeName: '' };
}

function emptyCatForm(categoryTypeId: number | null = null): Category {
  return { categoryId: 0, categoryName: '', categoryTypeId };
}

@Component({
  selector: 'app-category-type-component',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './category-type-component.html',
  styleUrls: ['./category-type-component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CategoryTypeComponent implements OnInit, OnDestroy {

  // ─── Category Type state ─────────────────────────────────────────────────────
  categoryTypes: CategoryType[] = [];
  selectedCategoryType: CategoryType | null = null;
  typeLoading = false;
  typeTotalRecords = 0;
  typeSearchTerm = '';
  private typeSearch$ = new Subject<string>();

  typeDialogVisible = false;
  typeDialogMode: DialogMode = 'add';
  typeFormData: CategoryType = emptyTypeForm();
  typeFormErrors: TypeFormErrors = {};
  typeSaving = false;

  // ─── Category state ──────────────────────────────────────────────────────────
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  catLoading = false;
  catTotalRecords = 0;
  catSearchTerm = '';
  private catSearch$ = new Subject<string>();

  catDialogVisible = false;
  catDialogMode: DialogMode = 'add';
  catFormData: Category = emptyCatForm();
  catFormErrors: CatFormErrors = {};
  catSaving = false;

  private destroy$ = new Subject<void>();

  constructor(
    private categoryTypeService: CategoryTypeService,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.typeSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadCategoryTypes(term));

    this.catSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadCategories(term));

    this.loadCategoryTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────

  get typeDialogTitle(): string {
    return this.typeDialogMode === 'add' ? 'Add Category Type' : 'Edit Category Type';
  }

  get catDialogTitle(): string {
    return this.catDialogMode === 'add' ? 'Add Category' : 'Edit Category';
  }

  get hasTypeSearch(): boolean {
    return !!this.typeSearchTerm.trim();
  }

  get hasCatSearch(): boolean {
    return !!this.catSearchTerm.trim();
  }

  get hasSelectedType(): boolean {
    return this.selectedCategoryType != null;
  }

  formatDate(value: Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ─── Category Type: load ─────────────────────────────────────────────────────

  loadCategoryTypes(search = ''): void {
    this.typeLoading = true;
    this.categoryTypeService.getAll({ search, pageSize: 200 }).subscribe({
      next: (res: any) => {
        const raw: any[] = this.extractItems(res);
        this.categoryTypes = raw.map(x => this.mapCategoryType(x));
        this.typeTotalRecords = res?.totalCount ?? this.categoryTypes.length;
        this.typeLoading = false;

        if (this.selectedCategoryType) {
          const still = this.categoryTypes.find(
            t => t.categoryTypeId === this.selectedCategoryType!.categoryTypeId
          );
          if (still) {
            this.selectedCategoryType = still;
            this.loadCategories(this.catSearchTerm);
          } else {
            this.clearCategoryPanel();
          }
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.typeLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load category types.'
        });
      }
    });
  }

  private mapCategoryType(x: any): CategoryType {
    return {
      categoryTypeId:   x.categoryTypeId ?? x.id ?? 0,
      categoryTypeCode: x.categoryTypeCode ?? '',
      categoryTypeName: x.categoryTypeName ?? '',
      createdDate:      x.createdDate  ? new Date(x.createdDate)  : null,
      createdBy:        x.createdBy != null ? Number(x.createdBy) : null,
      modifiedDate:     x.modifiedDate ? new Date(x.modifiedDate) : null,
      modifiedBy:       x.modifiedBy != null ? Number(x.modifiedBy) : null,
    };
  }

  onTypeSearchChange(): void {
    this.typeSearch$.next(this.typeSearchTerm);
  }

  onClearTypeSearch(): void {
    this.typeSearchTerm = '';
    this.loadCategoryTypes();
  }

  onCategoryTypeSelect(): void {
    this.selectedCategory = null;
    this.catSearchTerm = '';
    if (this.selectedCategoryType) {
      this.loadCategories();
    } else {
      this.clearCategoryPanel();
    }
  }

  // ─── Category Type: dialog ───────────────────────────────────────────────────

  openTypeAddDialog(): void {
    this.typeDialogMode = 'add';
    this.typeFormData   = emptyTypeForm();
    this.typeFormErrors = {};
    this.typeDialogVisible = true;
  }

  openTypeEditDialog(item: CategoryType): void {
    this.typeDialogMode = 'edit';
    this.typeFormData   = { ...item };
    this.typeFormErrors = {};
    this.typeDialogVisible = true;
  }

  onTypeEditSelected(): void {
    if (this.selectedCategoryType) this.openTypeEditDialog(this.selectedCategoryType);
  }

  onTypeDialogHide(): void {
    this.typeFormErrors = {};
    this.typeSaving = false;
  }

  private validateType(): boolean {
    this.typeFormErrors = {};
    if (!this.typeFormData.categoryTypeCode?.trim()) {
      this.typeFormErrors.categoryTypeCode = 'Category type code is required';
    }
    if (!this.typeFormData.categoryTypeName?.trim()) {
      this.typeFormErrors.categoryTypeName = 'Category type name is required';
    }
    return Object.keys(this.typeFormErrors).length === 0;
  }

  onTypeSave(): void {
    if (!this.validateType()) return;
    this.typeSaving = true;
    this.typeDialogMode === 'add' ? this.saveTypeAdd() : this.saveTypeEdit();
  }

  private toCreateTypeDto(f: CategoryType): CreateCategoryTypeDto {
    return {
      categoryTypeCode: f.categoryTypeCode.trim(),
      categoryTypeName: f.categoryTypeName.trim(),
      createdBy: null,
    };
  }

  private toUpdateTypeDto(f: CategoryType): UpdateCategoryTypeDto {
    return {
      categoryTypeId:   f.categoryTypeId,
      categoryTypeCode: f.categoryTypeCode.trim(),
      categoryTypeName: f.categoryTypeName.trim(),
      modifiedBy: null,
    };
  }

  private saveTypeAdd(): void {
    this.categoryTypeService.create(this.toCreateTypeDto(this.typeFormData)).subscribe({
      next: (res: any) => {
        const added = this.mapCategoryType(res?.data ?? res ?? this.typeFormData);
        this.categoryTypes = [...this.categoryTypes, added];
        this.typeTotalRecords++;
        this.typeDialogVisible = false;
        this.typeSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Category Type Added',
          detail: `"${added.categoryTypeName}" was added successfully.`
        });
      },
      error: () => {
        this.typeSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add category type.' });
      }
    });
  }

  private saveTypeEdit(): void {
    this.categoryTypeService
      .update(this.typeFormData.categoryTypeId, this.toUpdateTypeDto(this.typeFormData))
      .subscribe({
        next: () => {
          const idx = this.categoryTypes.findIndex(t => t.categoryTypeId === this.typeFormData.categoryTypeId);
          if (idx !== -1) {
            this.categoryTypes = [
              ...this.categoryTypes.slice(0, idx),
              { ...this.typeFormData },
              ...this.categoryTypes.slice(idx + 1)
            ];
          }
          if (this.selectedCategoryType?.categoryTypeId === this.typeFormData.categoryTypeId) {
            this.selectedCategoryType = { ...this.typeFormData };
          }
          this.typeDialogVisible = false;
          this.typeSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Category Type Updated',
            detail: `"${this.typeFormData.categoryTypeName}" was updated successfully.`
          });
        },
        error: () => {
          this.typeSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update category type.' });
        }
      });
  }

  confirmTypeDelete(item: CategoryType, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${item.categoryTypeName}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeTypeDelete(item)
    });
  }

  onTypeDeleteSelected(event: Event): void {
    if (this.selectedCategoryType) this.confirmTypeDelete(this.selectedCategoryType, event);
  }

  private executeTypeDelete(item: CategoryType): void {
    this.categoryTypeService.delete(item.categoryTypeId).subscribe({
      next: () => {
        this.categoryTypes = this.categoryTypes.filter(t => t.categoryTypeId !== item.categoryTypeId);
        if (this.selectedCategoryType?.categoryTypeId === item.categoryTypeId) {
          this.selectedCategoryType = null;
          this.clearCategoryPanel();
        }
        this.typeTotalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Category Type Deleted',
          detail: `"${item.categoryTypeName}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete category type.' });
      }
    });
  }

  // ─── Category: load ──────────────────────────────────────────────────────────

  loadCategories(search = ''): void {
    if (!this.selectedCategoryType) return;

    this.catLoading = true;
    this.categoryService.getAll({
      categoryTypeId: this.selectedCategoryType.categoryTypeId,
      search,
      pageSize: 200
    }).subscribe({
      next: (res: any) => {
        const raw: any[] = this.extractItems(res);
        this.categories = raw.map(x => this.mapCategory(x));
        this.catTotalRecords = res?.totalCount ?? this.categories.length;
        this.catLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.catLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load categories.'
        });
      }
    });
  }

  private mapCategory(x: any): Category {
    return {
      categoryId:     x.categoryId ?? x.id ?? 0,
      categoryName:   x.categoryName ?? '',
      categoryTypeId: x.categoryTypeId != null ? Number(x.categoryTypeId) : null,
      createdDate:    x.createdDate  ? new Date(x.createdDate)  : null,
      createdBy:      x.createdBy != null ? Number(x.createdBy) : null,
      modifiedDate:   x.modifiedDate ? new Date(x.modifiedDate) : null,
      modifiedBy:     x.modifiedBy != null ? Number(x.modifiedBy) : null,
    };
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res)
      ? res
      : Array.isArray(res?.items) ? res.items
      : Array.isArray(res?.data)  ? res.data
      : [];
  }

  private clearCategoryPanel(): void {
    this.categories = [];
    this.selectedCategory = null;
    this.catTotalRecords = 0;
  }

  onCatSearchChange(): void {
    this.catSearch$.next(this.catSearchTerm);
  }

  onClearCatSearch(): void {
    this.catSearchTerm = '';
    this.loadCategories();
  }

  // ─── Category: dialog ────────────────────────────────────────────────────────

  openCatAddDialog(): void {
    if (!this.selectedCategoryType) return;
    this.catDialogMode = 'add';
    this.catFormData   = emptyCatForm(this.selectedCategoryType.categoryTypeId);
    this.catFormErrors = {};
    this.catDialogVisible = true;
  }

  openCatEditDialog(item: Category): void {
    this.catDialogMode = 'edit';
    this.catFormData   = { ...item };
    this.catFormErrors = {};
    this.catDialogVisible = true;
  }

  onCatEditSelected(): void {
    if (this.selectedCategory) this.openCatEditDialog(this.selectedCategory);
  }

  onCatDialogHide(): void {
    this.catFormErrors = {};
    this.catSaving = false;
  }

  private validateCat(): boolean {
    this.catFormErrors = {};
    if (!this.catFormData.categoryName?.trim()) {
      this.catFormErrors.categoryName = 'Category name is required';
    }
    return Object.keys(this.catFormErrors).length === 0;
  }

  onCatSave(): void {
    if (!this.validateCat()) return;
    this.catSaving = true;
    this.catDialogMode === 'add' ? this.saveCatAdd() : this.saveCatEdit();
  }

  private toCreateCatDto(f: Category): CreateCategoryDto {
    return {
      categoryName:   f.categoryName.trim(),
      categoryTypeId: f.categoryTypeId,
      createdBy:      null,
    };
  }

  private toUpdateCatDto(f: Category): UpdateCategoryDto {
    return {
      categoryId:     f.categoryId,
      categoryName:   f.categoryName.trim(),
      categoryTypeId: f.categoryTypeId,
      modifiedBy:     null,
    };
  }

  private saveCatAdd(): void {
    this.categoryService.create(this.toCreateCatDto(this.catFormData)).subscribe({
      next: (res: any) => {
        const added = this.mapCategory(res?.data ?? res ?? this.catFormData);
        this.categories = [...this.categories, added];
        this.catTotalRecords++;
        this.catDialogVisible = false;
        this.catSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Category Added',
          detail: `"${added.categoryName}" was added successfully.`
        });
      },
      error: () => {
        this.catSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add category.' });
      }
    });
  }

  private saveCatEdit(): void {
    this.categoryService
      .update(this.catFormData.categoryId, this.toUpdateCatDto(this.catFormData))
      .subscribe({
        next: () => {
          const idx = this.categories.findIndex(c => c.categoryId === this.catFormData.categoryId);
          if (idx !== -1) {
            this.categories = [
              ...this.categories.slice(0, idx),
              { ...this.catFormData },
              ...this.categories.slice(idx + 1)
            ];
          }
          if (this.selectedCategory?.categoryId === this.catFormData.categoryId) {
            this.selectedCategory = { ...this.catFormData };
          }
          this.catDialogVisible = false;
          this.catSaving = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Category Updated',
            detail: `"${this.catFormData.categoryName}" was updated successfully.`
          });
        },
        error: () => {
          this.catSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update category.' });
        }
      });
  }

  confirmCatDelete(item: Category, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${item.categoryName}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeCatDelete(item)
    });
  }

  onCatDeleteSelected(event: Event): void {
    if (this.selectedCategory) this.confirmCatDelete(this.selectedCategory, event);
  }

  private executeCatDelete(item: Category): void {
    this.categoryService.delete(item.categoryId).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.categoryId !== item.categoryId);
        if (this.selectedCategory?.categoryId === item.categoryId) {
          this.selectedCategory = null;
        }
        this.catTotalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Category Deleted',
          detail: `"${item.categoryName}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete category.' });
      }
    });
  }

  get categoryTypesReportConfig(): GridReportConfig {
    return {
      title: 'Category Types',
      subtitle: this.hasTypeSearch ? `Search: ${this.typeSearchTerm}` : undefined,
      fileName: 'category_types',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Code', field: 'categoryTypeCode' },
        { header: 'Name', field: 'categoryTypeName' }
      ],
      rows: this.categoryTypes.map(t => ({
        categoryTypeCode: t.categoryTypeCode,
        categoryTypeName: t.categoryTypeName
      }))
    };
  }

  get categoriesReportConfig(): GridReportConfig {
    const type = this.selectedCategoryType;
    return {
      title: 'Categories',
      subtitle: type
        ? `Type: ${type.categoryTypeName || type.categoryTypeCode}`
        : undefined,
      fileName: type ? `categories_${type.categoryTypeId}` : 'categories',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'categoryName' }
      ],
      rows: this.categories.map(c => ({ categoryName: c.categoryName }))
    };
  }
}
