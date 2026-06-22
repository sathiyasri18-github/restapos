import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  Language,
  LanguageService,
  CreateLanguageDto,
  UpdateLanguageDto
} from '../../services/language.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  code?: string;
}

function emptyForm(): Language {
  return {
    languageId: 0,
    code: '',
  };
}

@Component({
  selector: 'app-language',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class LanguageComponent implements OnInit, OnDestroy {
  languages: Language[] = [];
  filteredLanguages: Language[] = [];
  selectedLanguage: Language | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Language = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private languageService: LanguageService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadLanguages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Language' : 'Edit Language';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  loadLanguages(): void {
    this.isLoading = true;
    this.languageService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.languages = raw.map(x => this.mapLanguage(x));
        this.totalRecords = res?.totalCount ?? this.languages.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load languages. Please try again.'
        });
      }
    });
  }

  private mapLanguage(x: any): Language {
    return {
      languageId: x.languageId ?? x.id ?? 0,
      code: x.code ?? '',
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
    this.filteredLanguages = this.languages.filter(l => {
      if (!term) return true;
      return l.code.toLowerCase().includes(term);
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(language: Language): void {
    this.dialogMode = 'edit';
    this.formData = { ...language };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedLanguage) this.openEditDialog(this.selectedLanguage);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    const code = this.formData.code?.trim() ?? '';
    if (!code) {
      this.formErrors.code = 'Language code is required';
    } else if (code.length < 2 || code.length > 10) {
      this.formErrors.code = 'Code must be between 2 and 10 characters';
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

  private toCreateDto(f: Language): CreateLanguageDto {
    return {
      code: f.code.trim(),
    };
  }

  private toUpdateDto(f: Language): UpdateLanguageDto {
    return {
      id: f.languageId,
      code: f.code.trim(),
    };
  }

  private saveAdd(): void {
    this.languageService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapLanguage(res?.data ?? res ?? this.formData);
        this.languages = [...this.languages, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Language Added',
          detail: `"${added.code}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add language. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.languageService.update(this.formData.languageId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.languages.findIndex(l => l.languageId === this.formData.languageId);
        if (idx !== -1) {
          this.languages = [
            ...this.languages.slice(0, idx),
            { ...this.formData },
            ...this.languages.slice(idx + 1)
          ];
        }
        if (this.selectedLanguage?.languageId === this.formData.languageId) {
          this.selectedLanguage = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Language Updated',
          detail: `"${this.formData.code}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update language. Please try again.'
        });
      }
    });
  }

  confirmDelete(language: Language, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${language.code}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(language)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedLanguage) this.confirmDelete(this.selectedLanguage, event);
  }

  private executeDelete(language: Language): void {
    this.languageService.delete(language.languageId).subscribe({
      next: () => {
        this.languages = this.languages.filter(l => l.languageId !== language.languageId);
        if (this.selectedLanguage?.languageId === language.languageId) {
          this.selectedLanguage = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Language Deleted',
          detail: `"${language.code}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete language. Please try again.'
        });
      }
    });
  }

  get languageReportConfig(): GridReportConfig {
    return {
      title: 'Language List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'languages',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Code', field: 'code' },
      ],
      rows: this.filteredLanguages.map(l => ({
        code: l.code,
      }))
    };
  }
}
