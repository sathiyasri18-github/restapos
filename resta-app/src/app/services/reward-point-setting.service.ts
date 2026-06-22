import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface RewardPointSetting {
  rewardPointSettingId: number;
  perPointAmount: number;
  minimumAmount: number;
  duration: number | null;
  type: string;
  isActive: boolean;
}

export interface CreateRewardPointSettingDto {
  perPointAmount: number;
  minimumAmount: number;
  duration: number | null;
  type: string | null;
  isActive: boolean;
}

export interface UpdateRewardPointSettingDto {
  id: number;
  perPointAmount: number;
  minimumAmount: number;
  duration: number | null;
  type: string | null;
  isActive: boolean;
}

export interface RewardPointSettingListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class RewardPointSettingService {
  private readonly apiUrl = apiUrl('RewardPointSetting');

  constructor(private http: HttpClient) {}

  getAll(params: RewardPointSettingListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateRewardPointSettingDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateRewardPointSettingDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
