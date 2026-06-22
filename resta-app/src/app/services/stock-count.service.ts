import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface StockCount {
  stockCountId: number;
  referenceNo: string;
  warehouseId: number;
  categoryId: string;
  brandId: string;
  userId: number;
  type: string;
  initialFile: string;
  finalFile: string;
  note: string;
  isAdjusted: boolean;
}

export interface CreateStockCountDto {
  referenceNo: string;
  warehouseId: number;
  categoryId: string | null;
  brandId: string | null;
  userId: number;
  type: string;
  initialFile: string | null;
  finalFile: string | null;
  note: string | null;
  isAdjusted: boolean;
}

export interface UpdateStockCountDto {
  id: number;
  referenceNo: string;
  warehouseId: number;
  categoryId: string | null;
  brandId: string | null;
  userId: number;
  type: string;
  initialFile: string | null;
  finalFile: string | null;
  note: string | null;
  isAdjusted: boolean;
}

@Injectable({ providedIn: 'root' })
export class StockCountService {
  private readonly apiUrl = apiUrl('StockCount');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreateStockCountDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdateStockCountDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
