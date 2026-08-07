import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, concatMap, from, of, toArray } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { apiAssetUrl } from '../../../core/api-config';
import { CmsFileUploadComponent } from '../../../shared/cms-file-upload/cms-file-upload.component';
import { CmsApiService } from '../../../services/cms/cms-api.service';
import {
  AlbumForm,
  CmsGalleryService,
  GalleryAlbum,
  GalleryImage,
  ImageForm,
  defaultAlbumForm,
  defaultImageForm
} from '../../../services/cms/cms-gallery.service';

@Component({
  selector: 'app-cms-gallery',
  imports: [AppModule, CmsFileUploadComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class CmsGalleryComponent implements OnInit {
  items: GalleryAlbum[] = [];
  filtered: GalleryAlbum[] = [];
  selected: GalleryAlbum | null = null;
  isLoading = false;
  searchTerm = '';

  dialogVisible = false;
  editItem: GalleryAlbum | null = null;
  form: AlbumForm = defaultAlbumForm();
  formErrors: { title?: string } = {};
  isSaving = false;

  imagesDialogVisible = false;
  selectedAlbum: GalleryAlbum | null = null;
  images: GalleryImage[] = [];
  imageForm: ImageForm = defaultImageForm();
  imageErrors: { imageUrl?: string } = {};
  isAddingImage = false;
  isLoadingImages = false;
  isUploadingMany = false;

  @ViewChild('multiFileInput') multiFileInput?: ElementRef<HTMLInputElement>;

  constructor(
    private service: CmsGalleryService,
    private cmsApi: CmsApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get dialogTitle(): string {
    return this.editItem ? 'Edit Album' : 'Add Album';
  }

  imagePreview(path: string | undefined | null): string | null {
    return apiAssetUrl(path);
  }

  load(): void {
    this.isLoading = true;
    this.service.getAlbums().subscribe({
      next: data => {
        this.items = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load gallery albums.'
        });
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
      : this.items.filter(
          i =>
            i.title.toLowerCase().includes(term) ||
            (i.category || '').toLowerCase().includes(term)
        );
  }

  openAdd(): void {
    this.editItem = null;
    this.form = defaultAlbumForm();
    this.formErrors = {};
    this.dialogVisible = true;
  }

  openEdit(item: GalleryAlbum): void {
    this.editItem = item;
    this.form = {
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      eventDate: (item.eventDate || '').substring(0, 10)
    };
    this.formErrors = {};
    this.dialogVisible = true;
  }

  onEditSelected(): void {
    if (this.selected) this.openEdit(this.selected);
  }

  onSave(): void {
    if (!this.form.title?.trim()) {
      this.formErrors = { title: 'Title is required' };
      return;
    }
    this.formErrors = {};
    this.isSaving = true;
    const op = this.editItem
      ? this.service.updateAlbum(this.editItem.id, this.form)
      : this.service.createAlbum(this.form);
    op.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogVisible = false;
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Album saved.' });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not save album.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  confirmDelete(item: GalleryAlbum, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete album "<strong>${item.title}</strong>"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => {
        this.service.deleteAlbum(item.id).subscribe({
          next: () => {
            if (this.selected?.id === item.id) this.selected = null;
            this.load();
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Album deleted.'
            });
          },
          error: () =>
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: 'Could not delete album.'
            })
        });
      }
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selected) this.confirmDelete(this.selected, event);
  }

  manageImages(album: GalleryAlbum, event?: Event): void {
    event?.stopPropagation();
    this.selectedAlbum = album;
    this.imageForm = defaultImageForm();
    this.imageForm.sortOrder = album.imageCount ?? 0;
    this.imageErrors = {};
    this.imagesDialogVisible = true;
    this.loadImages(album.id);
  }

  private loadImages(albumId: number): void {
    this.isLoadingImages = true;
    this.service.getAlbumDetail(albumId).subscribe({
      next: detail => {
        this.images = Array.isArray(detail?.images) ? detail.images : [];
        this.isLoadingImages = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.images = [];
        this.isLoadingImages = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load album images.'
        });
        this.cdr.detectChanges();
      }
    });
  }

  addImage(): void {
    if (!this.selectedAlbum) return;
    if (!this.imageForm.imageUrl?.trim()) {
      this.imageErrors = { imageUrl: 'Image is required' };
      return;
    }
    this.imageErrors = {};
    this.isAddingImage = true;
    const title =
      this.imageForm.title?.trim() ||
      `Image ${(this.images.length || 0) + 1}`;
    this.service
      .addImage(this.selectedAlbum.id, {
        ...this.imageForm,
        title
      })
      .subscribe({
        next: () => {
          this.isAddingImage = false;
          this.imageForm = defaultImageForm();
          this.imageForm.sortOrder = this.images.length + 1;
          this.loadImages(this.selectedAlbum!.id);
          this.load();
          this.messageService.add({
            severity: 'success',
            summary: 'Added',
            detail: 'Image added to album.'
          });
        },
        error: () => {
          this.isAddingImage = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Add Failed',
            detail: 'Could not add image.'
          });
          this.cdr.detectChanges();
        }
      });
  }

  triggerMultiUpload(): void {
    this.multiFileInput?.nativeElement.click();
  }

  onMultiFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter(f => f.type.startsWith('image/'));
    input.value = '';
    if (!this.selectedAlbum || files.length === 0) return;

    this.isUploadingMany = true;
    let sortOrder = this.images.length;

    from(files)
      .pipe(
        concatMap(file =>
          this.cmsApi.upload('gallery', file).pipe(
            concatMap(path => {
              sortOrder += 1;
              return this.service.addImage(this.selectedAlbum!.id, {
                title: file.name.replace(/\.[^.]+$/, ''),
                imageUrl: path,
                caption: '',
                sortOrder
              });
            }),
            catchError(() => of(null))
          )
        ),
        toArray()
      )
      .subscribe({
        next: results => {
          this.isUploadingMany = false;
          const ok = results.filter(Boolean).length;
          this.loadImages(this.selectedAlbum!.id);
          this.load();
          this.messageService.add({
            severity: ok ? 'success' : 'warn',
            summary: 'Upload complete',
            detail: `${ok} of ${files.length} image(s) added.`
          });
          this.cdr.detectChanges();
        },
        error: () => {
          this.isUploadingMany = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: 'Could not upload images.'
          });
          this.cdr.detectChanges();
        }
      });
  }

  deleteImage(img: GalleryImage, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete image "<strong>${img.title}</strong>"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => {
        this.service.deleteImage(img.id).subscribe({
          next: () => {
            if (this.selectedAlbum) this.loadImages(this.selectedAlbum.id);
            this.load();
            this.messageService.add({
              severity: 'success',
              summary: 'Deleted',
              detail: 'Image deleted.'
            });
          },
          error: () =>
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: 'Could not delete image.'
            })
        });
      }
    });
  }
}
