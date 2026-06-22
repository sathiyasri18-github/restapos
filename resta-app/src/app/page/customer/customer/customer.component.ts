import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../../common/grid-report';
import {
  Customer,
  CustomerService,
  CreateCustomerDto,
  UpdateCustomerDto
} from '../../../services/customer.service';
import { CustomerGroup, CustomerGroupService } from '../../../services/customer-group.service';

type DialogMode = 'add' | 'edit';

interface GroupOption {
  label: string;
  value: number;
}

interface FormErrors {
  name?: string;
  customerGroupId?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
}

function emptyForm(): Customer {
  return {
    customerId: 0,
    customerGroupId: 0,
    userId: null,
    name: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    taxNo: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    points: null,
    deposit: null,
    expense: null,
    isActive: true,
  };
}

@Component({
  selector: 'app-customer',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CustomerComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  groupFilter: number | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Customer = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  groupOptions: GroupOption[] = [];
  private groupLabels: Record<number, string> = {};

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private customerService: CustomerService,
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
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Customer' : 'Edit Customer';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null || this.groupFilter !== null;
  }

  get groupFilterOptions(): { label: string; value: number | null }[] {
    return [{ label: 'All Groups', value: null }, ...this.groupOptions];
  }

  getGroupName(groupId: number): string {
    return this.groupLabels[groupId] ?? '—';
  }

  loadGroups(): void {
    this.customerGroupService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.groupOptions = raw
          .map(x => ({
            label: x.name ?? '',
            value: x.customerGroupId ?? x.id ?? 0,
          }))
          .filter(o => o.value > 0);
        this.groupLabels = Object.fromEntries(this.groupOptions.map(o => [o.value, o.label]));
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Customer Groups',
          detail: 'Could not load customer groups.'
        });
      }
    });
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.customers = raw.map(x => this.mapCustomer(x));
        this.totalRecords = res?.totalCount ?? this.customers.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load customers. Please try again.'
        });
      }
    });
  }

  private mapCustomer(x: any): Customer {
    return {
      customerId: x.customerId ?? x.id ?? 0,
      customerGroupId: x.customerGroupId ?? 0,
      userId: x.userId != null ? Number(x.userId) : null,
      name: x.name ?? '',
      companyName: x.companyName ?? '',
      email: x.email ?? '',
      phoneNumber: x.phoneNumber ?? '',
      taxNo: x.taxNo ?? '',
      address: x.address ?? '',
      city: x.city ?? '',
      state: x.state ?? '',
      postalCode: x.postalCode ?? '',
      country: x.country ?? '',
      points: x.points != null ? Number(x.points) : null,
      deposit: x.deposit != null ? Number(x.deposit) : null,
      expense: x.expense != null ? Number(x.expense) : null,
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
    this.groupFilter = null;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCustomers = this.customers.filter(c => {
      const matchesSearch = !term
        || c.name.toLowerCase().includes(term)
        || c.companyName.toLowerCase().includes(term)
        || c.phoneNumber.toLowerCase().includes(term)
        || c.email.toLowerCase().includes(term)
        || c.city.toLowerCase().includes(term);
      const matchesStatus = this.activeFilter === null || c.isActive === this.activeFilter;
      const matchesGroup = this.groupFilter === null || c.customerGroupId === this.groupFilter;
      return matchesSearch && matchesStatus && matchesGroup;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    if (this.groupOptions.length > 0) {
      this.formData.customerGroupId = this.groupOptions[0].value;
    }
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(customer: Customer): void {
    this.dialogMode = 'edit';
    this.formData = { ...customer };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedCustomer) this.openEditDialog(this.selectedCustomer);
  }

  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
  }

  private validate(): boolean {
    this.formErrors = {};

    if (!this.formData.name?.trim()) {
      this.formErrors.name = 'Customer name is required';
    }
    if (!this.formData.customerGroupId) {
      this.formErrors.customerGroupId = 'Customer group is required';
    }
    if (!this.formData.phoneNumber?.trim()) {
      this.formErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[\d+\-\s]{7,20}$/.test(this.formData.phoneNumber.replace(/\s/g, ''))) {
      this.formErrors.phoneNumber = 'Enter a valid phone number';
    }
    if (this.formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
      this.formErrors.email = 'Enter a valid email address';
    }
    if (!this.formData.address?.trim()) {
      this.formErrors.address = 'Address is required';
    }
    if (!this.formData.city?.trim()) {
      this.formErrors.city = 'City is required';
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

  private toCreateDto(f: Customer): CreateCustomerDto {
    return {
      customerGroupId: f.customerGroupId,
      userId: f.userId,
      name: f.name.trim(),
      companyName: f.companyName?.trim() || null,
      email: f.email?.trim() || null,
      phoneNumber: f.phoneNumber.trim(),
      taxNo: f.taxNo?.trim() || null,
      address: f.address.trim(),
      city: f.city.trim(),
      state: f.state?.trim() || null,
      postalCode: f.postalCode?.trim() || null,
      country: f.country?.trim() || null,
      points: f.points,
      deposit: f.deposit,
      expense: f.expense,
      isActive: f.isActive,
    };
  }

  private toUpdateDto(f: Customer): UpdateCustomerDto {
    return {
      id: f.customerId,
      ...this.toCreateDto(f),
    };
  }

  private saveAdd(): void {
    this.customerService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapCustomer(res?.data ?? res ?? this.formData);
        this.customers = [...this.customers, added];
        this.totalRecords++;
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Customer Added',
          detail: `"${added.name}" was added successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not add customer. Please try again.'
        });
      }
    });
  }

  private saveEdit(): void {
    this.customerService.update(this.formData.customerId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.customers.findIndex(c => c.customerId === this.formData.customerId);
        if (idx !== -1) {
          this.customers = [
            ...this.customers.slice(0, idx),
            { ...this.formData },
            ...this.customers.slice(idx + 1)
          ];
        }
        if (this.selectedCustomer?.customerId === this.formData.customerId) {
          this.selectedCustomer = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Customer Updated',
          detail: `"${this.formData.name}" was updated successfully.`
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: 'Could not update customer. Please try again.'
        });
      }
    });
  }

  confirmDelete(customer: Customer, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${customer.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(customer)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedCustomer) this.confirmDelete(this.selectedCustomer, event);
  }

  private executeDelete(customer: Customer): void {
    this.customerService.delete(customer.customerId).subscribe({
      next: () => {
        this.customers = this.customers.filter(c => c.customerId !== customer.customerId);
        if (this.selectedCustomer?.customerId === customer.customerId) {
          this.selectedCustomer = null;
        }
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Customer Deleted',
          detail: `"${customer.name}" was deleted.`
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete customer. Please try again.'
        });
      }
    });
  }

  get customerReportConfig(): GridReportConfig {
    return {
      title: 'Customer List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'customers',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Company', field: 'companyName' },
        { header: 'Group', field: 'customerGroupId' },
        { header: 'Phone', field: 'phoneNumber' },
        { header: 'Email', field: 'email' },
        { header: 'City', field: 'city' },
        {
          header: 'Active',
          field: 'isActive',
          format: (v) => formatYesNo(v as boolean)
        }
      ],
      rows: this.filteredCustomers.map(c => ({
        name: c.name,
        companyName: c.companyName || '—',
        customerGroupId: this.getGroupName(c.customerGroupId),
        phoneNumber: c.phoneNumber || '—',
        email: c.email || '—',
        city: c.city || '—',
        isActive: c.isActive
      }))
    };
  }
}
