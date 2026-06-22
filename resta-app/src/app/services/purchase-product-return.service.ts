import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface PurchaseProductReturnLine {
  purchaseProductReturnId: number;
  returnId: number;
  productId: number;
  productBatchId: number | null;
  variantId: number | null;
  imeiNumber: string;
  qty: number;
  purchaseUnitId: number;
  netUnitCost: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
}

export interface CreatePurchaseProductReturnDto {
  returnId: number;
  productId: number;
  productBatchId: number | null;
  variantId: number | null;
  imeiNumber: string | null;
  qty: number;
  purchaseUnitId: number;
  netUnitCost: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
}

export interface UpdatePurchaseProductReturnDto extends CreatePurchaseProductReturnDto {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class PurchaseProductReturnService {
  private readonly apiUrl = apiUrl('PurchaseProductReturn');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreatePurchaseProductReturnDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdatePurchaseProductReturnDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
