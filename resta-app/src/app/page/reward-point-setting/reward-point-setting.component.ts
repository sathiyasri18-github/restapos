import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  RewardPointSetting,
  RewardPointSettingService,
  CreateRewardPointSettingDto,
  UpdateRewardPointSettingDto
} from '../../services/reward-point-setting.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  perPointAmount?: string;
  minimumAmount?: string;
}

function emptyForm(): RewardPointSetting {
  return {
    rewardPointSettingId: 0,
    perPointAmount: 0,
    minimumAmount: 0,
    duration: null,
    type: '',
    isActive: true,
  };
}

@Component({
  selector: 'app-reward-point-setting',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './reward-point-setting.component.html',
  styleUrls: ['./reward-point-setting.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class RewardPointSettingComponent implements OnInit, OnDestroy {
  settings: RewardPointSetting[] = [];
  filteredSettings: RewardPointSetting[] = [];
  selectedSetting: RewardPointSetting | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: RewardPointSetting = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private rewardPointSettingService: RewardPointSettingService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Reward Point Setting' : 'Edit Reward Point Setting';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  getDisplayLabel(setting: RewardPointSetting): string {
    return setting.type?.trim() || `Setting #${setting.rewardPointSettingId}`;
  }

  loadSettings(): void {
    this.isLoading = true;
    this.rewardPointSettingService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.settings = raw.map(x => this.mapSetting(x));
        this.totalRecords = res?.totalCount ?? this.settings.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load reward point settings. Please try again.'
        });
      }
    });
  }

  private mapSetting(x: any): RewardPointSetting {
    return {
      rewardPointSettingId: x.rewardPointSettingId ?? x.id ?? 0,
      perPointAmount: Number(x.perPointAmount ?? 0),
      minimumAmount: Number(x.minimumAmount ?? 0),
      duration: x.duration != null ? Number(x.duration) : null,
      type: x.type ?? '',
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
    this.filteredSettings = this.settings.filter(s => {
      const matchesSearch = !term
        || s.type.toLowerCase().includes(term)
        || String(s.perPointAmount).includes(term)
        || String(s.minimumAmount).includes(term)
        || (s.duration != null && String(s.duration).includes(term));
      const matchesStatus = this.activeFilter === null || s.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(setting: RewardPointSetting): void {
    this.dialogMode = 'edit';
    this.formData = { ...setting };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedSetting) this.openEditDialog(this.selectedSetting);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    const perPointAmount = Number(this.formData.perPointAmount);
    if (isNaN(perPointAmount) || perPointAmount <= 0) {
      this.formErrors.perPointAmount = 'Per point amount must be greater than 0';
    }

    const minimumAmount = Number(this.formData.minimumAmount);
    if (isNaN(minimumAmount) || minimumAmount < 0) {
      this.formErrors.minimumAmount = 'Minimum amount must be 0 or greater';
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

  private toNullableDuration(value: number | null | undefined): number | null {
    if (value == null) return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  private toCreateDto(f: RewardPointSetting): CreateRewardPointSettingDto {
    return {
      perPointAmount: Number(f.perPointAmount),
      minimumAmount: Number(f.minimumAmount),
      duration: this.toNullableDuration(f.duration),
      type: f.type?.trim() || null,
      isActive: f.isActive,
    };
  }

  private toUpdateDto(f: RewardPointSetting): UpdateRewardPointSettingDto {
    return {
      id: f.rewardPointSettingId,
      perPointAmount: Number(f.perPointAmount),
      minimumAmount: Number(f.minimumAmount),
      duration: this.toNullableDuration(f.duration),
      type: f.type?.trim() || null,
      isActive: f.isActive,
    };
  }

  private saveAdd(): void {
    this.rewardPointSettingService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapSetting(res?.data ?? res ?? this.formData);
        this.settings = [...this.settings, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Setting Added',
          detail: `"${this.getDisplayLabel(added)}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add reward point setting. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.rewardPointSettingService.update(
      this.formData.rewardPointSettingId,
      this.toUpdateDto(this.formData)
    ).subscribe({
      next: () => {
        const idx = this.settings.findIndex(s => s.rewardPointSettingId === this.formData.rewardPointSettingId);
        if (idx !== -1) {
          this.settings = [
            ...this.settings.slice(0, idx),
            { ...this.formData },
            ...this.settings.slice(idx + 1)
          ];
        }
        if (this.selectedSetting?.rewardPointSettingId === this.formData.rewardPointSettingId) {
          this.selectedSetting = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Setting Updated',
          detail: `"${this.getDisplayLabel(this.formData)}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update reward point setting. Please try again.'
        });
      }
    });
  }

  confirmDelete(setting: RewardPointSetting, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${this.getDisplayLabel(setting)}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(setting)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedSetting) this.confirmDelete(this.selectedSetting, event);
  }

  private executeDelete(setting: RewardPointSetting): void {
    this.rewardPointSettingService.delete(setting.rewardPointSettingId).subscribe({
      next: () => {
        this.settings = this.settings.filter(s => s.rewardPointSettingId !== setting.rewardPointSettingId);
        if (this.selectedSetting?.rewardPointSettingId === setting.rewardPointSettingId) {
          this.selectedSetting = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Setting Deleted',
          detail: `"${this.getDisplayLabel(setting)}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete reward point setting. Please try again.'
        });
      }
    });
  }

  get rewardPointSettingReportConfig(): GridReportConfig {
    return {
      title: 'Reward Point Setting List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'reward-point-settings',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Per Point Amount', field: 'perPointAmount' },
        { header: 'Minimum Amount', field: 'minimumAmount' },
        { header: 'Duration', field: 'duration' },
        { header: 'Type', field: 'type' },
        {
          header: 'Active',
          field: 'isActive',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredSettings.map(s => ({
        perPointAmount: s.perPointAmount,
        minimumAmount: s.minimumAmount,
        duration: s.duration ?? '—',
        type: s.type || '—',
        isActive: s.isActive
      }))
    };
  }
}
