import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsPageService,
  DynamicPage,
  PageForm,
  defaultPageForm
} from '../../../services/cms/cms-page.service';

@Component({
  selector: 'app-cms-pages',
  imports: [AppModule],
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsPagesComponent implements OnInit {
  items: DynamicPage[] = [];
  filtered: DynamicPage[] = [];
  selected: DynamicPage | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  editItem: DynamicPage | null = null;
  form: PageForm = defaultPageForm();
  formErrors: { title?: string; slug?: string } = {};
  isSaving = false;

  constructor(
    private service: CmsPageService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }
  get dialogTitle(): string { return this.editItem ? 'Edit Page' : 'Add Page'; }

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
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load pages.' });
      }
    });
  }

  onSearchChange(): void { this.applyFilter(); }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = !term
      ? [...this.items]
      : this.items.filter(i =>
          i.title.toLowerCase().includes(term) ||
          (i.slug || '').toLowerCase().includes(term)
        );
  }

  openAdd(): void {
    this.editItem = null;
    this.form = defaultPageForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: DynamicPage): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      slug: item.slug,
      content: item.content || '',
      metaDescription: item.metaDescription || '',
      isPublished: item.isPublished
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
    this.formErrors = {};
    if (!this.form.title?.trim()) this.formErrors.title = 'Title is required';
    if (!this.form.slug?.trim()) this.formErrors.slug = 'Slug is required';
    if (Object.keys(this.formErrors).length) return;

    this.isSaving = true;
    const op = this.editItem
      ? this.service.update(this.editItem.id, this.form)
      : this.service.create(this.form);
    op.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogVisible = false;
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Page saved.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save page.' });
      }
    });
  }

  confirmDelete(item: DynamicPage, event: Event): void {
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
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Page deleted.' });
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
