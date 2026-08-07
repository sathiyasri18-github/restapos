import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsSiteMenuService,
  SiteMenuForm,
  SiteMenuItem,
  defaultSiteMenuForm
} from '../../../services/cms/cms-site-menu.service';

@Component({
  selector: 'app-cms-site-menu',
  imports: [AppModule],
  templateUrl: './site-menu.component.html',
  styleUrls: ['./site-menu.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsSiteMenuComponent implements OnInit {
  items: SiteMenuItem[] = [];
  flatItems: SiteMenuItem[] = [];
  filtered: SiteMenuItem[] = [];
  selected: SiteMenuItem | null = null;
  isLoading = false;
  searchTerm = '';
  parentOptions: { label: string; value: number | null }[] = [];

  dialogVisible = false;
  editItem: SiteMenuItem | null = null;
  form: SiteMenuForm = defaultSiteMenuForm();
  formErrors: { title?: string } = {};
  isSaving = false;

  constructor(
    private service: CmsSiteMenuService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }
  get dialogTitle(): string { return this.editItem ? 'Edit Menu Item' : 'Add Menu Item'; }

  load(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: data => {
        this.items = Array.isArray(data) ? data : [];
        this.flatItems = this.flatten(this.items);
        this.parentOptions = [
          { label: '(Top level)', value: null },
          ...this.flatItems.map(i => ({ label: i.title, value: i.id as number | null }))
        ];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load site menu.' });
      }
    });
  }

  private flatten(nodes: SiteMenuItem[], acc: SiteMenuItem[] = []): SiteMenuItem[] {
    for (const n of nodes) {
      acc.push(n);
      if (n.children?.length) this.flatten(n.children, acc);
    }
    return acc;
  }

  onSearchChange(): void { this.applyFilter(); }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = !term
      ? [...this.flatItems]
      : this.flatItems.filter(i =>
          i.title.toLowerCase().includes(term) ||
          (i.url || '').toLowerCase().includes(term)
        );
  }

  openAdd(): void {
    this.editItem = null;
    this.form = defaultSiteMenuForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: SiteMenuItem): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      url: item.url || '',
      parentId: item.parentId ?? null,
      sortOrder: item.sortOrder,
      openInNewTab: item.openInNewTab
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void { if (this.selected) this.openEdit(this.selected); }

  onSave(): void {
    if (!this.form.title?.trim()) {
      this.formErrors = { title: 'Title is required' };
      return;
    }
    this.formErrors = {};
    this.isSaving = true;
    const op = this.editItem
      ? this.service.update(this.editItem.id, this.form)
      : this.service.create(this.form);
    op.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogVisible = false;
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Menu item saved.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save menu item.' });
      }
    });
  }

  confirmDelete(item: SiteMenuItem, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${item.title}</strong>"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => {
        this.service.delete(item.id).subscribe({
          next: () => {
            if (this.selected?.id === item.id) this.selected = null;
            this.load();
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Menu item deleted.' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete.' })
        });
      }
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selected) this.confirmDelete(this.selected, event);
  }

  parentLabel(parentId?: number | null): string {
    if (parentId == null) return '—';
    return this.flatItems.find(i => i.id === parentId)?.title ?? String(parentId);
  }
}
