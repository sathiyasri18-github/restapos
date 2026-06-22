import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface CustomerGroup {
  customerGroupId: number;
  name: string;
  percentage: string;
  isActive: boolean;
}

export interface CreateCustomerGroupDto {
  name: string;
  percentage: string;
  isActive: boolean;
}

export interface UpdateCustomerGroupDto extends CreateCustomerGroupDto {
  id: number;
}

export interface CustomerGroupListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerGroupService {
  private readonly apiUrl = apiUrl('CustomerGroup');

  constructor(private http: HttpClient) {}

  getAll(params: CustomerGroupListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCustomerGroupDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCustomerGroupDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
