import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Adjustment {
  adjustmentId: number;
  referenceNo: string;
  warehouseId: number;
  document: string;
  totalQty: number;
  item: number;
  note: string;
}

export interface CreateAdjustmentDto {
  referenceNo: string;
  warehouseId: number;
  document: string | null;
  totalQty: number;
  item: number;
  note: string | null;
}

export interface UpdateAdjustmentDto {
  id: number;
  referenceNo: string;
  warehouseId: number;
  document: string | null;
  totalQty: number;
  item: number;
  note: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdjustmentService {
  private readonly apiUrl = apiUrl('Adjustment');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreateAdjustmentDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdateAdjustmentDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
