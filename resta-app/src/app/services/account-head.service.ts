// account-head.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

// ─── Domain Model (mirrors AccountHeadDto) ──────────────────────────────────────
export interface AccountHead {
  accountHeadId: number;
  name:         string;
  address:      string;
  city:         string;
  state:        string;
  phoneNo:      string;
  email:        string;
  faxNo:        string;
  cellNo:       string;
  remarks:      string;
  createdDate?: Date | null;
  createdBy?:   number | null;
  modifiedDate?: Date | null;
  modifiedBy?:  number | null;
}

// ─── API DTOs ───────────────────────────────────────────────────────────────────
export interface CreateAccountHeadDto {
  name:      string;
  address:   string;
  city:      string;
  state:     string;
  phoneNo:   string;
  email:     string;
  faxNo:     string;
  cellNo:    string;
  remarks:   string;
  createdBy: number | null;
}

export interface UpdateAccountHeadDto {
  name:       string;
  address:    string;
  city:       string;
  state:      string;
  phoneNo:    string;
  email:      string;
  faxNo:      string;
  cellNo:     string;
  remarks:    string;
  modifiedBy: number | null;
}

export interface AccountHeadListParams {
  search?:     string;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class AccountHeadService {

  private readonly apiUrl = apiUrl('AccountHeads');

  constructor(private http: HttpClient) {}

  getAll(params: AccountHeadListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateAccountHeadDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateAccountHeadDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
