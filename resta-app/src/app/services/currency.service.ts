import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Currency {
  currencyId: number;
  name: string;
  code: string;
  exchangeRate: number;
}

export interface CreateCurrencyDto {
  name: string;
  code: string;
  exchangeRate: number;
}

export interface UpdateCurrencyDto {
  id: number;
  name: string;
  code: string;
  exchangeRate: number;
}

export interface CurrencyListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly apiUrl = apiUrl('Currency');

  constructor(private http: HttpClient) {}

  getAll(params: CurrencyListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCurrencyDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCurrencyDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
