// customer-credit-debit-note.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface CustomerCreditDebitNote {
  customerCreditDebitNoteId: number;
  voucherNo:                 string;
  voucherDate:               Date | null;
  voucherType:               number | null;
  customerId:                number | null;
  totalAmount:               number | null;
  narration:                 string;
  createdDate?:              Date | null;
  createdBy?:                number | null;
  modifiedDate?:             Date | null;
  modifiedBy?:               number | null;
}

export interface CreateCustomerCreditDebitNoteDto {
  voucherNo?:     string | null;
  voucherDate?:   Date | null;
  voucherType?:   number | null;
  customerId?:    number | null;
  totalAmount?:   number | null;
  narration?:     string | null;
  createdBy?:     number | null;
}

export interface UpdateCustomerCreditDebitNoteDto {
  voucherNo?:     string | null;
  voucherDate?:   Date | null;
  voucherType?:   number | null;
  customerId?:    number | null;
  totalAmount?:   number | null;
  narration?:     string | null;
  modifiedBy?:    number | null;
}

export interface CustomerCreditDebitNoteListParams {
  search?:     string;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class CustomerCreditDebitNoteService {

  private readonly apiUrl = apiUrl('CustomerCreditDebitNotes');

  constructor(private http: HttpClient) {}

  getAll(params: CustomerCreditDebitNoteListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCustomerCreditDebitNoteDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCustomerCreditDebitNoteDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
