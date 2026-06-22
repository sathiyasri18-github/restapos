import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface ProductWarehouse {
  productWarehouseId: number;
  productId: string;
  productBatchId: number | null;
  variantId: number | null;
  imeiNumber: string;
  warehouseId: number;
  qty: number;
  price: number | null;
}

export interface CreateProductWarehouseDto {
  productId: string;
  productBatchId: number | null;
  variantId: number | null;
  imeiNumber: string | null;
  warehouseId: number;
  qty: number;
  price: number | null;
}

export interface UpdateProductWarehouseDto {
  id: number;
  productId: string;
  productBatchId: number | null;
  variantId: number | null;
  imeiNumber: string | null;
  warehouseId: number;
  qty: number;
  price: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProductWarehouseService {
  private readonly apiUrl = apiUrl('ProductWarehouse');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreateProductWarehouseDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdateProductWarehouseDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
