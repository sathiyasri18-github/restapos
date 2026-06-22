import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  CreateTaxDto,
  Tax,
  TaxService,
  UpdateTaxDto
} from '../../services/tax.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  name?: string;
  rate?: string;
}

function emptyForm(): Tax {
  return { taxId: 0, name: '', rate: 0, isActive: true };
}

@Component({
  selector: 'app-tax',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './tax.component.html',
  styleUrls: ['./tax.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class TaxComponent implements OnInit, OnDestroy {
  taxes: Tax[] = [];
  filteredTaxes: Tax[] = [];
  selectedTax: Tax | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Tax = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private taxService: TaxService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.applyFilter());
    this.loadTaxes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Tax' : 'Edit Tax';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  loadTaxes(): void {
    this.isLoading = true;
    this.taxService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
        this.taxes = raw.map(x => this.mapTax(x));
        this.totalRecords = res?.totalCount ?? this.taxes.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load taxes.' });
      }
    });
  }

  private mapTax(x: any): Tax {
    return {
      taxId: x.taxId ?? x.id ?? 0,
      name: x.name ?? '',
      rate: x.rate != null ? Number(x.rate) : 0,
      isActive: x.isActive ?? true,
    };
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
    this.filteredTaxes = this.taxes.filter(t => {
      const matchesSearch = !term || t.name.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || t.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(tax: Tax): void {
    this.dialogMode = 'edit';
    this.formData = { ...tax };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedTax) this.openEditDialog(this.selectedTax);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.formData.name?.trim()) this.formErrors.name = 'Tax name is required';
    if (this.formData.rate == null || this.formData.rate < 0) this.formErrors.rate = 'Enter a valid rate (0 or greater)';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    this.dialogMode === 'add' ? this.saveAdd() : this.saveEdit();
  }

  private toCreateDto(f: Tax): CreateTaxDto {
    return { name: f.name.trim(), rate: Number(f.rate), isActive: f.isActive };
  }

  private toUpdateDto(f: Tax): UpdateTaxDto {
    return { id: f.taxId, name: f.name.trim(), rate: Number(f.rate), isActive: f.isActive };
  }

  private saveAdd(): void {
    this.taxService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapTax(res?.data ?? res ?? this.formData);
        this.taxes = [...this.taxes, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Tax Added', detail: `"${added.name}" was added.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add tax.' });
      }
    });
  }

  private saveEdit(): void {
    this.taxService.update(this.formData.taxId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.taxes.findIndex(t => t.taxId === this.formData.taxId);
        if (idx !== -1) {
          this.taxes = [...this.taxes.slice(0, idx), { ...this.formData }, ...this.taxes.slice(idx + 1)];
        }
        if (this.selectedTax?.taxId === this.formData.taxId) this.selectedTax = { ...this.formData };
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Tax Updated', detail: `"${this.formData.name}" was updated.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update tax.' });
      }
    });
  }

  confirmDelete(tax: Tax, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${tax.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(tax)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedTax) this.confirmDelete(this.selectedTax, event);
  }

  private executeDelete(tax: Tax): void {
    this.taxService.delete(tax.taxId).subscribe({
      next: () => {
        this.taxes = this.taxes.filter(t => t.taxId !== tax.taxId);
        if (this.selectedTax?.taxId === tax.taxId) this.selectedTax = null;
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({ severity: 'success', summary: 'Tax Deleted', detail: `"${tax.name}" was deleted.` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete tax.' });
      }
    });
  }

  get taxReportConfig(): GridReportConfig {
    return {
      title: 'Tax List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'taxes',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Rate (%)', field: 'rate' },
        { header: 'Active', field: 'isActive', format: (v) => formatYesNo(v as boolean) }
      ],
      rows: this.filteredTaxes.map(t => ({ name: t.name, rate: t.rate, isActive: t.isActive }))
    };
  }
}
