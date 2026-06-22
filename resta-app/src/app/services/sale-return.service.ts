import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface SaleReturnOrder {
  saleReturnId: number;
  referenceNo: string;
  userId: number;
  cashRegisterId: number | null;
  customerId: number;
  warehouseId: number;
  billerId: number;
  accountId: number;
  item: number;
  totalQty: number;
  totalDiscount: number;
  totalTax: number;
  totalPrice: number;
  orderTaxRate: number | null;
  orderTax: number | null;
  grandTotal: number;
  document: string;
  returnNote: string;
  staffNote: string;
}

export interface CreateSaleReturnDto {
  referenceNo: string;
  userId: number;
  cashRegisterId: number | null;
  customerId: number;
  warehouseId: number;
  billerId: number;
  accountId: number;
  item: number;
  totalQty: number;
  totalDiscount: number;
  totalTax: number;
  totalPrice: number;
  orderTaxRate: number | null;
  orderTax: number | null;
  grandTotal: number;
  document: string | null;
  returnNote: string | null;
  staffNote: string | null;
}

export interface UpdateSaleReturnDto extends CreateSaleReturnDto {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class SaleReturnService {
  private readonly apiUrl = apiUrl('SaleReturn');

  constructor(private http: HttpClient) {}

  getAll(params: { pageNumber?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateSaleReturnDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateSaleReturnDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
