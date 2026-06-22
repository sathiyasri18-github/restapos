import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  Brand,
  BrandService,
  CreateBrandDto,
  UpdateBrandDto
} from '../../services/brand.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  title?: string;
}

function emptyForm(): Brand {
  return {
    brandId: 0,
    title: '',
    image: null,
    isActive: true,
  };
}

@Component({
  selector: 'app-brand',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './brand.component.html',
  styleUrls: ['./brand.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class BrandComponent implements OnInit, OnDestroy {
  brands: Brand[] = [];
  filteredBrands: Brand[] = [];
  selectedBrand: Brand | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Brand = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private brandService: BrandService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadBrands();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Brand' : 'Edit Brand';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  loadBrands(): void {
    this.isLoading = true;
    this.brandService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.brands = raw.map(x => this.mapBrand(x));
        this.totalRecords = res?.totalCount ?? this.brands.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load brands. Please try again.'
        });
      }
    });
  }

  private mapBrand(x: any): Brand {
    return {
      brandId: x.brandId ?? x.id ?? 0,
      title: x.title ?? '',
      image: x.image ?? null,
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
    this.filteredBrands = this.brands.filter(b => {
      const matchesSearch = !term || b.title.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || b.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(brand: Brand): void {
    this.dialogMode = 'edit';
    this.formData = { ...brand };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedBrand) this.openEditDialog(this.selectedBrand);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.formData.title?.trim()) {
      this.formErrors.title = 'Brand title is required';
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

  private toCreateDto(f: Brand): CreateBrandDto {
    return {
      title: f.title.trim(),
      image: f.image?.trim() || null,
      isActive: f.isActive,
    };
  }

  private toUpdateDto(f: Brand): UpdateBrandDto {
    return {
      id: f.brandId,
      title: f.title.trim(),
      image: f.image?.trim() || null,
      isActive: f.isActive,
    };
  }

  private saveAdd(): void {
    this.brandService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapBrand(res?.data ?? res ?? this.formData);
        this.brands = [...this.brands, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Brand Added',
          detail: `"${added.title}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add brand. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.brandService.update(this.formData.brandId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.brands.findIndex(b => b.brandId === this.formData.brandId);
        if (idx !== -1) {
          this.brands = [
            ...this.brands.slice(0, idx),
            { ...this.formData },
            ...this.brands.slice(idx + 1)
          ];
        }
        if (this.selectedBrand?.brandId === this.formData.brandId) {
          this.selectedBrand = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Brand Updated',
          detail: `"${this.formData.title}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update brand. Please try again.'
        });
      }
    });
  }

  confirmDelete(brand: Brand, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${brand.title}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(brand)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedBrand) this.confirmDelete(this.selectedBrand, event);
  }

  private executeDelete(brand: Brand): void {
    this.brandService.delete(brand.brandId).subscribe({
      next: () => {
        this.brands = this.brands.filter(b => b.brandId !== brand.brandId);
        if (this.selectedBrand?.brandId === brand.brandId) {
          this.selectedBrand = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Brand Deleted',
          detail: `"${brand.title}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete brand. Please try again.'
        });
      }
    });
  }

  get brandReportConfig(): GridReportConfig {
    return {
      title: 'Brand List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'brands',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Title', field: 'title' },
        { header: 'Image', field: 'image' },
        {
          header: 'Active',
          field: 'isActive',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredBrands.map(b => ({
        title: b.title,
        image: b.image ?? '—',
        isActive: b.isActive
      }))
    };
  }
}
