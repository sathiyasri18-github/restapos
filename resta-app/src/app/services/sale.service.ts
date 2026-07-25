import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface SaleOrder {
  saleId: number;
  referenceNo: string;
  userId: number;
  cashRegisterId: number | null;
  customerId: number;
  warehouseId: number;
  billerId: number | null;
  item: number;
  totalQty: number;
  totalDiscount: number;
  totalTax: number;
  totalPrice: number;
  grandTotal: number;
  orderTaxRate: number | null;
  orderTax: number | null;
  orderDiscount: number | null;
  couponId: number | null;
  couponDiscount: number | null;
  shippingCost: number | null;
  saleStatus: number;
  paymentStatus: number;
  document: string;
  paidAmount: number | null;
  saleNote: string;
  staffNote: string;
}

export interface CreateSaleDto {
  referenceNo: string;
  userId: number;
  cashRegisterId: number | null;
  customerId: number;
  warehouseId: number;
  billerId: number | null;
  item: number;
  totalQty: number;
  totalDiscount: number;
  totalTax: number;
  totalPrice: number;
  grandTotal: number;
  orderTaxRate: number | null;
  orderTax: number | null;
  orderDiscount: number | null;
  couponId: number | null;
  couponDiscount: number | null;
  shippingCost: number | null;
  saleStatus: number;
  paymentStatus: number;
  document: string | null;
  paidAmount: number | null;
  saleNote: string | null;
  staffNote: string | null;
}

export interface UpdateSaleDto extends CreateSaleDto {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly apiUrl = apiUrl('Sale');

  constructor(private http: HttpClient) {}

  getAll(params: { pageNumber?: number; pageSize?: number; sortDesc?: boolean } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    if (params.sortDesc) p = p.set('sortDesc', 'true');
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  search(params: {
    pageNumber?: number;
    pageSize?: number;
    referenceNo?: string;
    customerId?: number;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    if (params.referenceNo?.trim()) p = p.set('referenceNo', params.referenceNo.trim());
    if (params.customerId) p = p.set('customerId', String(params.customerId));
    if (params.dateFrom) p = p.set('dateFrom', params.dateFrom);
    if (params.dateTo) p = p.set('dateTo', params.dateTo);
    return this.http.get<any>(`${this.apiUrl}/search`, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateSaleDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateSaleDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
