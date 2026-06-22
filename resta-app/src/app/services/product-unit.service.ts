import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface ProductUnit {
  productUnitId: number;
  unitCode: string;
  unitName: string;
  baseUnit: number | null;
  operator: string | null;
  operationValue: number | null;
  isActive: boolean;
}

export interface CreateProductUnitDto {
  unitCode: string;
  unitName: string;
  baseUnit: number | null;
  operator: string | null;
  operationValue: number | null;
  isActive: boolean;
}

export interface UpdateProductUnitDto {
  id: number;
  unitCode: string;
  unitName: string;
  baseUnit: number | null;
  operator: string | null;
  operationValue: number | null;
  isActive: boolean;
}

export interface ProductUnitListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductUnitService {
  private readonly apiUrl = apiUrl('ProductUnit');

  constructor(private http: HttpClient) {}

  getAll(params: ProductUnitListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateProductUnitDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateProductUnitDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
