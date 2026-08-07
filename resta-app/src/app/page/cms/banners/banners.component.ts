import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';
import {
  BannerForm,
  BannerSlide,
  CmsBannerService,
  defaultBannerForm
} from '../../../services/cms/cms-banner.service';
import { CmsApiService } from '../../../services/cms/cms-api.service';
import { apiAssetUrl } from '../../../core/api-config';

@Component({
  selector: 'app-cms-banners',
  imports: [AppModule],
  templateUrl: './banners.component.html',
  styleUrls: ['./banners.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsBannersComponent implements OnInit {
  items: BannerSlide[] = [];
  filtered: BannerSlide[] = [];
  selected: BannerSlide | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  editItem: BannerSlide | null = null;
  form: BannerForm = defaultBannerForm();
  formErrors: { title?: string; subtitle?: string; imageUrl?: string } = {};
  isSaving = false;
  isUploading = false;

  @ViewChild('bannerFileInput') bannerFileInput?: ElementRef<HTMLInputElement>;

  constructor(
    private service: CmsBannerService,
    private cmsApi: CmsApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get dialogTitle(): string {
    return this.editItem ? 'Edit Banner' : 'Add Banner';
  }

  imagePreview(path: string | undefined): string | null {
    return apiAssetUrl(path);
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
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load banners.' });
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filtered = !term
      ? [...this.items]
      : this.items.filter(i =>
          i.title.toLowerCase().includes(term) ||
          (i.subtitle || '').toLowerCase().includes(term)
        );
  }

  openAdd(): void {
    this.editItem = null;
    this.form = defaultBannerForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: BannerSlide): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      subtitle: item.subtitle || '',
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl || '',
      sortOrder: item.sortOrder
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selected) this.openEdit(this.selected);
  }

  triggerBannerUpload(): void {
    this.bannerFileInput?.nativeElement?.click();
  }

  onBannerFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading = true;
    this.cmsApi.upload('banners', file).subscribe({
      next: path => {
        this.form.imageUrl = path;
        delete this.formErrors.imageUrl;
        this.isUploading = false;
        input.value = '';
        this.messageService.add({
          severity: 'success',
          summary: 'Uploaded',
          detail: 'Banner image uploaded successfully.'
        });
        this.cdr.detectChanges();
      },
      error: err => {
        this.isUploading = false;
        input.value = '';
        const detail =
          err?.error?.message ||
          err?.error?.Message ||
          err?.message ||
          'Upload failed. Sign in again if your session expired.';
        this.messageService.add({ severity: 'error', summary: 'Upload failed', detail });
        this.cdr.detectChanges();
      }
    });
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.form.title?.trim()) this.formErrors.title = 'Title is required';
    if (!this.form.subtitle?.trim()) this.formErrors.subtitle = 'Subtitle is required';
    if (!this.form.imageUrl?.trim()) this.formErrors.imageUrl = 'Banner image is required';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    const op = this.editItem
      ? this.service.update(this.editItem.id, this.form)
      : this.service.create(this.form);
    op.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogVisible = false;
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Banner saved successfully.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not save banner.' });
        this.cdr.detectChanges();
      }
    });
  }

  confirmDelete(item: BannerSlide, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${item.title}</strong>"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(item)
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selected) this.confirmDelete(this.selected, event);
  }

  private executeDelete(item: BannerSlide): void {
    this.service.delete(item.id).subscribe({
      next: () => {
        if (this.selected?.id === item.id) this.selected = null;
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `"${item.title}" was deleted.` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete banner.' });
      }
    });
  }
}
