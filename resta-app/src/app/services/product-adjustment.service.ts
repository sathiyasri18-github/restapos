import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface ProductAdjustment {
  productAdjustmentId: number;
  adjustmentId: number;
  productId: number;
  variantId: number | null;
  qty: number;
  action: string;
}

export interface CreateProductAdjustmentDto {
  adjustmentId: number;
  productId: number;
  variantId: number | null;
  qty: number;
  action: string;
}

export interface UpdateProductAdjustmentDto {
  id: number;
  adjustmentId: number;
  productId: number;
  variantId: number | null;
  qty: number;
  action: string;
}

@Injectable({ providedIn: 'root' })
export class ProductAdjustmentService {
  private readonly apiUrl = apiUrl('ProductAdjustment');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreateProductAdjustmentDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdateProductAdjustmentDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
