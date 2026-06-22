import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../../common/grid-report';
import {
  CustomerGroup,
  CustomerGroupService,
  CreateCustomerGroupDto,
  UpdateCustomerGroupDto
} from '../../../services/customer-group.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  name?: string;
  percentage?: string;
}

function emptyForm(): CustomerGroup {
  return {
    customerGroupId: 0,
    name: '',
    percentage: '0',
    isActive: true,
  };
}

@Component({
  selector: 'app-customer-group',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './customer-group.component.html',
  styleUrls: ['./customer-group.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CustomerGroupComponent implements OnInit, OnDestroy {
  groups: CustomerGroup[] = [];
  filteredGroups: CustomerGroup[] = [];
  selectedGroup: CustomerGroup | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: CustomerGroup = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private customerGroupService: CustomerGroupService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());

    this.loadGroups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Customer Group' : 'Edit Customer Group';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  loadGroups(): void {
    this.isLoading = true;
    this.customerGroupService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.groups = raw.map(x => this.mapGroup(x));
        this.totalRecords = res?.totalCount ?? this.groups.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load customer groups. Please try again.'
        });
      }
    });
  }

  private mapGroup(x: any): CustomerGroup {
    return {
      customerGroupId: x.customerGroupId ?? x.id ?? 0,
      name: x.name ?? '',
      percentage: x.percentage ?? '0',
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
    this.filteredGroups = this.groups.filter(g => {
      const matchesSearch = !term
        || g.name.toLowerCase().includes(term)
        || g.percentage.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || g.isActive === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(group: CustomerGroup): void {
    this.dialogMode = 'edit';
    this.formData = { ...group };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedGroup) this.openEditDialog(this.selectedGroup);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.name?.trim()) {
      this.formErrors.name = 'Group name is required';
    }
    if (this.formData.percentage?.trim() === '') {
      this.formErrors.percentage = 'Percentage is required';
    } else if (!/^-?\d+(\.\d+)?$/.test(this.formData.percentage.trim())) {
      this.formErrors.percentage = 'Enter a valid percentage';
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

  private toCreateDto(f: CustomerGroup): CreateCustomerGroupDto {
    return {
      name: f.name.trim(),
      percentage: f.percentage.trim(),
      isActive: f.isActive,
    };
  }

  private toUpdateDto(f: CustomerGroup): UpdateCustomerGroupDto {
    return {
      id: f.customerGroupId,
      ...this.toCreateDto(f),
    };
  }

  private saveAdd(): void {
    this.customerGroupService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapGroup(res?.data ?? res ?? this.formData);
        this.groups = [...this.groups, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Group Added',
          detail: `"${added.name}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add customer group. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.customerGroupService.update(this.formData.customerGroupId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.groups.findIndex(g => g.customerGroupId === this.formData.customerGroupId);
        if (idx !== -1) {
          this.groups = [
            ...this.groups.slice(0, idx),
            { ...this.formData },
            ...this.groups.slice(idx + 1)
          ];
        }
        if (this.selectedGroup?.customerGroupId === this.formData.customerGroupId) {
          this.selectedGroup = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Group Updated',
          detail: `"${this.formData.name}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update customer group. Please try again.'
        });
      }
    });
  }

  confirmDelete(group: CustomerGroup, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${group.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(group)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedGroup) this.confirmDelete(this.selectedGroup, event);
  }

  private executeDelete(group: CustomerGroup): void {
    this.customerGroupService.delete(group.customerGroupId).subscribe({
      next: () => {
        this.groups = this.groups.filter(g => g.customerGroupId !== group.customerGroupId);
        if (this.selectedGroup?.customerGroupId === group.customerGroupId) {
          this.selectedGroup = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Group Deleted',
          detail: `"${group.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete customer group. Please try again.'
        });
      }
    });
  }

  get groupReportConfig(): GridReportConfig {
    return {
      title: 'Customer Group List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'customer-groups',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Percentage', field: 'percentage' },
        {
          header: 'Active',
          field: 'isActive',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredGroups.map(g => ({
        name: g.name,
        percentage: g.percentage,
        isActive: g.isActive
      }))
    };
  }
}
