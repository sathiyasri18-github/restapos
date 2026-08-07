import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface BannerSlide {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
}

export interface BannerForm {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
}

export const defaultBannerForm = (): BannerForm => ({
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: 0,
});

@Injectable({ providedIn: 'root' })
export class CmsBannerService {
  private readonly api = inject(CmsApiService);

  getAll(): Observable<BannerSlide[]> {
    return this.api.get<BannerSlide[]>('banners');
  }

  create(form: BannerForm): Observable<unknown> {
    return this.api.post('banners', this.toDto(form, 0));
  }

  update(id: number, form: BannerForm): Observable<unknown> {
    return this.api.put(`banners/${id}`, this.toDto(form, id));
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`banners/${id}`);
  }

  private toDto(form: BannerForm, id: number) {
    return {
      id,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl?.trim() || null,
      sortOrder: form.sortOrder ?? 0,
    };
  }
}
