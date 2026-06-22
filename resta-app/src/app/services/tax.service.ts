import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Tax {
  taxId: number;
  name: string;
  rate: number;
  isActive: boolean;
}

export interface CreateTaxDto {
  name: string;
  rate: number;
  isActive: boolean;
}

export interface UpdateTaxDto {
  id: number;
  name: string;
  rate: number;
  isActive: boolean;
}

export interface TaxListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class TaxService {
  private readonly apiUrl = apiUrl('Tax');

  constructor(private http: HttpClient) {}

  getAll(params: TaxListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateTaxDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateTaxDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
