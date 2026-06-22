import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import {
  HrmSetting,
  HrmSettingService,
  CreateHrmSettingDto,
  UpdateHrmSettingDto
} from '../../services/hrm-setting.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  checkin?: string;
  checkout?: string;
}

function emptyForm(): HrmSetting {
  return {
    hrmSettingId: 0,
    checkin: '',
    checkout: '',
  };
}

@Component({
  selector: 'app-hrm-setting',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './hrm-setting.component.html',
  styleUrls: ['./hrm-setting.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class HrmSettingComponent implements OnInit, OnDestroy {
  hrmSettings: HrmSetting[] = [];
  filteredHrmSettings: HrmSetting[] = [];
  selectedHrmSetting: HrmSetting | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: HrmSetting = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  constructor(
    private hrmSettingService: HrmSettingService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadHrmSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add HRM Setting' : 'Edit HRM Setting';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim();
  }

  formatSettingLabel(setting: HrmSetting): string {
    return `${setting.checkin} – ${setting.checkout}`;
  }

  loadHrmSettings(): void {
    this.isLoading = true;
    this.hrmSettingService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.hrmSettings = raw.map(x => this.mapHrmSetting(x));
        this.totalRecords = res?.totalCount ?? this.hrmSettings.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load HRM settings. Please try again.'
        });
      }
    });
  }

  private mapHrmSetting(x: any): HrmSetting {
    return {
      hrmSettingId: x.hrmSettingId ?? x.id ?? 0,
      checkin: x.checkin ?? x.Checkin ?? '',
      checkout: x.checkout ?? x.Checkout ?? '',
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
    this.filteredHrmSettings = this.hrmSettings.filter(s => {
      if (!term) return true;
      return s.checkin.toLowerCase().includes(term)
        || s.checkout.toLowerCase().includes(term);
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(setting: HrmSetting): void {
    this.dialogMode = 'edit';
    this.formData = { ...setting };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedHrmSetting) this.openEditDialog(this.selectedHrmSetting);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.checkin?.trim()) {
      this.formErrors.checkin = 'Check in time is required';
    }
    if (!this.formData.checkout?.trim()) {
      this.formErrors.checkout = 'Check out time is required';
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

  private toCreateDto(f: HrmSetting): CreateHrmSettingDto {
    return {
      checkin: f.checkin.trim(),
      checkout: f.checkout.trim(),
    };
  }

  private toUpdateDto(f: HrmSetting): UpdateHrmSettingDto {
    return {
      id: f.hrmSettingId,
      checkin: f.checkin.trim(),
      checkout: f.checkout.trim(),
    };
  }

  private saveAdd(): void {
    this.hrmSettingService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapHrmSetting(res?.data ?? res ?? this.formData);
        this.hrmSettings = [...this.hrmSettings, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'HRM Setting Added',
          detail: `"${this.formatSettingLabel(added)}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add HRM setting. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.hrmSettingService.update(this.formData.hrmSettingId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.hrmSettings.findIndex(s => s.hrmSettingId === this.formData.hrmSettingId);
        if (idx !== -1) {
          this.hrmSettings = [
            ...this.hrmSettings.slice(0, idx),
            { ...this.formData },
            ...this.hrmSettings.slice(idx + 1)
          ];
        }
        if (this.selectedHrmSetting?.hrmSettingId === this.formData.hrmSettingId) {
          this.selectedHrmSetting = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'HRM Setting Updated',
          detail: `"${this.formatSettingLabel(this.formData)}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update HRM setting. Please try again.'
        });
      }
    });
  }

  confirmDelete(setting: HrmSetting, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${this.formatSettingLabel(setting)}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(setting)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedHrmSetting) this.confirmDelete(this.selectedHrmSetting, event);
  }

  private executeDelete(setting: HrmSetting): void {
    this.hrmSettingService.delete(setting.hrmSettingId).subscribe({
      next: () => {
        this.hrmSettings = this.hrmSettings.filter(s => s.hrmSettingId !== setting.hrmSettingId);
        if (this.selectedHrmSetting?.hrmSettingId === setting.hrmSettingId) {
          this.selectedHrmSetting = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'HRM Setting Deleted',
          detail: `"${this.formatSettingLabel(setting)}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete HRM setting. Please try again.'
        });
      }
    });
  }

  get hrmSettingReportConfig(): GridReportConfig {
    return {
      title: 'HRM Setting List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'hrm-settings',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Check In', field: 'checkin' },
        { header: 'Check Out', field: 'checkout' },
      ],
      rows: this.filteredHrmSettings.map(s => ({
        checkin: s.checkin,
        checkout: s.checkout,
      }))
    };
  }
}
