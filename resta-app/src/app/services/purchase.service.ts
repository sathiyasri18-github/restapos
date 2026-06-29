// purchase.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Purchase {
  purchaseId:    number;
  purchaseCode:  string;
  date:          Date | null;
  supplierId:    number | null;
  supplierName:  string;
  type:          number | null;
  orderNo:       string;
  totalAmount:   number | null;
  createdDate?:  Date | null;
  modifiedDate?: Date | null;
}

export interface CreatePurchaseRequest {
  purchaseCode: string | null;
  date:         string | null;
  supplierId:   number | null;
  type:         number | null;
  orderNo:      string | null;
  totalAmount:  number | null;
  createdBy:    number | null;
}

export interface UpdatePurchaseRequest {
  purchaseCode: string | null;
  date:         string | null;
  supplierId:   number | null;
  type:         number | null;
  orderNo:      string | null;
  totalAmount:  number | null;
  modifiedBy:   number | null;
}

export interface PurchaseListParams {
  search?:     string;
  fromDate?:   string;
  toDate?:     string;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {

  private readonly apiUrl = apiUrl('Purchase');

  constructor(private http: HttpClient) {}

  getAll(params: PurchaseListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.fromDate)   p = p.set('fromDate',   params.fromDate);
    if (params.toDate)     p = p.set('toDate',       params.toDate);
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreatePurchaseRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdatePurchaseRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
