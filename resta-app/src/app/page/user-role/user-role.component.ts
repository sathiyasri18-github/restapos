import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportToolbarComponent } from '../../common/grid-report';
import { RoleService } from '../../services/role.service';
import { UserService } from '../../services/user.service';
import { AssignUserRolesDto, UserRoleEntry, UserRoleService } from '../../services/user-role.service';

interface SelectOption { label: string; value: number; }

@Component({
  selector: 'app-user-role',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './user-role.component.html',
  styleUrls: ['./user-role.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class UserRoleComponent implements OnInit {
  entries: UserRoleEntry[] = [];
  filtered: UserRoleEntry[] = [];
  selected: UserRoleEntry | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  isSaving = false;
  userOptions: SelectOption[] = [];
  roleOptions: SelectOption[] = [];
  selectedUserId = 0;
  selectedRoleIds: number[] = [];

  constructor(
    private userRoleService: UserRoleService,
    private userService: UserService,
    private roleService: RoleService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadEntries();
  }

  loadLookups(): void {
    forkJoin({
      users: this.userService.getAll({ pageSize: 500 }),
      roles: this.roleService.getAll({ pageSize: 500, isActive: true }),
    }).subscribe({
      next: ({ users, roles }) => {
        this.userOptions = this.extractItems(users).map((x: any) => ({
          label: `${x.displayName ?? x.companyName ?? x.userName ?? x.name} (${x.userName ?? x.name ?? ''})`,
          value: Number(x.userId ?? x.id ?? 0)
        })).filter(o => o.value > 0);
        this.roleOptions = this.extractItems(roles).map((x: any) => ({
          label: x.roleName ?? x.name ?? '',
          value: Number(x.roleId ?? x.id ?? 0)
        })).filter(o => o.value > 0);
        this.cdr.detectChanges();
      }
    });
  }

  loadEntries(): void {
    this.isLoading = true;
    this.userRoleService.getAll({ pageSize: 500 }).subscribe({
      next: (res) => {
        this.entries = this.extractItems(res).map((x: any) => ({
          userId: Number(x.userId ?? 0),
          userName: x.userName ?? '',
          displayName: x.displayName ?? '',
          roleId: Number(x.roleId ?? 0),
          roleName: x.roleName ?? '',
          rowKey: `${x.userId ?? 0}-${x.roleId ?? 0}`
        }));
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load user roles.' });
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.entries.filter(e =>
      !term
      || e.userName.toLowerCase().includes(term)
      || e.displayName.toLowerCase().includes(term)
      || e.roleName.toLowerCase().includes(term));
  }

  openAssignDialog(): void {
    this.selectedUserId = 0;
    this.selectedRoleIds = [];
    this.dialogVisible = true;
  }

  openEditDialog(entry: UserRoleEntry): void {
    this.selectedUserId = entry.userId;
    this.userRoleService.getByUser(entry.userId).subscribe({
      next: (res) => {
        this.selectedRoleIds = res?.roleIds ?? [entry.roleId];
        this.dialogVisible = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.selectedRoleIds = [entry.roleId];
        this.dialogVisible = true;
      }
    });
  }

  onSave(): void {
    if (!this.selectedUserId) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Select a user.' });
      return;
    }
    this.isSaving = true;
    const dto: AssignUserRolesDto = {
      userId: this.selectedUserId,
      roleIds: this.selectedRoleIds,
      modifiedBy: null
    };
    this.userRoleService.assign(dto).subscribe({
      next: () => {
        this.dialogVisible = false;
        this.isSaving = false;
        this.loadEntries();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'User roles updated.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not assign roles.' });
      }
    });
  }

  confirmDelete(entry: UserRoleEntry, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Remove role <strong>${entry.roleName}</strong> from <strong>${entry.displayName || entry.userName}</strong>?`,
      header: 'Confirm Delete',
      accept: () => this.userRoleService.remove(entry.userId, entry.roleId).subscribe({
        next: () => {
          this.entries = this.entries.filter(e => !(e.userId === entry.userId && e.roleId === entry.roleId));
          this.applyFilter();
          this.messageService.add({ severity: 'success', summary: 'Removed', detail: 'User role removed.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not remove user role.' })
      })
    });
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  }
}
