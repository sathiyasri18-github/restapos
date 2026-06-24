import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Meta {
  metaId: number;
  metaName: string;
  metaTypeId: number | null;
  createdDate?: Date | null;
  modifiedDate?: Date | null;
}

export interface CreateMetaDto {
  metaName: string;
  metaTypeId: number | null;
}

export interface UpdateMetaDto {
  metaName: string;
  metaTypeId: number | null;
}

export interface MetaListParams {
  metaTypeId?: number;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly apiUrl = apiUrl('Metas');

  constructor(private http: HttpClient) {}

  getAll(params: MetaListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.metaTypeId != null) p = p.set('metaTypeId', params.metaTypeId.toString());
    if (params.search) p = p.set('search', params.search);
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize) p = p.set('pageSize', params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getByMetaTypeCode(metaTypeCode: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/by-type-code/${encodeURIComponent(metaTypeCode)}`
    );
  }

  create(dto: CreateMetaDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateMetaDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
