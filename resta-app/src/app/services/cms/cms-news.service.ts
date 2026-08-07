import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  category: number;
  isPublished: boolean;
  publishedAt?: string;
  author?: string;
  viewCount?: number;
}

export interface NewsForm {
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: number;
  isPublished: boolean;
  author: string;
}

export const defaultNewsForm = (): NewsForm => ({
  title: '',
  summary: '',
  content: '',
  imageUrl: '',
  category: 1,
  isPublished: false,
  author: '',
});

export const NewsCategories = [
  { label: 'Latest News', value: 1 },
  { label: 'Press Release', value: 2 },
  { label: 'Industry Update', value: 3 },
  { label: 'Announcement', value: 4 },
];

@Injectable({ providedIn: 'root' })
export class CmsNewsService {
  private readonly api = inject(CmsApiService);

  getAll(page = 1, pageSize = 100): Observable<{ items: NewsItem[]; totalCount: number } | NewsItem[]> {
    return this.api.get(`news?page=${page}&pageSize=${pageSize}`);
  }

  create(form: NewsForm): Observable<unknown> {
    return this.api.post('news', form);
  }

  update(id: number, form: NewsForm): Observable<unknown> {
    return this.api.put(`news/${id}`, form);
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`news/${id}`);
  }
}
