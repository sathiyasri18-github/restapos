import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  CreateVariantDto,
  UpdateVariantDto,
  Variant,
  VariantService
} from '../../services/variant.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  name?: string;
}

function emptyForm(): Variant {
  return { variantId: 0, name: '' };
}

@Component({
  selector: 'app-variant',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './variant.component.html',
  styleUrls: ['./variant.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class VariantComponent implements OnInit, OnDestroy {
  variants: Variant[] = [];
  filteredVariants: Variant[] = [];
  selectedVariant: Variant | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Variant = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private variantService: VariantService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.applyFilter());
    this.loadVariants();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Variant' : 'Edit Variant';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  loadVariants(): void {
    this.isLoading = true;
    this.variantService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res) ? res : (res?.items ?? res?.data ?? []);
        this.variants = raw.map(x => this.mapVariant(x));
        this.totalRecords = res?.totalCount ?? this.variants.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load variants.' });
      }
    });
  }

  private mapVariant(x: any): Variant {
    return { variantId: x.variantId ?? x.id ?? 0, name: x.name ?? '' };
  }

  onSearchChange(): void { this.search$.next(); }

  onClearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredVariants = this.variants.filter(v => !term || v.name.toLowerCase().includes(term));
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(variant: Variant): void {
    this.dialogMode = 'edit';
    this.formData = { ...variant };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedVariant) this.openEditDialog(this.selectedVariant);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.formData.name?.trim()) this.formErrors.name = 'Variant name is required';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    this.dialogMode === 'add' ? this.saveAdd() : this.saveEdit();
  }

  private toCreateDto(f: Variant): CreateVariantDto {
    return { name: f.name.trim() };
  }

  private toUpdateDto(f: Variant): UpdateVariantDto {
    return { id: f.variantId, name: f.name.trim() };
  }

  private saveAdd(): void {
    this.variantService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapVariant(res?.data ?? res ?? this.formData);
        this.variants = [...this.variants, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Variant Added', detail: `"${added.name}" was added.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add variant.' });
      }
    });
  }

  private saveEdit(): void {
    this.variantService.update(this.formData.variantId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.variants.findIndex(v => v.variantId === this.formData.variantId);
        if (idx !== -1) {
          this.variants = [...this.variants.slice(0, idx), { ...this.formData }, ...this.variants.slice(idx + 1)];
        }
        if (this.selectedVariant?.variantId === this.formData.variantId) this.selectedVariant = { ...this.formData };
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Variant Updated', detail: `"${this.formData.name}" was updated.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update variant.' });
      }
    });
  }

  confirmDelete(variant: Variant, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${variant.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(variant)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedVariant) this.confirmDelete(this.selectedVariant, event);
  }

  private executeDelete(variant: Variant): void {
    this.variantService.delete(variant.variantId).subscribe({
      next: () => {
        this.variants = this.variants.filter(v => v.variantId !== variant.variantId);
        if (this.selectedVariant?.variantId === variant.variantId) this.selectedVariant = null;
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({ severity: 'success', summary: 'Variant Deleted', detail: `"${variant.name}" was deleted.` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete variant.' });
      }
    });
  }

  get variantReportConfig(): GridReportConfig {
    return {
      title: 'Variant List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'variants',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' }
      ],
      rows: this.filteredVariants.map(v => ({ name: v.name }))
    };
  }
}
