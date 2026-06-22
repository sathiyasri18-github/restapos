import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Customer {
  customerId: number;
  customerGroupId: number;
  userId: number | null;
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  taxNo: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  points: number | null;
  deposit: number | null;
  expense: number | null;
  isActive: boolean;
}

export interface CreateCustomerDto {
  customerGroupId: number;
  userId: number | null;
  name: string;
  companyName: string | null;
  email: string | null;
  phoneNumber: string;
  taxNo: string | null;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  points: number | null;
  deposit: number | null;
  expense: number | null;
  isActive: boolean;
}

export interface UpdateCustomerDto extends CreateCustomerDto {
  id: number;
}

export interface CustomerListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly apiUrl = apiUrl('Customer');

  constructor(private http: HttpClient) {}

  getAll(params: CustomerListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCustomerDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCustomerDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
