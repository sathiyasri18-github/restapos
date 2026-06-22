import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface CustomField {
  customFieldId:   number;
  entityTypeId:    number | null;
  entityTypeName?: string;
  fieldTypeId:     number;
  fieldTypeName?:  string;
  fieldKey:        string;
  label:           string;
  optionsJson:     string | null;
  sortOrder:       number;
  isRequired:      boolean;
  isActive:        boolean;
  createdDate?:    Date | null;
  modifiedDate?:   Date | null;
}

export interface CreateCustomFieldDto {
  entityTypeId: number;
  fieldTypeId:  number;
  fieldKey:     string;
  label:        string;
  optionsJson:  string | null;
  sortOrder:    number;
  isRequired:   boolean;
  isActive:     boolean;
  createdBy:    number | null;
}

export interface UpdateCustomFieldDto {
  entityTypeId: number;
  fieldTypeId:  number;
  fieldKey:     string;
  label:        string;
  optionsJson:  string | null;
  sortOrder:    number;
  isRequired:   boolean;
  isActive:     boolean;
  modifiedBy:   number | null;
}

export interface CustomFieldListParams {
  entityTypeId?: number;
  search?:        string;
  activeOnly?:    boolean;
  pageNumber?:    number;
  pageSize?:      number;
}

@Injectable({ providedIn: 'root' })
export class CustomFieldService {
  private readonly apiUrl = apiUrl('CustomFields');

  constructor(private http: HttpClient) {}

  getAll(params: CustomFieldListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.entityTypeId != null) p = p.set('entityTypeId', params.entityTypeId.toString());
    if (params.search)               p = p.set('search', params.search);
    if (params.activeOnly != null)   p = p.set('activeOnly', params.activeOnly.toString());
    if (params.pageNumber)           p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)             p = p.set('pageSize', params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCustomFieldDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateCustomFieldDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getForEntity(entityType: string, entityId = 0): Observable<any> {
    const base = `${this.apiUrl}/for-entity/${encodeURIComponent(entityType)}`;
    const url = entityId > 0 ? `${base}/${entityId}` : base;
    return this.http.get<any>(url);
  }

  upsertForEntity(
    entityType: string,
    entityId: number,
    values: { customFieldId: number; valueText: string | null }[],
    modifiedBy: number | null = null
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/for-entity/${encodeURIComponent(entityType)}/${entityId}`,
      { values, modifiedBy }
    );
  }
}

export type EntityCustomFieldKind = 'customer' | 'product' | 'supplier';

export interface EntityCustomFieldItem {
  customFieldId:      number;
  fieldKey:           string;
  label:              string;
  fieldTypeId:        number;
  fieldTypeName?:     string;
  optionsJson:        string | null;
  sortOrder:          number;
  isRequired:         boolean;
  customFieldValueId: number | null;
  valueText:          string | null;
}

export interface EntityCustomFieldFormEntry extends EntityCustomFieldItem {
  dropdownOptions?: { label: string; value: string }[];
}
