import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent, formatYesNo } from '../../common/grid-report';
import {
  AppMenu,
  CreateMenuDto,
  MenuService,
  UpdateMenuDto
} from '../../services/menu.service';

type DialogMode = 'add' | 'edit';

interface ParentOption {
  label: string;
  value: number | null;
}

interface FormErrors {
  menuCode?: string;
  menuName?: string;
}

function emptyForm(): AppMenu {
  return {
    id: 0,
    parentMenuId: null,
    menuCode: '',
    menuName: '',
    routePath: '',
    icon: '',
    sortOrder: 0,
    isActive: true
  };
}

@Component({
  selector: 'app-menu',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class MenuComponent implements OnInit, OnDestroy {
  menus: AppMenu[] = [];
  displayedMenus: AppMenu[] = [];
  selectedMenu: AppMenu | null = null;
  isLoading = false;
  totalRecords = 0;
  searchTerm = '';
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;
  parentOptions: ParentOption[] = [{ label: '(Top level)', value: null }];

  constructor(
    private menuService: MenuService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.applyMenuFilter());
    this.loadMenus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Menu' : 'Edit Menu';
  }

  get hasActiveSearch(): boolean {
    return !!this.searchTerm.trim();
  }

  get menuReportConfig(): GridReportConfig {
    return {
      title: 'Menus',
      subtitle: this.hasActiveSearch ? `Search: ${this.searchTerm}` : undefined,
      fileName: 'menus',
      orientation: 'landscape',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Code', field: 'menuCode' },
        { header: 'Name', field: 'menuName' },
        { header: 'Parent', field: 'parentMenuName' },
        { header: 'Route', field: 'routePath' },
        { header: 'Icon', field: 'icon' },
        { header: 'Sort', field: 'sortOrder', align: 'right' },
        { header: 'Active', field: 'isActive', format: (v) => formatYesNo(v) }
      ],
      rows: this.displayedMenus.map(m => ({
        menuCode: m.menuCode,
        menuName: m.menuName,
        parentMenuName: m.parentMenuName ?? '—',
        routePath: m.routePath,
        icon: m.icon ?? '—',
        sortOrder: m.sortOrder,
        isActive: m.isActive
      }))
    };
  }

  loadMenus(): void {
    this.isLoading = true;
    this.menuService.getAll({ pageSize: 500 }).subscribe({
      next: (res) => {
        const raw = this.extractItems(res);
        this.menus = raw.map((x: any) => ({
          id: Number(x.id ?? x.menuId ?? 0),
          parentMenuId: x.parentMenuId != null ? Number(x.parentMenuId) : null,
          menuCode: x.menuCode ?? '',
          menuName: x.menuName ?? '',
          routePath: x.routePath ?? '',
          icon: x.icon ?? '',
          sortOrder: Number(x.sortOrder ?? 0),
          isActive: x.isActive !== false,
          parentMenuName: x.parentMenuName ?? null
        }));
        this.totalRecords = res?.totalCount ?? this.menus.length;
        this.parentOptions = [
          { label: '(Top level)', value: null },
          ...this.menus.map(m => ({ label: `${m.menuName} (${m.menuCode})`, value: m.id }))
        ];
        this.applyMenuFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load menus.' });
      }
    });
  }

  private extractItems(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  }

  applyMenuFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.displayedMenus = this.menus.filter(m =>
      !term
      || m.menuCode.toLowerCase().includes(term)
      || m.menuName.toLowerCase().includes(term)
      || (m.routePath ?? '').toLowerCase().includes(term));
  }

  onSearchChange(): void { this.search$.next(); }
  onClearSearch(): void { this.searchTerm = ''; this.applyMenuFilter(); }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEditDialog(menu: AppMenu): void {
    this.dialogMode = 'edit';
    this.formData = { ...menu };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selectedMenu) this.openEditDialog(this.selectedMenu);
  }

  validate(): boolean {
    this.formErrors = {};
    if (!this.formData.menuCode.trim()) this.formErrors.menuCode = 'Menu code is required';
    if (!this.formData.menuName.trim()) this.formErrors.menuName = 'Menu name is required';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;

    if (this.dialogMode === 'add') {
      const dto: CreateMenuDto = {
        parentMenuId: this.formData.parentMenuId,
        menuCode: this.formData.menuCode.trim(),
        menuName: this.formData.menuName.trim(),
        routePath: this.formData.routePath?.trim() || null,
        icon: this.formData.icon?.trim() || null,
        sortOrder: this.formData.sortOrder ?? 0,
        isActive: this.formData.isActive,
        createdBy: null
      };
      this.menuService.create(dto).subscribe({
        next: () => {
          this.dialogVisible = false;
          this.isSaving = false;
          this.loadMenus();
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Menu created.' });
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: err?.error ?? 'Could not create menu.' });
        }
      });
    } else {
      const dto: UpdateMenuDto = {
        id: this.formData.id,
        parentMenuId: this.formData.parentMenuId,
        menuCode: this.formData.menuCode.trim(),
        menuName: this.formData.menuName.trim(),
        routePath: this.formData.routePath?.trim() || null,
        icon: this.formData.icon?.trim() || null,
        sortOrder: this.formData.sortOrder ?? 0,
        isActive: this.formData.isActive,
        modifiedBy: null
      };
      this.menuService.update(this.formData.id, dto).subscribe({
        next: () => {
          this.dialogVisible = false;
          this.isSaving = false;
          this.loadMenus();
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Menu updated.' });
        },
        error: (err) => {
          this.isSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: err?.error ?? 'Could not update menu.' });
        }
      });
    }
  }

  confirmDelete(menu: AppMenu, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Delete menu <strong>${menu.menuName}</strong>?`,
      header: 'Confirm Delete',
      accept: () => this.menuService.delete(menu.id).subscribe({
        next: () => {
          this.menus = this.menus.filter(m => m.id !== menu.id);
          if (this.selectedMenu?.id === menu.id) this.selectedMenu = null;
          this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Menu deleted.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete menu.' })
      })
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedMenu) this.confirmDelete(this.selectedMenu, event);
  }
}
