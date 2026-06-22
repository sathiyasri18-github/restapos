import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface HrmSetting {
  hrmSettingId: number;
  checkin: string;
  checkout: string;
}

export interface CreateHrmSettingDto {
  checkin: string;
  checkout: string;
}

export interface UpdateHrmSettingDto {
  id: number;
  checkin: string;
  checkout: string;
}

export interface HrmSettingListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class HrmSettingService {
  private readonly apiUrl = apiUrl('HrmSetting');

  constructor(private http: HttpClient) {}

  getAll(params: HrmSettingListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateHrmSettingDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateHrmSettingDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
