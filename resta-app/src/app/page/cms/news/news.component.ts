import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsNewsService,
  NewsCategories,
  NewsForm,
  NewsItem,
  defaultNewsForm
} from '../../../services/cms/cms-news.service';

@Component({
  selector: 'app-cms-news',
  imports: [AppModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsNewsComponent implements OnInit {
  readonly categories = NewsCategories;
  items: NewsItem[] = [];
  filtered: NewsItem[] = [];
  selected: NewsItem | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  editItem: NewsItem | null = null;
  form: NewsForm = defaultNewsForm();
  formErrors: { title?: string } = {};
  isSaving = false;

  constructor(
    private service: CmsNewsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  get dialogTitle(): string { return this.editItem ? 'Edit News' : 'Add News'; }

  categoryLabel(value: number): string {
    return this.categories.find(c => c.value === value)?.label ?? String(value);
  }

  load(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: data => {
        const raw: any = data;
        this.items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load news.' });
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
          (i.summary || '').toLowerCase().includes(term) ||
          (i.author || '').toLowerCase().includes(term)
        );
  }

  openAdd(): void {
    this.editItem = null;
    this.form = defaultNewsForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: NewsItem): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      summary: item.summary || '',
      content: item.content || '',
      imageUrl: item.imageUrl || '',
      category: item.category,
      isPublished: item.isPublished,
      author: item.author || ''
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
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'News saved successfully.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save news.' });
      }
    });
  }

  confirmDelete(item: NewsItem, event: Event): void {
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
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'News deleted.' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete news.' })
        });
      }
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selected) this.confirmDelete(this.selected, event);
  }
}
