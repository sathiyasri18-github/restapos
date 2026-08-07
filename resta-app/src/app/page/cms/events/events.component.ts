import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsEventService,
  EventForm,
  EventItem,
  defaultEventForm
} from '../../../services/cms/cms-event.service';

@Component({
  selector: 'app-cms-events',
  imports: [AppModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsEventsComponent implements OnInit {
  items: EventItem[] = [];
  filtered: EventItem[] = [];
  selected: EventItem | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  editItem: EventItem | null = null;
  form: EventForm = defaultEventForm();
  formErrors: { title?: string; startDate?: string } = {};
  isSaving = false;

  constructor(
    private service: CmsEventService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }
  get dialogTitle(): string { return this.editItem ? 'Edit Event' : 'Add Event'; }

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
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load events.' });
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
          (i.location || '').toLowerCase().includes(term)
        );
  }

  openAdd(): void {
    this.editItem = null;
    this.form = defaultEventForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: EventItem): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      description: item.description || '',
      location: item.location || '',
      startDate: (item.startDate || '').substring(0, 10),
      endDate: (item.endDate || '').substring(0, 10),
      imageUrl: item.imageUrl || '',
      isPublished: item.isPublished
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void { if (this.selected) this.openEdit(this.selected); }

  onSave(): void {
    this.formErrors = {};
    if (!this.form.title?.trim()) this.formErrors.title = 'Title is required';
    if (!this.form.startDate) this.formErrors.startDate = 'Start date is required';
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
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Event saved successfully.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save event.' });
      }
    });
  }

  confirmDelete(item: EventItem, event: Event): void {
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
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Event deleted.' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete event.' })
        });
      }
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selected) this.confirmDelete(this.selected, event);
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return value.substring(0, 10);
  }
}
