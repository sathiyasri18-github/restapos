import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface ExpenseCategory {
  expenseCategoryId: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreateExpenseCategoryDto {
  code: string;
  name: string;
  isActive: boolean;
}

export interface UpdateExpenseCategoryDto {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ExpenseCategoryListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ExpenseCategoryService {
  private readonly apiUrl = apiUrl('ExpenseCategory');

  constructor(private http: HttpClient) {}

  getAll(params: ExpenseCategoryListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateExpenseCategoryDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateExpenseCategoryDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
