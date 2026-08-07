import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface Promotion {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: number;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

export interface PromotionForm {
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: number;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

export const defaultPromotionForm = (): PromotionForm => ({
  title: '',
  imageUrl: '',
  linkUrl: '',
  position: 1,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  sortOrder: 0,
});

export const PromotionPositions = [
  { label: 'Home Banner', value: 1 },
  { label: 'Sidebar', value: 2 },
  { label: 'Footer', value: 3 },
  { label: 'Popup', value: 4 },
];

@Injectable({ providedIn: 'root' })
export class CmsPromotionService {
  private readonly api = inject(CmsApiService);

  getAll(): Observable<Promotion[]> {
    return this.api.get<Promotion[]>('advertisements');
  }

  create(form: PromotionForm): Observable<unknown> {
    return this.api.post('advertisements', this.toDto(form));
  }

  update(id: number, form: PromotionForm): Observable<unknown> {
    return this.api.put(`advertisements/${id}`, { id, ...this.toDto(form) });
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`advertisements/${id}`);
  }

  private toDto(form: PromotionForm) {
    return {
      title: form.title,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl || null,
      position: form.position,
      startDate: form.startDate,
      endDate: form.endDate,
      sortOrder: form.sortOrder,
    };
  }
}
