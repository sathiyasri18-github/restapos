import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface SiteMenuItem {
  id: number;
  title: string;
  url?: string;
  parentId?: number | null;
  sortOrder: number;
  openInNewTab: boolean;
  children?: SiteMenuItem[];
}

export interface SiteMenuForm {
  title: string;
  url: string;
  parentId: number | null;
  sortOrder: number;
  openInNewTab: boolean;
}

export const defaultSiteMenuForm = (): SiteMenuForm => ({
  title: '',
  url: '',
  parentId: null,
  sortOrder: 0,
  openInNewTab: false,
});

@Injectable({ providedIn: 'root' })
export class CmsSiteMenuService {
  private readonly api = inject(CmsApiService);

  getAll(): Observable<SiteMenuItem[]> {
    return this.api.get<SiteMenuItem[]>('menu');
  }

  create(form: SiteMenuForm): Observable<unknown> {
    return this.api.post('menu', this.toDto(form));
  }

  update(id: number, form: SiteMenuForm): Observable<unknown> {
    return this.api.put(`menu/${id}`, { id, children: [], ...this.toDto(form) });
  }

  delete(id: number): Observable<boolean> {
    return this.api.delete(`menu/${id}`);
  }

  private toDto(form: SiteMenuForm) {
    return {
      title: form.title,
      url: form.url || null,
      parentId: form.parentId,
      sortOrder: form.sortOrder,
      openInNewTab: form.openInNewTab,
    };
  }
}
