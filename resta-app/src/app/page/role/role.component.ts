import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  AppRole,
  CreateRoleDto,
  RoleMenuPermission,
  RoleService,
  SetRoleMenusDto,
  UpdateRoleDto
} from '../../services/role.service';

type DialogMode = 'add' | 'edit';

interface FormErrors {
  roleName?: string;
}

function emptyForm(): AppRole {
  return { roleId: 0, roleName: '', description: '', isActive: true };
}

@Component({
  selector: 'app-role',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class RoleComponent implements OnInit, OnDestroy {
  roles: AppRole[] = [];
  selectedRole: AppRole | null = null;
  isLoading = false;
  totalRecords = 0;
  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;

  permDialogVisible = false;
  permLoading = false;
  permSaving = false;
  menuPermissions: RoleMenuPermission[] = [];
  permRole: AppRole | null = null;

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private roleService: RoleService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.loadRoles());
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Role' : 'Edit Role';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  get roleReportConfig(): GridReportConfig {
    return {
      title: 'Roles',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'roles',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Role Name', field: 'roleName' },
        { header: 'Description', field: 'description' },
        { header: 'Active', field: 'isActive', format: (v) => formatYesNo(v) }
      ],
      rows: this.roles.map(r => ({
        roleName: r.roleName,
        description: r.description,
        isActive: r.isActive
      }))
    };
  }

  loadRoles(): void {
    this.isLoading = true;
    const params: { search: string; pageSize: number; isActive?: boolean } = {
      search: this.searchTerm.trim(),
      pageSize: 200
    };
    if (this.activeFilter !== null) params.isActive = this.activeFilter;

    this.roleService.getAll(params).subscribe({
      next: (res) => {
        const raw = this.extractItems(res);
        this.roles = raw.map((x: any) => ({
          roleId: Number(x.roleId ?? x.id ?? 0),
          roleName: x.roleName ?? x.name ?? '',
          description: x.description ?? '',
          isActive: x.isActive !== false
        }));
        this.totalRecords = res?.totalCount ?? this.roles.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load roles.' });
      }
    });
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
    this.loadRoles();
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(role: AppRole): void {
    this.dialogMode = 'edit';
    this.formData = { ...role };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedRole) this.openEditDialog(this.selectedRole);
  }

  openPermissions(role: AppRole): void {
    this.permRole = role;
    this.permDialogVisible = true;
    this.permLoading = true;
    this.roleService.getMenus(role.roleId).subscribe({
      next: (list) => {
        this.menuPermissions = (list ?? []).map(m => ({ ...m }));
        this.permLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.permLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load menu permissions.' });
      }
    });
  }

  onPermissionsSelected(): void {
    if (this.selectedRole) this.openPermissions(this.selectedRole);
  }

  savePermissions(): void {
    if (!this.permRole) return;
    this.permSaving = true;
    const dto: SetRoleMenusDto = {
      menus: this.menuPermissions
        .filter(m => m.canView || m.canAdd || m.canEdit || m.canDelete)
        .map(m => ({
          menuId: m.menuId,
          canView: m.canView,
          canAdd: m.canAdd,
          canEdit: m.canEdit,
          canDelete: m.canDelete
        })),
      modifiedBy: null
    };
    this.roleService.setMenus(this.permRole.roleId, dto).subscribe({
      next: () => {
        this.permSaving = false;
        this.permDialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Menu permissions updated.' });
      },
      error: () => {
        this.permSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save permissions.' });
      }
    });
  }

  validate(): boolean {
    this.formErrors = {};
    if (!this.formData.roleName.trim()) this.formErrors.roleName = 'Role name is required';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;

    if (this.dialogMode === 'add') {
      const dto: CreateRoleDto = {
        roleName: this.formData.roleName.trim(),
        description: this.formData.description?.trim() || null,
        isActive: this.formData.isActive,
        createdBy: null
      };
      this.roleService.create(dto).subscribe({
        next: (res) => {
          const created = res?.data ?? res;
          this.roles = [...this.roles, {
            roleId: Number(created.roleId ?? created.id ?? 0),
            roleName: created.roleName ?? created.name ?? '',
            description: created.description ?? '',
            isActive: created.isActive !== false
          }];
          this.dialogVisible = false;
          this.isSaving = false;
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Role created.' });
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: err?.error ?? 'Could not create role.' });
        }
      });
    } else {
      const dto: UpdateRoleDto = {
        roleId: this.formData.roleId,
        roleName: this.formData.roleName.trim(),
        description: this.formData.description?.trim() || null,
        isActive: this.formData.isActive,
        modifiedBy: null
      };
      this.roleService.update(this.formData.roleId, dto).subscribe({
        next: (res) => {
          const updated = res?.data ?? res;
          const idx = this.roles.findIndex(r => r.roleId === updated.roleId);
          const row: AppRole = {
            roleId: Number(updated.roleId ?? updated.id ?? 0),
            roleName: updated.roleName ?? updated.name ?? '',
            description: updated.description ?? '',
            isActive: updated.isActive !== false
          };
          if (idx !== -1) this.roles = [...this.roles.slice(0, idx), row, ...this.roles.slice(idx + 1)];
          this.dialogVisible = false;
          this.isSaving = false;
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Role updated.' });
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: err?.error ?? 'Could not update role.' });
        }
      });
    }
  }

  confirmDelete(role: AppRole, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Delete role <strong>${role.roleName}</strong>?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.roleService.delete(role.roleId).subscribe({
        next: () => {
          this.roles = this.roles.filter(r => r.roleId !== role.roleId);
          if (this.selectedRole?.roleId === role.roleId) this.selectedRole = null;
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Role deleted.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete role.' })
      })
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedRole) this.confirmDelete(this.selectedRole, event);
  }
}
