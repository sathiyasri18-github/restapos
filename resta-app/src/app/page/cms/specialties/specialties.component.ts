import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsSpecialtyService,
  SpecialtyForm,
  SpecialtyItem,
  defaultSpecialtyForm
} from '../../../services/cms/cms-specialty.service';

@Component({
  selector: 'app-cms-specialties',
  imports: [AppModule],
  templateUrl: './specialties.component.html',
  styleUrls: ['./specialties.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsSpecialtiesComponent implements OnInit {
  items: SpecialtyItem[] = [];
  filtered: SpecialtyItem[] = [];
  selected: SpecialtyItem | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  editItem: SpecialtyItem | null = null;
  form: SpecialtyForm = defaultSpecialtyForm();
  formErrors: { title?: string } = {};
  isSaving = false;

  constructor(
    private service: CmsSpecialtyService,
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
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load menu items.' });
      }
    });
  }

  onSearchChange(): void { this.applyFilter(); }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = !term ? [...this.items] : this.items.filter(i => i.title.toLowerCase().includes(term));
  }

  openAdd(): void {
    this.editItem = null;
    this.form = defaultSpecialtyForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: SpecialtyItem): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      subtitle: item.subtitle || '',
      slug: item.slug || '',
      content: item.content || '',
      coverImageUrl: item.coverImageUrl || '',
      sortOrder: item.sortOrder,
      isPublished: item.isPublished,
      isFeatured: item.isFeatured
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void { if (this.selected) this.openEdit(this.selected); }

  onTitleChange(): void {
    if (!this.editItem && this.form.title) {
      this.form.slug = this.form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }

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

  confirmDelete(item: SpecialtyItem, event: Event): void {
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
}
