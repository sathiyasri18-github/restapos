import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface PosSetting {
  posSettingId: number;
  customerId: number;
  warehouseId: number;
  billerId: number;
  productNumber: number;
  keybordActive: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
}

export interface CreatePosSettingDto {
  customerId: number;
  warehouseId: number;
  billerId: number;
  productNumber: number;
  keybordActive: boolean;
  stripePublicKey: string | null;
  stripeSecretKey: string;
}

export interface UpdatePosSettingDto {
  id: number;
  customerId: number;
  warehouseId: number;
  billerId: number;
  productNumber: number;
  keybordActive: boolean;
  stripePublicKey: string | null;
  stripeSecretKey: string;
}

export interface PosSettingListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class PosSettingService {
  private readonly apiUrl = apiUrl('PosSetting');

  constructor(private http: HttpClient) {}

  getAll(params: PosSettingListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreatePosSettingDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdatePosSettingDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
