import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface CustomFieldValue {
  customFieldValueId: number;
  customFieldId:      number;
  fieldKey?:          string;
  fieldLabel?:        string;
  entityId:           number;
  valueText:          string | null;
  createdDate?:       Date | null;
  modifiedDate?:      Date | null;
}

export interface CreateCustomFieldValueDto {
  customFieldId: number;
  entityId:      number;
  valueText:     string | null;
  createdBy:     number | null;
}

export interface UpdateCustomFieldValueDto {
  customFieldId: number;
  entityId:      number;
  valueText:     string | null;
  modifiedBy:    number | null;
}

export interface CustomFieldValueListParams {
  customFieldId?: number;
  entityId?:      number;
  search?:        string;
  pageNumber?:    number;
  pageSize?:      number;
}

@Injectable({ providedIn: 'root' })
export class CustomFieldValueService {
  private readonly apiUrl = apiUrl('CustomFieldValues');

  constructor(private http: HttpClient) {}

  getAll(params: CustomFieldValueListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.customFieldId != null) p = p.set('customFieldId', params.customFieldId.toString());
    if (params.entityId != null)      p = p.set('entityId', params.entityId.toString());
    if (params.search)                p = p.set('search', params.search);
    if (params.pageNumber)            p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)              p = p.set('pageSize', params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCustomFieldValueDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCustomFieldValueDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
