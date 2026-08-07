import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  CmsVideoService,
  VideoForm,
  VideoItem,
  VideoSources,
  defaultVideoForm
} from '../../../services/cms/cms-video.service';

@Component({
  selector: 'app-cms-videos',
  imports: [AppModule],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsVideosComponent implements OnInit {
  readonly sources = VideoSources;
  items: VideoItem[] = [];
  filtered: VideoItem[] = [];
  selected: VideoItem | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  editItem: VideoItem | null = null;
  form: VideoForm = defaultVideoForm();
  formErrors: { title?: string } = {};
  isSaving = false;

  constructor(
    private service: CmsVideoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }
  get dialogTitle(): string { return this.editItem ? 'Edit Video' : 'Add Video'; }

  sourceLabel(value: number): string {
    return this.sources.find(s => s.value === value)?.label ?? String(value);
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
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load videos.' });
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
    this.form = defaultVideoForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: VideoItem): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      description: item.description || '',
      source: item.source,
      videoUrl: item.videoUrl || '',
      youTubeId: item.youTubeId || '',
      thumbnailUrl: item.thumbnailUrl || '',
      category: item.category || '',
      isPublished: item.isPublished
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
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Video saved.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save video.' });
      }
    });
  }

  confirmDelete(item: VideoItem, event: Event): void {
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
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Video deleted.' });
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
