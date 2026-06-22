// supplier.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Supplier {
  supplierId: number;
  name: string;
  image: string;
  companyName: string;
  vatNumber: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isActive: boolean;
}

export interface CreateSupplierDto {
  name: string;
  image: string | null;
  companyName: string;
  vatNumber: string | null;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  isActive: boolean;
}

export interface UpdateSupplierDto {
  id: number;
  name: string;
  image: string | null;
  companyName: string;
  vatNumber: string | null;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  isActive: boolean;
}

export interface SupplierListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class SupplierService {

  private readonly apiUrl = apiUrl('Supplier');

  constructor(private http: HttpClient) {}

  getAll(params: SupplierListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateSupplierDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateSupplierDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
