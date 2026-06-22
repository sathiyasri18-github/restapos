import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Transfer {
  transferId: number;
  referenceNo: string;
  userId: number;
  status: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  item: number;
  totalQty: number;
  totalTax: number;
  totalCost: number;
  shippingCost: number | null;
  grandTotal: number;
  document: string;
  note: string;
}

export interface CreateTransferDto {
  referenceNo: string;
  userId: number;
  status: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  item: number;
  totalQty: number;
  totalTax: number;
  totalCost: number;
  shippingCost: number | null;
  grandTotal: number;
  document: string | null;
  note: string | null;
}

export interface UpdateTransferDto {
  id: number;
  referenceNo: string;
  userId: number;
  status: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  item: number;
  totalQty: number;
  totalTax: number;
  totalCost: number;
  shippingCost: number | null;
  grandTotal: number;
  document: string | null;
  note: string | null;
}

@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly apiUrl = apiUrl('Transfer');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreateTransferDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdateTransferDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
