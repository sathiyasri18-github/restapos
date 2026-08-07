import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface SpecialtyItem {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  content?: string;
  coverImageUrl?: string;
  sortOrder: number;
  isPublished: boolean;
  isFeatured: boolean;
}

export interface SpecialtyForm {
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  coverImageUrl: string;
  sortOrder: number;
  isPublished: boolean;
  isFeatured: boolean;
}

export const defaultSpecialtyForm = (): SpecialtyForm => ({
  title: '',
  subtitle: '',
  slug: '',
  content: '',
  coverImageUrl: '',
  sortOrder: 0,
  isPublished: true,
  isFeatured: false,
});

@Injectable({ providedIn: 'root' })
export class CmsSpecialtyService {
  private readonly api = inject(CmsApiService);

  getAll(): Observable<SpecialtyItem[]> {
    return this.api.get<SpecialtyItem[]>('services');
  }

  create(form: SpecialtyForm): Observable<unknown> {
    return this.api.post('services', form);
  }

  update(id: number, form: SpecialtyForm): Observable<unknown> {
    return this.api.put(`services/${id}`, form);
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`services/${id}`);
  }
}
