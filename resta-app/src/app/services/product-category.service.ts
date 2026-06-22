import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface ProductCategory {
  categoryId: number;
  name: string;
  image: string | null;
  parentId: number | null;
  isActive: boolean;
}

export interface CreateProductCategoryDto {
  name: string;
  image: string | null;
  parentId: number | null;
  isActive: boolean;
}

export interface UpdateProductCategoryDto {
  id: number;
  name: string;
  image: string | null;
  parentId: number | null;
  isActive: boolean;
}

export interface ProductCategoryListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductCategoryService {
  private readonly apiUrl = apiUrl('Category');

  constructor(private http: HttpClient) {}

  getAll(params: ProductCategoryListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateProductCategoryDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateProductCategoryDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
