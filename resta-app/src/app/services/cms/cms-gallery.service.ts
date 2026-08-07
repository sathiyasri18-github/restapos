import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface GalleryAlbum {
  id: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  category?: string;
  eventDate?: string;
  imageCount: number;
}

export interface GalleryImage {
  id: number;
  albumId: number;
  title: string;
  imageUrl: string;
  caption?: string;
  sortOrder: number;
}

export interface GalleryAlbumDetail {
  album: GalleryAlbum;
  images: GalleryImage[];
}

export interface AlbumForm {
  title: string;
  description: string;
  category: string;
  eventDate: string;
}

export interface ImageForm {
  title: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
}

export const defaultAlbumForm = (): AlbumForm => ({
  title: '',
  description: '',
  category: '',
  eventDate: '',
});

export const defaultImageForm = (): ImageForm => ({
  title: '',
  imageUrl: '',
  caption: '',
  sortOrder: 0,
});

@Injectable({ providedIn: 'root' })
export class CmsGalleryService {
  private readonly api = inject(CmsApiService);

  getAlbums(): Observable<GalleryAlbum[]> {
    return this.api.get<GalleryAlbum[]>('gallery');
  }

  getAlbumDetail(id: number): Observable<GalleryAlbumDetail> {
    return this.api.get<GalleryAlbumDetail>(`gallery/${id}`);
  }

  createAlbum(form: AlbumForm): Observable<unknown> {
    return this.api.post('gallery', {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      eventDate: form.eventDate || null,
    });
  }

  updateAlbum(id: number, form: AlbumForm): Observable<unknown> {
    return this.api.put(`gallery/${id}`, {
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      eventDate: form.eventDate || null,
    });
  }

  deleteAlbum(id: number): Observable<boolean> {
    return this.api.delete(`gallery/${id}`);
  }

  addImage(albumId: number, form: ImageForm): Observable<unknown> {
    return this.api.post(`gallery/${albumId}/images`, {
      id: 0,
      albumId,
      title: form.title || 'Image',
      imageUrl: form.imageUrl,
      caption: form.caption || null,
      sortOrder: form.sortOrder ?? 0,
    });
  }

  deleteImage(imageId: number): Observable<boolean> {
    return this.api.delete(`gallery/images/${imageId}`);
  }
}
