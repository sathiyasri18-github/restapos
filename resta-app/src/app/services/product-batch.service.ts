import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface ProductBatch {
  productBatchId: number;
  productId: number;
  batchNo: string;
  expiredDate: string;
  qty: number;
}

export interface CreateProductBatchDto {
  productId: number;
  batchNo: string;
  expiredDate: string;
  qty: number;
}

export interface UpdateProductBatchDto {
  id: number;
  productId: number;
  batchNo: string;
  expiredDate: string;
  qty: number;
}

@Injectable({ providedIn: 'root' })
export class ProductBatchService {
  private readonly apiUrl = apiUrl('ProductBatch');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreateProductBatchDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdateProductBatchDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
