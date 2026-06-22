import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface ProductTransfer {
  productTransferId: number;
  transferId: number;
  productId: number;
  productBatchId: number | null;
  variantId: number | null;
  imeiNumber: string;
  qty: number;
  purchaseUnitId: number;
  netUnitCost: number;
  taxRate: number;
  tax: number;
  total: number;
}

export interface CreateProductTransferDto {
  transferId: number;
  productId: number;
  productBatchId: number | null;
  variantId: number | null;
  imeiNumber: string | null;
  qty: number;
  purchaseUnitId: number;
  netUnitCost: number;
  taxRate: number;
  tax: number;
  total: number;
}

export interface UpdateProductTransferDto {
  id: number;
  transferId: number;
  productId: number;
  productBatchId: number | null;
  variantId: number | null;
  imeiNumber: string | null;
  qty: number;
  purchaseUnitId: number;
  netUnitCost: number;
  taxRate: number;
  tax: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ProductTransferService {
  private readonly apiUrl = apiUrl('ProductTransfer');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreateProductTransferDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdateProductTransferDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
