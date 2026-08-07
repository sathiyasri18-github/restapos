import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsPromotionService,
  Promotion,
  PromotionForm,
  PromotionPositions,
  defaultPromotionForm
} from '../../../services/cms/cms-promotion.service';

@Component({
  selector: 'app-cms-promotions',
  imports: [AppModule],
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsPromotionsComponent implements OnInit {
  readonly positions = PromotionPositions;
  items: Promotion[] = [];
  filtered: Promotion[] = [];
  selected: Promotion | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  editItem: Promotion | null = null;
  form: PromotionForm = defaultPromotionForm();
  formErrors: { title?: string; imageUrl?: string } = {};
  isSaving = false;

  constructor(
    private service: CmsPromotionService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }
  get dialogTitle(): string { return this.editItem ? 'Edit Promotion' : 'Add Promotion'; }

  positionLabel(value: number): string {
    return this.positions.find(p => p.value === value)?.label ?? String(value);
  }

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
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load promotions.' });
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
    this.form = defaultPromotionForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: Promotion): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl || '',
      position: item.position,
      startDate: (item.startDate || '').substring(0, 10),
      endDate: (item.endDate || '').substring(0, 10),
      sortOrder: item.sortOrder
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void { if (this.selected) this.openEdit(this.selected); }

  onSave(): void {
    this.formErrors = {};
    if (!this.form.title?.trim()) this.formErrors.title = 'Title is required';
    if (!this.form.imageUrl?.trim()) this.formErrors.imageUrl = 'Image URL is required';
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
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Promotion saved.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save promotion.' });
      }
    });
  }

  confirmDelete(item: Promotion, event: Event): void {
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
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Promotion deleted.' });
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
