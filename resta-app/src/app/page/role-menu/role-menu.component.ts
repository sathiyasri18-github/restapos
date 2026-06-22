import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { MenuService } from '../../services/menu.service';
import { RoleService } from '../../services/role.service';
import {
  CreateRoleMenuDto,
  RoleMenuEntry,
  RoleMenuService,
  UpdateRoleMenuDto
} from '../../services/role-menu.service';

interface SelectOption { label: string; value: number; }

@Component({
  selector: 'app-role-menu',
  imports: [AppModule],
  templateUrl: './role-menu.component.html',
  styleUrls: ['./role-menu.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class RoleMenuComponent implements OnInit {
  entries: RoleMenuEntry[] = [];
  filtered: RoleMenuEntry[] = [];
  selected: RoleMenuEntry | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  dialogMode: 'add' | 'edit' = 'add';
  isSaving = false;
  roleOptions: SelectOption[] = [];
  menuOptions: SelectOption[] = [];
  formData: RoleMenuEntry = this.emptyForm();

  constructor(
    private roleMenuService: RoleMenuService,
    private roleService: RoleService,
    private menuService: MenuService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadEntries();
  }

  private emptyForm(): RoleMenuEntry {
    return {
      id: 0, roleId: 0, roleName: '', menuId: 0, menuCode: '', menuName: '',
      canView: true, canAdd: false, canEdit: false, canDelete: false
    };
  }

  loadLookups(): void {
    forkJoin({
      roles: this.roleService.getAll({ pageSize: 500, isActive: true }),
      menus: this.menuService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ roles, menus }) => {
        this.roleOptions = this.extractItems(roles).map((x: any) => ({
          label: x.roleName ?? x.name ?? '',
          value: Number(x.roleId ?? x.id ?? 0)
        })).filter(o => o.value > 0);
        this.menuOptions = this.extractItems(menus).map((x: any) => ({
          label: `${x.menuName ?? x.name} (${x.menuCode ?? ''})`,
          value: Number(x.id ?? x.menuId ?? 0)
        })).filter(o => o.value > 0);
        this.cdr.detectChanges();
      }
    });
  }

  loadEntries(): void {
    this.isLoading = true;
    this.roleMenuService.getAll({ pageSize: 500 }).subscribe({
      next: (res) => {
        this.entries = this.extractItems(res).map((x: any) => ({
          id: Number(x.id ?? 0),
          roleId: Number(x.roleId ?? 0),
          roleName: x.roleName ?? '',
          menuId: Number(x.menuId ?? 0),
          menuCode: x.menuCode ?? '',
          menuName: x.menuName ?? '',
          canView: !!x.canView,
          canAdd: !!x.canAdd,
          canEdit: !!x.canEdit,
          canDelete: !!x.canDelete
        }));
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load role menus.' });
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.entries.filter(e =>
      !term || e.roleName.toLowerCase().includes(term) || e.menuName.toLowerCase().includes(term));
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = this.emptyForm();
    this.dialogVisible = true;
  }

  openEditDialog(entry: RoleMenuEntry): void {
    this.dialogMode = 'edit';
    this.formData = { ...entry };
    this.dialogVisible = true;
  }

  onSave(): void {
    if (!this.formData.roleId || !this.formData.menuId) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Role and menu are required.' });
      return;
    }
    this.isSaving = true;
    if (this.dialogMode === 'add') {
      const dto: CreateRoleMenuDto = {
        roleId: this.formData.roleId,
        menuId: this.formData.menuId,
        canView: this.formData.canView,
        canAdd: this.formData.canAdd,
        canEdit: this.formData.canEdit,
        canDelete: this.formData.canDelete,
        createdBy: null
      };
      this.roleMenuService.create(dto).subscribe({
        next: () => { this.finishSave('Role menu created.'); },
        error: () => this.failSave()
      });
    } else {
      const dto: UpdateRoleMenuDto = {
        id: this.formData.id,
        roleId: this.formData.roleId,
        menuId: this.formData.menuId,
        canView: this.formData.canView,
        canAdd: this.formData.canAdd,
        canEdit: this.formData.canEdit,
        canDelete: this.formData.canDelete,
        modifiedBy: null
      };
      this.roleMenuService.update(this.formData.id, dto).subscribe({
        next: () => { this.finishSave('Role menu updated.'); },
        error: () => this.failSave()
      });
    }
  }

  private finishSave(detail: string): void {
    this.dialogVisible = false;
    this.isSaving = false;
    this.loadEntries();
    this.messageService.add({ severity: 'success', summary: 'Saved', detail });
  }

  private failSave(): void {
    this.isSaving = false;
    this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save role menu.' });
  }

  confirmDelete(entry: RoleMenuEntry, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Delete menu permission for <strong>${entry.roleName}</strong> / <strong>${entry.menuName}</strong>?`,
      header: 'Confirm Delete',
      accept: () => this.roleMenuService.delete(entry.id).subscribe({
        next: () => {
          this.entries = this.entries.filter(e => e.id !== entry.id);
          this.applyFilter();
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Role menu deleted.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete role menu.' })
      })
    });
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  }
}
