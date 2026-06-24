import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl, apiAssetUrl } from '../core/api-config';

export interface GeneralSetting {
  generalSettingId: number;
  siteTitle: string;
  siteLogo: string;
  favicon: string;
  isRtl: boolean;
  currency: string;
  staffAccess: string;
  dateFormat: string;
  developedBy: string;
  invoiceFormat: string;
  state: number | null;
  theme: string;
  currencyPosition: string;
}

export interface CreateGeneralSettingDto {
  siteTitle: string;
  siteLogo: string | null;
  favicon: string | null;
  isRtl: boolean | null;
  currency: string;
  staffAccess: string;
  dateFormat: string;
  developedBy: string | null;
  invoiceFormat: string | null;
  state: number | null;
  theme: string;
  currencyPosition: string;
}

export interface UpdateGeneralSettingDto {
  id: number;
  siteTitle: string;
  siteLogo: string | null;
  favicon: string | null;
  isRtl: boolean | null;
  currency: string;
  staffAccess: string;
  dateFormat: string;
  developedBy: string | null;
  invoiceFormat: string | null;
  state: number | null;
  theme: string;
  currencyPosition: string;
}

export interface GeneralSettingListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class GeneralSettingService {
  private readonly apiUrl = apiUrl('GeneralSetting');

  constructor(private http: HttpClient) {}

  getAll(params: GeneralSettingListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateGeneralSettingDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateGeneralSettingDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  uploadSiteLogo(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<any>(`${this.apiUrl}/${id}/site-logo`, formData);
  }

  deleteSiteLogo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/site-logo`);
  }

  uploadFavicon(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<any>(`${this.apiUrl}/${id}/favicon`, formData);
  }

  deleteFavicon(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/favicon`);
  }

  resolveAssetUrl(path: string | null | undefined): string | null {
    return apiAssetUrl(path);
  }
}
