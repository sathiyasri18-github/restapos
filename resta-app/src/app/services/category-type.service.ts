// category-type.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface CategoryType {
  categoryTypeId:   number;
  categoryTypeCode: string;
  categoryTypeName: string;
  createdDate?:     Date | null;
  createdBy?:       number | null;
  modifiedDate?:    Date | null;
  modifiedBy?:      number | null;
}

export interface CreateCategoryTypeDto {
  categoryTypeCode: string;
  categoryTypeName: string;
  createdBy:        number | null;
}

export interface UpdateCategoryTypeDto {
  categoryTypeId:   number;
  categoryTypeCode: string;
  categoryTypeName: string;
  modifiedBy:       number | null;
}

export interface CategoryTypeListParams {
  search?:     string;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class CategoryTypeService {

  private readonly apiUrl = apiUrl('CategoryTypes');

  constructor(private http: HttpClient) {}

  getAll(params: CategoryTypeListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCategoryTypeDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCategoryTypeDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
