import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import { AppRole, RoleService } from '../../services/role.service';
import {
  AppUser,
  CreateUserDto,
  UpdateUserDto,
  UserService
} from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  userName?: string;
  displayName?: string;
  password?: string;
}

interface RoleOption {
  label: string;
  value: number;
}

function emptyForm(): AppUser & { password: string } {
  return {
    userId: 0,
    userName: '',
    displayName: '',
    email: '',
    isActive: true,
    isApproved: true,
    password: '',
    roleIds: [],
    roleNames: []
  };
}

@Component({
  selector: 'app-user',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class UserComponent implements OnInit, OnDestroy {
  users: AppUser[] = [];
  selectedUser: AppUser | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  approvalFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  roleOptions: RoleOption[] = [];
  selectedRoleIds: number[] = [];
  isSuperAdmin = false;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  readonly approvalFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Approved', value: true as boolean | null },
    { label: 'Pending', value: false as boolean | null },
  ];

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const roles = (this.authService.getUser()?.roles ?? []).map(r => r.toLowerCase());
    this.isSuperAdmin = roles.includes('superadmin');
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.loadUsers());
    this.loadLookups();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add User' : 'Edit User';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null || this.approvalFilter !== null;
  }

  get userReportConfig(): GridReportConfig {
    return {
      title: 'Users',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'users',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'User Name', field: 'userName' },
        { header: 'Display Name', field: 'displayName' },
        { header: 'Email', field: 'email' },
        { header: 'Role', field: 'roleNames' },
        { header: 'Approved', field: 'isApproved', format: (v) => formatYesNo(v) },
        { header: 'Active', field: 'isActive', format: (v) => formatYesNo(v) }
      ],
      rows: this.users.map(u => ({
        userName: u.userName,
        displayName: u.displayName,
        email: u.email,
        roleNames: (u.roleNames ?? []).join(', ') || '—',
        isApproved: u.isApproved,
        isActive: u.isActive
      }))
    };
  }

  loadLookups(): void {
    this.roleService.getAll({ isActive: true, pageSize: 200 }).subscribe({
      next: (res) => {
        const list = this.extractItems(res);
        this.roleOptions = list.map((r: any) => ({
          label: r.roleName ?? r.name ?? '',
          value: Number(r.roleId ?? r.id ?? 0)
        })).filter(o => o.value > 0);
        if (this.users.length > 0) {
          this.users = this.users.map(u => this.mapUser({
            ...u,
            roleIds: u.roleIds,
            roleNames: u.roleNames
          }));
        }
        this.cdr.detectChanges();
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    const params: {
      search: string;
      pageSize: number;
      isActive?: boolean;
      isApproved?: boolean;
    } = {
      search: this.searchTerm.trim(),
      pageSize: 200
    };
    if (this.activeFilter !== null) params.isActive = this.activeFilter;
    if (this.approvalFilter !== null) params.isApproved = this.approvalFilter;

    this.userService.getAll(params).subscribe({
      next: (res) => {
        const raw = this.extractItems(res);
        this.users = raw.map((x: any) => this.mapUser(x));
        this.totalRecords = res?.totalCount ?? this.users.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load users.' });
      }
    });
  }

  private mapUser(x: any): AppUser {
    const roleIds: number[] = Array.isArray(x.roleIds)
      ? x.roleIds.map((id: any) => Number(id)).filter((id: number) => id > 0)
      : (x.roleId ? [Number(x.roleId)] : []);
    let roleNames: string[] = Array.isArray(x.roleNames)
      ? x.roleNames.filter((n: any) => !!n)
      : [];
    if (roleNames.length === 0 && roleIds.length > 0 && this.roleOptions.length > 0) {
      roleNames = roleIds
        .map(id => this.roleOptions.find(o => o.value === id)?.label)
        .filter((n): n is string => !!n);
    }
    return {
      userId: Number(x.userId ?? x.id ?? 0),
      userName: x.userName ?? '',
      displayName: x.displayName ?? x.companyName ?? x.userName ?? '',
      email: x.email ?? '',
      isActive: x.isActive !== false,
      isApproved: x.isApproved !== false,
      lastLoginDate: x.lastLoginDate ? new Date(x.lastLoginDate) : null,
      roleIds,
      roleNames
    };
  }

  private extractItems(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  onSearchChange(): void { this.search$.next(); }
  onFilterChange(): void { this.search$.next(); }
  onClearSearch(): void {
    this.searchTerm = '';
    this.activeFilter = null;
    this.approvalFilter = null;
    this.loadUsers();
  }

  approveUser(user: AppUser, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Approve user <strong>${user.userName}</strong>?`,
      header: 'Approve User',
      icon: 'pi pi-check-circle',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => {
        this.userService.approve(user.userId).subscribe({
          next: (res) => {
            const updated = this.mapUser(res?.data ?? res);
            const idx = this.users.findIndex(u => u.userId === updated.userId);
            if (idx !== -1) {
              this.users = [...this.users.slice(0, idx), updated, ...this.users.slice(idx + 1)];
            }
            this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'User can now sign in.' });
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Approve Failed',
              detail: err?.error?.title ?? err?.error ?? 'Only SuperAdmin can approve users.'
            });
          }
        });
      }
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.selectedRoleIds = [];
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(user: AppUser): void {
    this.dialogMode = 'edit';
    this.formErrors = {};
    this.isSaving = false;
    this.userService.getById(user.userId).subscribe({
      next: (res) => {
        const u = this.mapUser(res?.data ?? res);
        this.formData = { ...u, password: '' };
        this.selectedRoleIds = [...(u.roleIds ?? [])];
        this.dialogVisible = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load user details.' });
      }
    });
  }

  onEditSelected(): void {
    if (this.selectedUser) this.openEditDialog(this.selectedUser);
  }

  validate(): boolean {
    this.formErrors = {};
    if (!this.formData.userName.trim()) this.formErrors.userName = 'User name is required';
    if (!this.formData.displayName.trim()) this.formErrors.displayName = 'Display name is required';
    if (this.dialogMode === 'add' && !this.formData.password.trim()) {
      this.formErrors.password = 'Password is required';
    }
    if (this.formData.password && this.formData.password.length < 6) {
      this.formErrors.password = 'Password must be at least 6 characters';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    const roleIds = this.selectedRoleIds;

    if (this.dialogMode === 'add') {
      const dto: CreateUserDto = {
        userName: this.formData.userName.trim(),
        displayName: this.formData.displayName.trim(),
        email: this.formData.email?.trim() || null,
        password: this.formData.password,
        isActive: this.formData.isActive,
        createdBy: null,
        roleIds
      };
      this.userService.create(dto).subscribe({
        next: (res) => {
          const created = this.mapUser(res?.data ?? res);
          this.users = [...this.users, created];
          this.totalRecords++;
          this.dialogVisible = false;
          this.isSaving = false;
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'User created.' });
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: err?.error?.title ?? err?.error ?? 'Could not create user.'
          });
        }
      });
    } else {
      const dto: UpdateUserDto = {
        userId: this.formData.userId,
        userName: this.formData.userName.trim(),
        displayName: this.formData.displayName.trim(),
        email: this.formData.email?.trim() || null,
        password: this.formData.password?.trim() || null,
        isActive: this.formData.isActive,
        modifiedBy: null,
        roleIds
      };
      this.userService.update(this.formData.userId, dto).subscribe({
        next: (res) => {
          const updated = this.mapUser(res?.data ?? res);
          const idx = this.users.findIndex(u => u.userId === updated.userId);
          if (idx !== -1) {
            this.users = [...this.users.slice(0, idx), updated, ...this.users.slice(idx + 1)];
          }
          if (this.selectedUser?.userId === updated.userId) this.selectedUser = updated;
          this.dialogVisible = false;
          this.isSaving = false;
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'User updated.' });
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Save Failed',
            detail: err?.error?.title ?? err?.error ?? 'Could not update user.'
          });
        }
      });
    }
  }

  confirmDelete(user: AppUser, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete user <strong>${user.userName}</strong>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(user)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedUser) this.confirmDelete(this.selectedUser, event);
  }

  private executeDelete(user: AppUser): void {
    this.userService.delete(user.userId).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.userId !== user.userId);
        if (this.selectedUser?.userId === user.userId) this.selectedUser = null;
        this.totalRecords--;
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'User deleted.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete user.' });
      }
    });
  }
}
