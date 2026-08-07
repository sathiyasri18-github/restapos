import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { apiAssetUrl } from '../../core/api-config';
import { CmsApiService } from '../../services/cms/cms-api.service';

@Component({
  selector: 'app-cms-file-upload',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule],
  templateUrl: './cms-file-upload.component.html',
  styleUrls: ['./cms-file-upload.component.scss']
})
export class CmsFileUploadComponent {
  @Input() folder = 'banners';
  @Input() url = '';
  @Input() label = 'Image';
  @Input() accept = 'image/*';
  @Input() required = false;
  @Output() urlChange = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  uploading = false;

  private readonly api = inject(CmsApiService);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  get previewUrl(): string {
    return apiAssetUrl(this.url) ?? '';
  }

  triggerFilePicker(): void {
    this.fileInput?.nativeElement?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.cdr.detectChanges();

    this.api.upload(this.folder, file).subscribe({
      next: path => {
        this.url = path;
        this.urlChange.emit(path);
        this.uploading = false;
        input.value = '';
        this.messages.add({
          severity: 'success',
          summary: 'Uploaded',
          detail: 'Image uploaded successfully.'
        });
        this.cdr.detectChanges();
      },
      error: err => {
        this.uploading = false;
        input.value = '';
        const detail =
          err?.error?.message ||
          err?.error?.Message ||
          err?.message ||
          'Upload failed. Check you are signed in and the API is running.';
        this.messages.add({ severity: 'error', summary: 'Upload failed', detail });
        this.cdr.detectChanges();
      }
    });
  }

  onUrlInput(value: string): void {
    this.url = value;
    this.urlChange.emit(value);
  }
}
