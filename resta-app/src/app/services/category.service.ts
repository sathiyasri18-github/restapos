// category.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Category {
  categoryId:     number;
  categoryName:   string;
  categoryTypeId: number | null;
  createdDate?:   Date | null;
  createdBy?:     number | null;
  modifiedDate?:  Date | null;
  modifiedBy?:    number | null;
}

export interface CreateCategoryDto {
  categoryName:   string;
  categoryTypeId: number | null;
  createdBy:      number | null;
}

export interface UpdateCategoryDto {
  categoryId:     number;
  categoryName:   string;
  categoryTypeId: number | null;
  modifiedBy:     number | null;
}

export interface CategoryListParams {
  categoryTypeId?: number;
  search?:         string;
  pageNumber?:     number;
  pageSize?:       number;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {

  private readonly apiUrl = apiUrl('Categories');

  constructor(private http: HttpClient) {}

  getAll(params: CategoryListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.categoryTypeId != null) p = p.set('categoryTypeId', params.categoryTypeId.toString());
    if (params.search)                 p = p.set('search',         params.search);
    if (params.pageNumber)             p = p.set('pageNumber',     params.pageNumber.toString());
    if (params.pageSize)               p = p.set('pageSize',       params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getByCategoryTypeCode(categoryTypeCode: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/by-type-code/${encodeURIComponent(categoryTypeCode)}`
    );
  }

  create(dto: CreateCategoryDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCategoryDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
