// purchase-line.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface PurchaseLine {
  purchaseLineId: number;
  purchaseId:     number | null;
  productId:      number | null;
  quantity:       number | null;
  price:          number | null;
  gst:            number | null;
  amount:         number | null;
  /** UI-only: price is GST-inclusive when true */
  includeGst?:    boolean;
  createdDate?:   Date | null;
  modifiedDate?:  Date | null;
}

export interface CreatePurchaseLineDto {
  purchaseId: number | null;
  productId:  number | null;
  quantity:   number | null;
  price:      number | null;
  gst:        number | null;
  createdBy:  number | null;
}

export interface UpdatePurchaseLineDto {
  purchaseLineId: number;
  purchaseId:     number | null;
  productId:      number | null;
  quantity:       number | null;
  price:          number | null;
  gst:            number | null;
  modifiedBy:     number | null;
}

export interface PurchaseLineListParams {
  purchaseId?:  number;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class PurchaseLineService {

  private readonly apiUrl = apiUrl('PurchaseLines');

  constructor(private http: HttpClient) {}

  getAll(params: PurchaseLineListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.purchaseId != null) p = p.set('purchaseId', params.purchaseId.toString());
    if (params.pageNumber)       p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)         p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreatePurchaseLineDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdatePurchaseLineDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
