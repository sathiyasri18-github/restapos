import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Expense {
  expenseId: number;
  referenceNo: string;
  expenseCategoryId: number;
  warehouseId: number;
  accountId: number;
  userId: number;
  cashRegisterId: number | null;
  amount: number;
  note: string | null;
  createdDate?: string | null;
}

export interface CreateExpenseDto {
  referenceNo: string;
  expenseCategoryId: number;
  warehouseId: number;
  accountId: number;
  userId: number;
  cashRegisterId: number | null;
  amount: number;
  note: string | null;
}

export interface UpdateExpenseDto {
  id: number;
  referenceNo: string;
  expenseCategoryId: number;
  warehouseId: number;
  accountId: number;
  userId: number;
  cashRegisterId: number | null;
  amount: number;
  note: string | null;
}

export interface ExpenseListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly apiUrl = apiUrl('Expense');

  constructor(private http: HttpClient) {}

  getAll(params: ExpenseListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateExpenseDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateExpenseDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
