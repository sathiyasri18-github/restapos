import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  Currency,
  CurrencyService,
  CreateCurrencyDto,
  UpdateCurrencyDto
} from '../../services/currency.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  name?: string;
  code?: string;
  exchangeRate?: string;
}

function emptyForm(): Currency {
  return {
    currencyId: 0,
    name: '',
    code: '',
    exchangeRate: 1,
  };
}

@Component({
  selector: 'app-currency',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './currency.component.html',
  styleUrls: ['./currency.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CurrencyComponent implements OnInit, OnDestroy {
  currencies: Currency[] = [];
  filteredCurrencies: Currency[] = [];
  selectedCurrency: Currency | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Currency = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private currencyService: CurrencyService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadCurrencies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Currency' : 'Edit Currency';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  formatRate(rate: number): string {
    return rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }

  loadCurrencies(): void {
    this.isLoading = true;
    this.currencyService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.currencies = raw.map(x => this.mapCurrency(x));
        this.totalRecords = res?.totalCount ?? this.currencies.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load currencies. Please try again.'
        });
      }
    });
  }

  private mapCurrency(x: any): Currency {
    return {
      currencyId: x.currencyId ?? x.id ?? 0,
      name: x.name ?? '',
      code: x.code ?? '',
      exchangeRate: x.exchangeRate != null ? Number(x.exchangeRate) : 0,
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
    this.filteredCurrencies = this.currencies.filter(c => {
      if (!term) return true;
      return c.name.toLowerCase().includes(term)
        || c.code.toLowerCase().includes(term);
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(currency: Currency): void {
    this.dialogMode = 'edit';
    this.formData = { ...currency };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedCurrency) this.openEditDialog(this.selectedCurrency);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.name?.trim()) {
      this.formErrors.name = 'Currency name is required';
    }
    if (!this.formData.code?.trim()) {
      this.formErrors.code = 'Currency code is required';
    } else if (!/^[A-Za-z]{3}$/.test(this.formData.code.trim())) {
      this.formErrors.code = 'Enter a 3-letter currency code (e.g. USD)';
    }
    if (this.formData.exchangeRate == null || this.formData.exchangeRate <= 0) {
      this.formErrors.exchangeRate = 'Exchange rate must be greater than zero';
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

  private toCreateDto(f: Currency): CreateCurrencyDto {
    return {
      name: f.name.trim(),
      code: f.code.trim().toUpperCase(),
      exchangeRate: Number(f.exchangeRate),
    };
  }

  private toUpdateDto(f: Currency): UpdateCurrencyDto {
    return {
      id: f.currencyId,
      name: f.name.trim(),
      code: f.code.trim().toUpperCase(),
      exchangeRate: Number(f.exchangeRate),
    };
  }

  private saveAdd(): void {
    this.currencyService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapCurrency(res?.data ?? res ?? this.formData);
        this.currencies = [...this.currencies, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Currency Added',
          detail: `"${added.name}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add currency. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.currencyService.update(this.formData.currencyId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.currencies.findIndex(c => c.currencyId === this.formData.currencyId);
        if (idx !== -1) {
          this.currencies = [
            ...this.currencies.slice(0, idx),
            { ...this.formData },
            ...this.currencies.slice(idx + 1)
          ];
        }
        if (this.selectedCurrency?.currencyId === this.formData.currencyId) {
          this.selectedCurrency = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Currency Updated',
          detail: `"${this.formData.name}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update currency. Please try again.'
        });
      }
    });
  }

  confirmDelete(currency: Currency, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${currency.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(currency)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedCurrency) this.confirmDelete(this.selectedCurrency, event);
  }

  private executeDelete(currency: Currency): void {
    this.currencyService.delete(currency.currencyId).subscribe({
      next: () => {
        this.currencies = this.currencies.filter(c => c.currencyId !== currency.currencyId);
        if (this.selectedCurrency?.currencyId === currency.currencyId) {
          this.selectedCurrency = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Currency Deleted',
          detail: `"${currency.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete currency. Please try again.'
        });
      }
    });
  }

  get currencyReportConfig(): GridReportConfig {
    return {
      title: 'Currency List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'currencies',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Code', field: 'code' },
        { header: 'Exchange Rate', field: 'exchangeRate', align: 'right' }
      ],
      rows: this.filteredCurrencies.map(c => ({
        name: c.name,
        code: c.code,
        exchangeRate: c.exchangeRate
      }))
    };
  }
}
