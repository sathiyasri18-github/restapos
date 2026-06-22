import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface PurchaseOrder {
  purchaseId: number;
  referenceNo: string;
  userId: number;
  warehouseId: number;
  supplierId: number | null;
  item: number;
  totalQty: number;
  totalDiscount: number;
  totalTax: number;
  totalCost: number;
  orderTaxRate: number | null;
  orderTax: number | null;
  orderDiscount: number | null;
  shippingCost: number | null;
  grandTotal: number;
  paidAmount: number;
  status: number;
  paymentStatus: number;
  document: string;
  note: string;
}

export interface CreatePurchaseOrderDto {
  referenceNo: string;
  userId: number;
  warehouseId: number;
  supplierId: number | null;
  item: number;
  totalQty: number;
  totalDiscount: number;
  totalTax: number;
  totalCost: number;
  orderTaxRate: number | null;
  orderTax: number | null;
  orderDiscount: number | null;
  shippingCost: number | null;
  grandTotal: number;
  paidAmount: number;
  status: number;
  paymentStatus: number;
  document: string | null;
  note: string | null;
}

export interface UpdatePurchaseOrderDto extends CreatePurchaseOrderDto {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly apiUrl = apiUrl('Purchase');
  constructor(private http: HttpClient) {}
  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }
  getById(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  create(dto: CreatePurchaseOrderDto): Observable<any> { return this.http.post<any>(this.apiUrl, dto); }
  update(id: number, dto: UpdatePurchaseOrderDto): Observable<any> { return this.http.put<any>(`${this.apiUrl}/${id}`, dto); }
  delete(id: number): Observable<any> { return this.http.delete<any>(`${this.apiUrl}/${id}`); }
}
