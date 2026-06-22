// employee.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Employee {
  employeeId:   number;
  employeeName: string;
  mobileNo:     string;
  designation:  string;
  joiningDate:  Date | null;
  isActive:     boolean;
  createdDate?: Date | null;
  createdBy?:   number | null;
  modifiedDate?: Date | null;
  modifiedBy?:  number | null;
}

export interface CreateEmployeeDto {
  employeeName: string;
  mobileNo:     string | null;
  designation:  string | null;
  joiningDate:  string | null;
  isActive:     boolean;
  createdBy:    number | null;
}

export interface UpdateEmployeeDto {
  employeeId:   number;
  employeeName: string;
  mobileNo:     string | null;
  designation:  string | null;
  joiningDate:  string | null;
  isActive:     boolean;
  modifiedBy:   number | null;
}

export interface EmployeeListParams {
  search?:     string;
  isActive?:   boolean;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {

  private readonly apiUrl = apiUrl('Employees');

  constructor(private http: HttpClient) {}

  getAll(params: EmployeeListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.isActive != null) p = p.set('isActive', params.isActive.toString());
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateEmployeeDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateEmployeeDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
