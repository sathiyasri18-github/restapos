// employee.component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatDate, formatYesNo } from '../../common/grid-report';
import {
  Employee,
  EmployeeService,
  CreateEmployeeDto,
  UpdateEmployeeDto
} from '../../services/employee.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  employeeName?: string;
  mobileNo?:     string;
}

function emptyForm(): Employee {
  return {
    employeeId:   0,
    employeeName: '',
    mobileNo:     '',
    designation:  '',
    joiningDate:  null,
    isActive:     true,
  };
}

@Component({
  selector: 'app-employee',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class EmployeeComponent implements OnInit, OnDestroy {

  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Employee = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  readonly statusFilterOptions = [
    { label: 'All',      value: null  as boolean | null },
    { label: 'Active',   value: true  as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private employeeService: EmployeeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadEmployees());

    this.loadEmployees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Employee' : 'Edit Employee';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  formatDate(value: Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  onSearchChange(): void {
    this.search$.next();
  }

  onFilterChange(): void {
    this.search$.next();
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.activeFilter = null;
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;
    const params: { search: string; pageSize: number; isActive?: boolean } = {
      search:   this.searchTerm.trim(),
      pageSize: 200,
    };
    if (this.activeFilter !== null) params.isActive = this.activeFilter;

    this.employeeService.getAll(params).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data)  ? res.data
          : [];
        this.employees = raw.map(x => this.mapEmployee(x));
        this.totalRecords = res?.totalCount ?? this.employees.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load employees. Please try again.'
        });
      }
    });
  }

  private mapEmployee(x: any): Employee {
    return {
      employeeId:   x.employeeId ?? x.id ?? 0,
      employeeName: x.employeeName ?? '',
      mobileNo:     x.mobileNo ?? '',
      designation:  x.designation ?? '',
      joiningDate:  x.joiningDate ? this.parseDate(x.joiningDate) : null,
      isActive:     x.isActive !== false && x.isActive !== 0,
      createdDate:  x.createdDate  ? new Date(x.createdDate)  : null,
      createdBy:    x.createdBy != null ? Number(x.createdBy) : null,
      modifiedDate: x.modifiedDate ? new Date(x.modifiedDate) : null,
      modifiedBy:   x.modifiedBy != null ? Number(x.modifiedBy) : null,
    };
  }

  private parseDate(value: string | Date): Date {
    if (value instanceof Date) return value;
    const parts = String(value).split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(+parts[0], +parts[1] - 1, +parts[2]);
    }
    return new Date(value);
  }

  private toDateOnly(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData   = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(employee: Employee): void {
    this.dialogMode = 'edit';
    this.formData   = { ...employee, joiningDate: employee.joiningDate ? new Date(employee.joiningDate) : null };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedEmployee) this.openEditDialog(this.selectedEmployee);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.employeeName?.trim()) {
      this.formErrors.employeeName = 'Employee name is required';
    }
    if (this.formData.mobileNo?.trim() &&
        !/^\d{7,15}$/.test(this.formData.mobileNo.replace(/[\s\-+]/g, ''))) {
      this.formErrors.mobileNo = 'Enter a valid mobile number';
    }

    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    this.dialogMode === 'add' ? this.saveAdd() : this.saveEdit();
  }

  private toCreateDto(f: Employee): CreateEmployeeDto {
    return {
      employeeName: f.employeeName.trim(),
      mobileNo:     f.mobileNo?.trim() || null,
      designation:  f.designation?.trim() || null,
      joiningDate:  this.toDateOnly(f.joiningDate),
      isActive:     f.isActive,
      createdBy:    null,
    };
  }

  private toUpdateDto(f: Employee): UpdateEmployeeDto {
    return {
      employeeId:   f.employeeId,
      employeeName: f.employeeName.trim(),
      mobileNo:     f.mobileNo?.trim() || null,
      designation:  f.designation?.trim() || null,
      joiningDate:  this.toDateOnly(f.joiningDate),
      isActive:     f.isActive,
      modifiedBy:   null,
    };
  }

  private saveAdd(): void {
    this.employeeService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapEmployee(res?.data ?? res ?? this.formData);
        this.employees = [...this.employees, added];
        this.totalRecords++;
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Employee Added',
          detail: `"${added.employeeName}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add employee. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.employeeService.update(this.formData.employeeId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.employees.findIndex(e => e.employeeId === this.formData.employeeId);
        if (idx !== -1) {
          this.employees = [
            ...this.employees.slice(0, idx),
            { ...this.formData },
            ...this.employees.slice(idx + 1)
          ];
        }
        if (this.selectedEmployee?.employeeId === this.formData.employeeId) {
          this.selectedEmployee = { ...this.formData };
        }
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Employee Updated',
          detail: `"${this.formData.employeeName}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update employee. Please try again.'
        });
      }
    });
  }

  confirmDelete(employee: Employee, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${employee.employeeName}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(employee)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedEmployee) this.confirmDelete(this.selectedEmployee, event);
  }

  private executeDelete(employee: Employee): void {
    this.employeeService.delete(employee.employeeId).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e.employeeId !== employee.employeeId);
        if (this.selectedEmployee?.employeeId === employee.employeeId) {
          this.selectedEmployee = null;
        }
        this.totalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Employee Deleted',
          detail: `"${employee.employeeName}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete employee. Please try again.'
        });
      }
    });
  }

  get employeeReportConfig(): GridReportConfig {
    return {
      title: 'Employee List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'employees',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'employeeName' },
        { header: 'Mobile', field: 'mobileNo' },
        { header: 'Designation', field: 'designation' },
        { header: 'Joining Date', field: 'joiningDate', format: (v) => formatDate(v) },
        { header: 'Active', field: 'isActive', format: (v) => formatYesNo(v) }
      ],
      rows: this.employees.map(e => ({
        employeeName: e.employeeName,
        mobileNo: e.mobileNo,
        designation: e.designation,
        joiningDate: e.joiningDate,
        isActive: e.isActive
      }))
    };
  }
}
