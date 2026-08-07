import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface DynamicPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  isPublished: boolean;
}

export interface PageForm {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  isPublished: boolean;
}

export const defaultPageForm = (): PageForm => ({
  title: '',
  slug: '',
  content: '',
  metaDescription: '',
  isPublished: true,
});

@Injectable({ providedIn: 'root' })
export class CmsPageService {
  private readonly api = inject(CmsApiService);

  getAll(): Observable<DynamicPage[]> {
    return this.api.get<DynamicPage[]>('pages');
  }

  create(form: PageForm): Observable<unknown> {
    return this.api.post('pages', this.toDto(form));
  }

  update(id: number, form: PageForm): Observable<unknown> {
    return this.api.put(`pages/${id}`, { id, ...this.toDto(form) });
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`pages/${id}`);
  }

  private toDto(form: PageForm) {
    return {
      title: form.title,
      slug: form.slug,
      content: form.content,
      metaDescription: form.metaDescription || null,
      isPublished: form.isPublished,
    };
  }
}
