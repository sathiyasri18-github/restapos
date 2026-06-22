import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../../common/grid-report';
import {
  CreateProductUnitDto,
  ProductUnit,
  ProductUnitService,
  UpdateProductUnitDto
} from '../../../services/product-unit.service';

type DialogMode = 'add' | 'edit';

interface BaseUnitOption {
  label: string;
  value: number | null;
}

interface FormErrors {
  unitCode?: string;
  unitName?: string;
}

function emptyForm(): ProductUnit {
  return {
    productUnitId: 0,
    unitCode: '',
    unitName: '',
    baseUnit: null,
    operator: null,
    operationValue: null,
    isActive: true,
  };
}

@Component({
  selector: 'app-product-unit',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './product-unit.component.html',
  styleUrls: ['./product-unit.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ProductUnitComponent implements OnInit, OnDestroy {
  units: ProductUnit[] = [];
  filteredUnits: ProductUnit[] = [];
  selectedUnit: ProductUnit | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  private baseUnitLabels: Record<number, string> = {};

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: ProductUnit = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  readonly operatorOptions = [
    { label: '— None —', value: null as string | null },
    { label: 'Multiply (*)', value: '*' },
    { label: 'Divide (/)', value: '/' },
    { label: 'Add (+)', value: '+' },
    { label: 'Subtract (-)', value: '-' },
  ];

  constructor(
    private productUnitService: ProductUnitService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.applyFilter());
    this.loadUnits();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Product Unit' : 'Edit Product Unit';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  get baseUnitOptions(): BaseUnitOption[] {
    const excludeId = this.dialogMode === 'edit' ? this.formData.productUnitId : 0;
    const options: BaseUnitOption[] = [{ label: '— None —', value: null }];
    for (const u of this.units) {
      if (u.productUnitId !== excludeId) {
        options.push({ label: `${u.unitCode} — ${u.unitName}`, value: u.productUnitId });
      }
    }
    return options;
  }

  getBaseUnitLabel(baseUnit: number | null): string {
    if (baseUnit == null) return '—';
    return this.baseUnitLabels[baseUnit] ?? String(baseUnit);
  }

  loadUnits(): void {
    this.isLoading = true;
    this.productUnitService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
        this.units = raw.map(x => this.mapUnit(x));
        this.totalRecords = res?.totalCount ?? this.units.length;
        this.rebuildBaseUnitLabels();
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load product units.' });
      }
    });
  }

  private mapUnit(x: any): ProductUnit {
    return {
      productUnitId: x.productUnitId ?? x.id ?? 0,
      unitCode: x.unitCode ?? '',
      unitName: x.unitName ?? '',
      baseUnit: x.baseUnit != null ? Number(x.baseUnit) : null,
      operator: x.operator ?? null,
      operationValue: x.operationValue != null ? Number(x.operationValue) : null,
      isActive: x.isActive ?? true,
    };
  }

  private rebuildBaseUnitLabels(): void {
    this.baseUnitLabels = Object.fromEntries(
      this.units.map(u => [u.productUnitId, `${u.unitCode} — ${u.unitName}`])
    );
  }

  onSearchChange(): void { this.search$.next(); }
  onFilterChange(): void { this.applyFilter(); }

  onClearSearch(): void {
    this.searchTerm = '';
    this.activeFilter = null;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUnits = this.units.filter(u => {
      const matchesSearch = !term ||
        u.unitCode.toLowerCase().includes(term) ||
        u.unitName.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || u.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(unit: ProductUnit): void {
    this.dialogMode = 'edit';
    this.formData = { ...unit };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedUnit) this.openEditDialog(this.selectedUnit);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.formData.unitCode?.trim()) this.formErrors.unitCode = 'Unit code is required';
    if (!this.formData.unitName?.trim()) this.formErrors.unitName = 'Unit name is required';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    this.dialogMode === 'add' ? this.saveAdd() : this.saveEdit();
  }

  private toCreateDto(f: ProductUnit): CreateProductUnitDto {
    return {
      unitCode: f.unitCode.trim(),
      unitName: f.unitName.trim(),
      baseUnit: f.baseUnit,
      operator: f.operator,
      operationValue: f.operationValue,
      isActive: f.isActive,
    };
  }

  private toUpdateDto(f: ProductUnit): UpdateProductUnitDto {
    return { id: f.productUnitId, ...this.toCreateDto(f) };
  }

  private saveAdd(): void {
    this.productUnitService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapUnit(res?.data ?? res ?? this.formData);
        this.units = [...this.units, added];
        this.totalRecords++;
        this.rebuildBaseUnitLabels();
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Unit Added', detail: `"${added.unitName}" was added.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add product unit.' });
      }
    });
  }

  private saveEdit(): void {
    this.productUnitService.update(this.formData.productUnitId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.units.findIndex(u => u.productUnitId === this.formData.productUnitId);
        if (idx !== -1) {
          this.units = [...this.units.slice(0, idx), { ...this.formData }, ...this.units.slice(idx + 1)];
        }
        if (this.selectedUnit?.productUnitId === this.formData.productUnitId) this.selectedUnit = { ...this.formData };
        this.rebuildBaseUnitLabels();
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Unit Updated', detail: `"${this.formData.unitName}" was updated.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update product unit.' });
      }
    });
  }

  confirmDelete(unit: ProductUnit, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${unit.unitName}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(unit)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedUnit) this.confirmDelete(this.selectedUnit, event);
  }

  private executeDelete(unit: ProductUnit): void {
    this.productUnitService.delete(unit.productUnitId).subscribe({
      next: () => {
        this.units = this.units.filter(u => u.productUnitId !== unit.productUnitId);
        if (this.selectedUnit?.productUnitId === unit.productUnitId) this.selectedUnit = null;
        this.totalRecords--;
        this.rebuildBaseUnitLabels();
        this.applyFilter();
        this.messageService.add({ severity: 'success', summary: 'Unit Deleted', detail: `"${unit.unitName}" was deleted.` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete product unit.' });
      }
    });
  }

  get unitReportConfig(): GridReportConfig {
    return {
      title: 'Product Unit List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'product-units',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Code', field: 'unitCode' },
        { header: 'Name', field: 'unitName' },
        {
          header: 'Base Unit',
          field: 'baseUnit',
          format: (v) => v != null ? this.getBaseUnitLabel(v as number) : '—'
        },
        { header: 'Operator', field: 'operator' },
        { header: 'Value', field: 'operationValue' },
        { header: 'Active', field: 'isActive', format: (v) => formatYesNo(v as boolean) }
      ],
      rows: this.filteredUnits.map(u => ({
        unitCode: u.unitCode,
        unitName: u.unitName,
        baseUnit: u.baseUnit,
        operator: u.operator ?? '—',
        operationValue: u.operationValue ?? '—',
        isActive: u.isActive
      }))
    };
  }
}
