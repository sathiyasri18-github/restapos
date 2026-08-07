import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsContactService,
  ContactInquiry
} from '../../../services/cms/cms-contact.service';

@Component({
  selector: 'app-cms-contact',
  imports: [AppModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsContactComponent implements OnInit {
  items: ContactInquiry[] = [];
  filtered: ContactInquiry[] = [];
  selected: ContactInquiry | null = null;
  isLoading = false;
  searchTerm = '';
  unreadOnly = false;

  detailVisible = false;
  detailItem: ContactInquiry | null = null;

  constructor(
    private service: CmsContactService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

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
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load inquiries.' });
      }
    });
  }

  onSearchChange(): void { this.applyFilter(); }
  onFilterChange(): void { this.applyFilter(); }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = this.items.filter(i => {
      const matchesUnread = !this.unreadOnly || !i.isRead;
      const matchesSearch = !term ||
        i.name.toLowerCase().includes(term) ||
        i.email.toLowerCase().includes(term) ||
        (i.subject || '').toLowerCase().includes(term);
      return matchesUnread && matchesSearch;
    });
  }

  openDetail(item: ContactInquiry): void {
    this.detailItem = item;
    this.detailVisible = true;
    if (!item.isRead) {
      this.service.markAsRead(item.id).subscribe({
        next: () => {
          item.isRead = true;
          this.applyFilter();
          this.cdr.detectChanges();
        }
      });
    }
  }

  markRead(item: ContactInquiry, event: Event): void {
    event.stopPropagation();
    if (item.isRead) return;
    this.service.markAsRead(item.id).subscribe({
      next: () => {
        item.isRead = true;
        this.applyFilter();
        this.messageService.add({ severity: 'success', summary: 'Marked Read', detail: 'Inquiry marked as read.' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Could not mark as read.' })
    });
  }

  confirmDelete(item: ContactInquiry, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete inquiry from "<strong>${item.name}</strong>"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => {
        this.service.delete(item.id).subscribe({
          next: () => {
            if (this.selected?.id === item.id) this.selected = null;
            if (this.detailItem?.id === item.id) {
              this.detailVisible = false;
              this.detailItem = null;
            }
            this.load();
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Inquiry deleted.' });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete.' })
        });
      }
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selected) this.confirmDelete(this.selected, event);
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    return value.replace('T', ' ').substring(0, 16);
  }
}
