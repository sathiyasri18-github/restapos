// service-call.component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin, Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../common/grid-report';
import { Category, CategoryService, CreateCategoryDto } from '../../services/category.service';
import { CategoryType, CategoryTypeService } from '../../services/category-type.service';
import { Customer, CustomerService, CreateCustomerDto } from '../../services/customer.service';
import { CreateEmployeeDto, Employee, EmployeeService } from '../../services/employee.service';
import {
  CreateServiceCallDto,
  ServiceCall,
  ServiceCallService,
  UpdateServiceCallDto
} from '../../services/service-call.service';

type DialogMode = 'add' | 'edit';

interface SelectOption<T = number | string> {
  label: string;
  value: T;
}

interface FormErrors {
  customerId?:    string;
  serviceTypeId?: string;
  problemReport?: string;
  serviceDate?:   string;
  statusId?:      string;
}

type LookupAddKind = 'customer' | 'serviceType' | 'status' | 'priority' | 'actionTaken' | 'engineer';
type EngineerField = 'assigned' | 'chief';

/** Category type codes used to load lookup lists from Categories API */
const LOOKUP_TYPE_CODES = {
  serviceType: ['SERVICE_TYPE', 'SVC_TYPE', 'SERVICETYPE'],
  actionTaken: ['ACTION_TAKEN', 'ACTIONTAKEN'],
  status:      ['STATUS', 'SERVICE_STATUS'],
  priority:    ['PRIORITY', 'SERVICE_PRIORITY'],
} as const;

function emptyForm(): ServiceCall {
  return {
    serviceCallId:      0,
    customerId:         0,
    serviceTypeId:      0,
    problemReport:      '',
    actionTakenId:      null,
    assignedEngineerId: null,
    chiefEngineerId:    null,
    serviceDate:        new Date(),
    dueDate:            null,
    completedDate:      null,
    statusId:           0,
    priorityId:         null,
    remarks:            '',
  };
}

@Component({
  selector: 'app-service-call',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './service-call.component.html',
  styleUrls: ['./service-call.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ServiceCallComponent implements OnInit, OnDestroy {

  serviceCalls: ServiceCall[] = [];
  selectedServiceCall: ServiceCall | null = null;
  isLoading = false;
  lookupsLoading = false;
  totalRecords = 0;

  searchTerm = '';
  statusFilter: number | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: ServiceCall = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  customerOptions: SelectOption<number>[] = [];
  employeeOptions: SelectOption<number>[] = [];
  serviceTypeOptions: SelectOption<number>[] = [];
  actionTakenOptions: SelectOption<number>[] = [];
  statusOptions: SelectOption<number>[] = [];
  priorityOptions: SelectOption<number>[] = [];
  statusFilterOptions: SelectOption<number | null>[] = [{ label: 'All', value: null }];

  lookupAddVisible = false;
  lookupAddKind: LookupAddKind | null = null;
  lookupAddEngineerField: EngineerField = 'assigned';
  lookupAddName = '';
  lookupAddError = '';
  lookupAddSaving = false;

  private categoryTypeIds: {
    serviceType?: number;
    actionTaken?: number;
    status?: number;
    priority?: number;
  } = {};

  private customerMap = new Map<number, string>();
  private employeeMap = new Map<number, string>();
  private serviceTypeMap = new Map<number, string>();
  private actionTakenMap = new Map<number, string>();
  private statusMap = new Map<number, string>();
  private priorityMap = new Map<number, string>();

  constructor(
    private serviceCallService: ServiceCallService,
    private router: Router,
    private customerService: CustomerService,
    private employeeService: EmployeeService,
    private categoryTypeService: CategoryTypeService,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.loadServiceCalls());
    this.loadLookups();
    this.loadServiceCalls();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Service Call' : 'Edit Service Call';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.statusFilter != null;
  }

  get isEditMode(): boolean {
    return this.dialogMode === 'edit';
  }

  formatDate(value: Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getCustomerName(id: number): string {
    return this.customerMap.get(id) ?? '—';
  }

  getServiceTypeName(id: number): string {
    return this.serviceTypeMap.get(id) ?? '—';
  }

  getActionTakenName(id: number | null): string {
    if (id == null) return '—';
    return this.actionTakenMap.get(id) ?? '—';
  }

  getStatusName(id: number): string {
    return this.statusMap.get(id) ?? '—';
  }

  getPriorityName(id: number | null): string {
    if (id == null) return '—';
    return this.priorityMap.get(id) ?? '—';
  }

  getEmployeeName(id: number | null): string {
    if (id == null) return '—';
    return this.employeeMap.get(id) ?? '—';
  }

  getStatusClass(statusId: number): string {
    const s = (this.getStatusName(statusId) ?? '').toUpperCase();
    if (s.includes('COMPLETE')) return 'completed';
    if (s.includes('PEND')) return 'pending';
    if (s.includes('CANCEL')) return 'cancelled';
    return 'other';
  }

  onSearchChange(): void {
    this.search$.next();
  }

  onFilterChange(): void {
    this.search$.next();
  }

  onClearSearch(): void {
    this.searchTerm = '';
    this.statusFilter = null;
    this.loadServiceCalls();
  }

  loadLookups(): void {
    this.lookupsLoading = true;
    forkJoin({
      types:     this.categoryTypeService.getAll({ pageSize: 200 }),
      customers: this.customerService.getAll({ pageSize: 500 }),
      employees: this.employeeService.getAll({ isActive: true, pageSize: 500 }),
    }).subscribe({
      next: ({ types, customers, employees }) => {
        this.bindCustomers(customers);
        this.bindEmployees(employees);

        const typeList = this.extractItems(types) as CategoryType[];
        const loads: Record<string, ReturnType<CategoryService['getAll']>> = {};

        const resolveTypeId = (codes: readonly string[]): number | undefined => {
          for (const code of codes) {
            const found = typeList.find(
              t => t.categoryTypeCode?.toUpperCase() === code.toUpperCase()
            );
            if (found) return found.categoryTypeId;
          }
          return undefined;
        };

        const typeIds = {
          serviceType: resolveTypeId(LOOKUP_TYPE_CODES.serviceType),
          actionTaken: resolveTypeId(LOOKUP_TYPE_CODES.actionTaken),
          status:      resolveTypeId(LOOKUP_TYPE_CODES.status),
          priority:    resolveTypeId(LOOKUP_TYPE_CODES.priority),
        };
        this.categoryTypeIds = typeIds;

        if (typeIds.serviceType) loads['serviceType'] = this.categoryService.getAll({ categoryTypeId: typeIds.serviceType, pageSize: 500 });
        if (typeIds.actionTaken) loads['actionTaken'] = this.categoryService.getAll({ categoryTypeId: typeIds.actionTaken, pageSize: 500 });
        if (typeIds.status)      loads['status']      = this.categoryService.getAll({ categoryTypeId: typeIds.status, pageSize: 500 });
        if (typeIds.priority)    loads['priority']    = this.categoryService.getAll({ categoryTypeId: typeIds.priority, pageSize: 500 });

        if (Object.keys(loads).length === 0) {
          this.lookupsLoading = false;
          this.cdr.detectChanges();
          return;
        }

        forkJoin(loads).subscribe({
          next: (cats) => {
            if (cats['serviceType']) this.bindCategoryOptions(this.extractItems(cats['serviceType']), 'serviceType');
            if (cats['actionTaken']) this.bindCategoryOptions(this.extractItems(cats['actionTaken']), 'actionTaken');
            if (cats['status']) {
              this.bindCategoryOptions(this.extractItems(cats['status']), 'status');
              this.statusFilterOptions = [
                { label: 'All', value: null },
                ...this.statusOptions
              ];
            }
            if (cats['priority']) this.bindCategoryOptions(this.extractItems(cats['priority']), 'priority');
            this.lookupsLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.lookupsLoading = false;
            this.messageService.add({ severity: 'warn', summary: 'Lookups', detail: 'Could not load category lists.' });
          }
        });
      },
      error: () => {
        this.lookupsLoading = false;
        this.messageService.add({ severity: 'warn', summary: 'Lookups', detail: 'Could not load reference data.' });
      }
    });
  }

  private bindCustomers(res: any): void {
    const list = this.extractItems(res);
    this.customerMap.clear();
    this.customerOptions = list.map((c: any) => {
      const id = c.customerId ?? c.id ?? 0;
      const name = c.name ?? c.customerName ?? '';
      this.customerMap.set(id, name);
      return { label: name, value: id };
    });
  }

  private bindEmployees(res: any): void {
    const list = this.extractItems(res);
    this.employeeMap.clear();
    this.employeeOptions = list.map((e: any) => {
      const id = e.employeeId ?? e.id ?? 0;
      const name = e.employeeName ?? e.name ?? '';
      this.employeeMap.set(id, name);
      return { label: name, value: id };
    });
  }

  private mapCategory(x: any): Category {
    return {
      categoryId:     x.categoryId ?? x.id ?? 0,
      categoryName:   x.categoryName ?? '',
      categoryTypeId: x.categoryTypeId != null ? Number(x.categoryTypeId) : null,
    };
  }

  private bindCategoryOptions(list: any[], target: 'serviceType' | 'actionTaken' | 'status' | 'priority'): void {
    const cats = list.map(x => this.mapCategory(x));
    const options = cats.map(c => ({ label: c.categoryName, value: c.categoryId }));

    if (target === 'serviceType') {
      this.serviceTypeMap.clear();
      this.serviceTypeOptions = options;
      cats.forEach(c => this.serviceTypeMap.set(c.categoryId, c.categoryName));
    }
    if (target === 'actionTaken') {
      this.actionTakenMap.clear();
      this.actionTakenOptions = options;
      cats.forEach(c => this.actionTakenMap.set(c.categoryId, c.categoryName));
    }
    if (target === 'status') {
      this.statusMap.clear();
      this.statusOptions = options;
      cats.forEach(c => this.statusMap.set(c.categoryId, c.categoryName));
    }
    if (target === 'priority') {
      this.priorityMap.clear();
      this.priorityOptions = options;
      cats.forEach(c => this.priorityMap.set(c.categoryId, c.categoryName));
    }
  }

  loadServiceCalls(): void {
    this.isLoading = true;
    const params: { search: string; pageSize: number; statusId?: number } = {
      search:   this.searchTerm.trim(),
      pageSize: 200,
    };
    if (this.statusFilter != null) params.statusId = this.statusFilter;

    this.serviceCallService.getAll(params).subscribe({
      next: (res: any) => {
        const raw = this.extractItems(res);
        this.serviceCalls = raw.map((x: any) => this.mapServiceCall(x));
        this.totalRecords = res?.totalCount ?? this.serviceCalls.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load service calls.'
        });
      }
    });
  }

  private mapServiceCall(x: any): ServiceCall {
    return {
      serviceCallId:      Number(x.serviceCallId ?? x.id ?? 0),
      customerId:         Number(x.customerId ?? 0),
      serviceTypeId:      Number(x.serviceTypeId ?? 0),
      problemReport:      x.problemReport ?? '',
      actionTakenId:      x.actionTakenId != null ? Number(x.actionTakenId) : null,
      assignedEngineerId: x.assignedEngineerId != null ? Number(x.assignedEngineerId) : null,
      chiefEngineerId:    x.chiefEngineerId != null ? Number(x.chiefEngineerId) : null,
      serviceDate:        x.serviceDate ? this.parseDate(x.serviceDate) : null,
      dueDate:            x.dueDate ? this.parseDate(x.dueDate) : null,
      completedDate:      x.completedDate ? this.parseDate(x.completedDate) : null,
      statusId:           Number(x.statusId ?? 0),
      priorityId:         x.priorityId != null ? Number(x.priorityId) : null,
      remarks:            x.remarks ?? '',
      createdDate:        x.createdDate ? new Date(x.createdDate) : null,
      modifiedDate:       x.modifiedDate ? new Date(x.modifiedDate) : null,
    };
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private parseDate(value: string | Date): Date {
    if (value instanceof Date) return value;
    const parts = String(value).split('T')[0].split('-');
    if (parts.length === 3) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
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
    this.formData = emptyForm();
    if (this.statusOptions.length) this.formData.statusId = this.statusOptions[0].value;
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(item: ServiceCall): void {
    this.dialogMode = 'edit';
    this.formData = {
      ...item,
      serviceDate:   item.serviceDate ? new Date(item.serviceDate) : null,
      dueDate:       item.dueDate ? new Date(item.dueDate) : null,
      completedDate: item.completedDate ? new Date(item.completedDate) : null,
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedServiceCall) this.openEditDialog(this.selectedServiceCall);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  get lookupAddTitle(): string {
    switch (this.lookupAddKind) {
      case 'customer':     return 'Add Customer';
      case 'serviceType':  return 'Add Service Type';
      case 'status':       return 'Add Status';
      case 'priority':     return 'Add Priority';
      case 'actionTaken':  return 'Add Action Taken';
      case 'engineer':     return 'Add Engineer';
      default:             return 'Add';
    }
  }

  get lookupAddLabel(): string {
    switch (this.lookupAddKind) {
      case 'customer':     return 'Customer Name';
      case 'engineer':     return 'Employee Name';
      default:             return 'Name';
    }
  }

  openLookupAdd(kind: LookupAddKind, event: Event, engineerField: EngineerField = 'assigned'): void {
    event.preventDefault();
    event.stopPropagation();
    this.lookupAddKind = kind;
    this.lookupAddEngineerField = engineerField;
    this.lookupAddName = '';
    this.lookupAddError = '';
    this.lookupAddSaving = false;
    this.lookupAddVisible = true;
  }

  onLookupAddHide(): void {
    this.lookupAddKind = null;
    this.lookupAddName = '';
    this.lookupAddError = '';
    this.lookupAddSaving = false;
  }

  onLookupAddSave(): void {
    if (!this.lookupAddKind) return;
    const name = this.lookupAddName.trim();
    if (!name) {
      this.lookupAddError = `${this.lookupAddLabel} is required`;
      return;
    }
    this.lookupAddError = '';
    this.lookupAddSaving = true;

    switch (this.lookupAddKind) {
      case 'customer':
        this.saveLookupCustomer(name);
        break;
      case 'engineer':
        this.saveLookupEngineer(name);
        break;
      default:
        this.saveLookupCategory(this.lookupAddKind, name);
    }
  }

  private saveLookupCustomer(name: string): void {
    const dto: CreateCustomerDto = {
      customerGroupId: 1,
      userId: null,
      name,
      companyName: null,
      email: null,
      phoneNumber: '',
      taxNo: null,
      address: '',
      city: '',
      state: null,
      postalCode: null,
      country: null,
      points: null,
      deposit: null,
      expense: null,
      isActive: true,
    };
    this.customerService.create(dto).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res ?? {};
        const id = Number(raw.customerId ?? raw.id ?? 0);
        this.appendCustomerOption(id, name);
        this.formData.customerId = id;
        this.formErrors.customerId = undefined;
        this.finishLookupAdd('Customer added');
      },
      error: () => this.failLookupAdd('Could not add customer.'),
    });
  }

  private saveLookupEngineer(name: string): void {
    const dto: CreateEmployeeDto = {
      employeeName: name,
      mobileNo: null,
      designation: null,
      joiningDate: null,
      isActive: true,
      createdBy: null,
    };
    this.employeeService.create(dto).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res ?? {};
        const id = Number(raw.employeeId ?? raw.id ?? 0);
        this.appendEmployeeOption(id, name);
        if (this.lookupAddEngineerField === 'chief') {
          this.formData.chiefEngineerId = id;
        } else {
          this.formData.assignedEngineerId = id;
        }
        this.finishLookupAdd('Engineer added');
      },
      error: () => this.failLookupAdd('Could not add engineer.'),
    });
  }

  private saveLookupCategory(
    kind: 'serviceType' | 'status' | 'priority' | 'actionTaken',
    name: string
  ): void {
    const categoryTypeId = this.categoryTypeIds[kind];
    if (!categoryTypeId) {
      this.failLookupAdd('Category type is not configured. Add it under Category Type first.');
      return;
    }
    const dto: CreateCategoryDto = {
      categoryName: name,
      categoryTypeId,
      createdBy: null,
    };
    this.categoryService.create(dto).subscribe({
      next: (res: any) => {
        const cat = this.mapCategory(res?.data ?? res ?? { categoryName: name, categoryTypeId });
        this.appendCategoryOption(cat, kind);
        switch (kind) {
          case 'serviceType':
            this.formData.serviceTypeId = cat.categoryId;
            this.formErrors.serviceTypeId = undefined;
            break;
          case 'status':
            this.formData.statusId = cat.categoryId;
            this.formErrors.statusId = undefined;
            this.statusFilterOptions = [
              { label: 'All', value: null },
              ...this.statusOptions,
            ];
            break;
          case 'priority':
            this.formData.priorityId = cat.categoryId;
            break;
          case 'actionTaken':
            this.formData.actionTakenId = cat.categoryId;
            break;
        }
        this.finishLookupAdd('Item added');
      },
      error: () => this.failLookupAdd('Could not add item.'),
    });
  }

  private appendCustomerOption(id: number, name: string): void {
    if (!id) return;
    this.customerMap.set(id, name);
    if (!this.customerOptions.some(o => o.value === id)) {
      this.customerOptions = [...this.customerOptions, { label: name, value: id }]
        .sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  private appendEmployeeOption(id: number, name: string): void {
    if (!id) return;
    this.employeeMap.set(id, name);
    if (!this.employeeOptions.some(o => o.value === id)) {
      this.employeeOptions = [...this.employeeOptions, { label: name, value: id }]
        .sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  private appendCategoryOption(
    cat: Category,
    target: 'serviceType' | 'actionTaken' | 'status' | 'priority'
  ): void {
    const opt = { label: cat.categoryName, value: cat.categoryId };
    const append = (options: SelectOption<number>[], map: Map<number, string>) => {
      map.set(cat.categoryId, cat.categoryName);
      if (!options.some(o => o.value === cat.categoryId)) {
        return [...options, opt].sort((a, b) => a.label.localeCompare(b.label));
      }
      return options;
    };
    if (target === 'serviceType') {
      this.serviceTypeOptions = append(this.serviceTypeOptions, this.serviceTypeMap);
    }
    if (target === 'actionTaken') {
      this.actionTakenOptions = append(this.actionTakenOptions, this.actionTakenMap);
    }
    if (target === 'status') {
      this.statusOptions = append(this.statusOptions, this.statusMap);
    }
    if (target === 'priority') {
      this.priorityOptions = append(this.priorityOptions, this.priorityMap);
    }
  }

  private finishLookupAdd(detail: string): void {
    this.lookupAddVisible = false;
    this.lookupAddSaving = false;
    this.cdr.detectChanges();
    this.messageService.add({ severity: 'success', summary: 'Added', detail });
  }

  private failLookupAdd(detail: string): void {
    this.lookupAddSaving = false;
    this.lookupAddError = detail;
    this.messageService.add({ severity: 'error', summary: 'Add Failed', detail });
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.formData.customerId) this.formErrors.customerId = 'Customer is required';
    if (!this.formData.serviceTypeId) this.formErrors.serviceTypeId = 'Service type is required';
    if (!this.formData.problemReport?.trim()) this.formErrors.problemReport = 'Problem report is required';
    if (!this.formData.serviceDate) this.formErrors.serviceDate = 'Service date is required';
    if (!this.formData.statusId) this.formErrors.statusId = 'Status is required';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    this.dialogMode === 'add' ? this.saveAdd() : this.saveEdit();
  }

  private toCreateDto(f: ServiceCall): CreateServiceCallDto {
    return {
      customerId:         f.customerId,
      serviceTypeId:      f.serviceTypeId,
      problemReport:      f.problemReport.trim(),
      actionTakenId:      f.actionTakenId,
      assignedEngineerId: f.assignedEngineerId,
      chiefEngineerId:    f.chiefEngineerId,
      serviceDate:        this.toDateOnly(f.serviceDate)!,
      dueDate:            this.toDateOnly(f.dueDate),
      statusId:           f.statusId,
      priorityId:         f.priorityId,
      remarks:            f.remarks?.trim() || null,
      createdBy:          null,
    };
  }

  private toUpdateDto(f: ServiceCall): UpdateServiceCallDto {
    return {
      serviceCallId:      f.serviceCallId,
      customerId:         f.customerId,
      serviceTypeId:      f.serviceTypeId,
      problemReport:      f.problemReport.trim(),
      actionTakenId:      f.actionTakenId,
      assignedEngineerId: f.assignedEngineerId,
      chiefEngineerId:    f.chiefEngineerId,
      serviceDate:        this.toDateOnly(f.serviceDate)!,
      dueDate:            this.toDateOnly(f.dueDate),
      completedDate:      this.toDateOnly(f.completedDate),
      statusId:           f.statusId,
      priorityId:         f.priorityId,
      remarks:            f.remarks?.trim() || null,
      modifiedBy:         null,
    };
  }

  private saveAdd(): void {
    this.serviceCallService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapServiceCall(res?.data ?? res ?? this.formData);
        this.serviceCalls = [...this.serviceCalls, added];
        this.totalRecords++;
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Service Call Added',
          detail: 'Service call was created successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add service call.' });
      }
    });
  }

  private saveEdit(): void {
    this.serviceCallService.update(this.formData.serviceCallId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.serviceCalls.findIndex(s => s.serviceCallId === this.formData.serviceCallId);
        if (idx !== -1) {
          this.serviceCalls = [
            ...this.serviceCalls.slice(0, idx),
            { ...this.formData },
            ...this.serviceCalls.slice(idx + 1)
          ];
        }
        if (this.selectedServiceCall?.serviceCallId === this.formData.serviceCallId) {
          this.selectedServiceCall = { ...this.formData };
        }
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Service Call Updated',
          detail: 'Service call was updated successfully.'
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update service call.' });
      }
    });
  }

  confirmDelete(item: ServiceCall, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete service call #<strong>${item.serviceCallId}</strong>? This cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(item)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedServiceCall) this.confirmDelete(this.selectedServiceCall, event);
  }

  private executeDelete(item: ServiceCall): void {
    this.serviceCallService.delete(item.serviceCallId).subscribe({
      next: () => {
        this.serviceCalls = this.serviceCalls.filter(s => s.serviceCallId !== item.serviceCallId);
        if (this.selectedServiceCall?.serviceCallId === item.serviceCallId) {
          this.selectedServiceCall = null;
        }
        this.totalRecords--;
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Service call was deleted.'
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete service call.' });
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/service-call-dashboard']);
  }

  get serviceCallReportConfig(): GridReportConfig {
    const parts: string[] = [];
    if (this.searchTerm.trim()) parts.push(`Search: ${this.searchTerm}`);
    if (this.statusFilter != null) parts.push(`Status: ${this.getStatusName(this.statusFilter)}`);
    return {
      title: 'Service Calls',
      subtitle: parts.length ? parts.join(' | ') : undefined,
      fileName: 'service_calls',
      orientation: 'landscape',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Date', field: 'serviceDate', format: (v) => this.formatDate(v as Date | null | undefined) },
        {
          header: 'Customer',
          field: 'customerId',
          format: (v) => this.getCustomerName(v as number)
        },
        {
          header: 'Service Type',
          field: 'serviceTypeId',
          format: (v) => this.getServiceTypeName(v as number)
        },
        { header: 'Problem', field: 'problemReport' },
        {
          header: 'Action Taken',
          field: 'actionTakenId',
          format: (v) => this.getActionTakenName(v as number | null)
        },
        { header: 'Due Date', field: 'dueDate', format: (v) => this.formatDate(v as Date | null | undefined) },
        { header: 'Completed', field: 'completedDate', format: (v) => this.formatDate(v as Date | null | undefined) },
        {
          header: 'Status',
          field: 'statusId',
          format: (v) => this.getStatusName(v as number)
        },
        {
          header: 'Priority',
          field: 'priorityId',
          format: (v) => this.getPriorityName(v as number | null)
        },
        {
          header: 'Engineer',
          field: 'assignedEngineerId',
          format: (v) => this.getEmployeeName(v as number | null)
        }
      ],
      rows: this.serviceCalls.map(s => ({
        serviceDate: s.serviceDate,
        customerId: s.customerId,
        serviceTypeId: s.serviceTypeId,
        problemReport: s.problemReport,
        actionTakenId: s.actionTakenId,
        dueDate: s.dueDate,
        completedDate: s.completedDate,
        statusId: s.statusId,
        priorityId: s.priorityId,
        assignedEngineerId: s.assignedEngineerId
      }))
    };
  }
}
