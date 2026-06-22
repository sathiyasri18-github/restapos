// voucher-entry.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface VoucherEntry {
  voucherEntryId: number;
  voucherNo:      string;
  voucherDate:    Date | null;
  voucherType:    number | null;
  accountHeadId:  number | null;
  totalAmount:    number | null;
  narration:      string;
  createdDate?:   Date | null;
  createdBy?:     number | null;
  modifiedDate?:  Date | null;
  modifiedBy?:    number | null;
}

export interface CreateVoucherEntryDto {
  voucherNo?:     string | null;
  voucherDate?:   Date | null;
  voucherType?:   number | null;
  accountHeadId?: number | null;
  totalAmount?:   number | null;
  narration?:     string | null;
  createdBy?:     number | null;
}

export interface UpdateVoucherEntryDto {
  voucherNo?:     string | null;
  voucherDate?:   Date | null;
  voucherType?:   number | null;
  accountHeadId?: number | null;
  totalAmount?:   number | null;
  narration?:     string | null;
  modifiedBy?:    number | null;
}

export interface VoucherEntryListParams {
  search?:     string;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class VoucherEntryService {

  private readonly apiUrl = apiUrl('VoucherEntries');

  constructor(private http: HttpClient) {}

  getAll(params: VoucherEntryListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateVoucherEntryDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateVoucherEntryDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
