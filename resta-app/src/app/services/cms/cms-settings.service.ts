import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsApiService } from './cms-api.service';

export interface SiteSettings {
  associationName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  mapEmbedUrl: string;
  aboutContent: string;
  vision: string;
  mission: string;
  objectives: string;
}

export const defaultSiteSettings = (): SiteSettings => ({
  associationName: '',
  tagline: '',
  address: '',
  phone: '',
  email: '',
  mapEmbedUrl: '',
  aboutContent: '',
  vision: '',
  mission: '',
  objectives: '',
});

@Injectable({ providedIn: 'root' })
export class CmsSettingsService {
  private readonly api = inject(CmsApiService);

  get(): Observable<SiteSettings> {
    return this.api.get<SiteSettings>('settings');
  }

  update(settings: SiteSettings): Observable<boolean> {
    return this.api.put('settings', settings);
  }
}
