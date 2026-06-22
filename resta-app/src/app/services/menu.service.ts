import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface AppMenu {
  id: number;
  parentMenuId: number | null;
  menuCode: string;
  menuName: string;
  routePath: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  parentMenuName?: string | null;
}

export interface CreateMenuDto {
  parentMenuId: number | null;
  menuCode: string;
  menuName: string;
  routePath: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdBy?: number | null;
}

export interface UpdateMenuDto extends CreateMenuDto {
  id: number;
  modifiedBy?: number | null;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly apiUrl = apiUrl('Menu');

  constructor(private http: HttpClient) {}

  getTree(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tree`);
  }

  /** Sidebar menu tree filtered by the signed-in user's role permissions. */
  getMyTree(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tree/me`);
  }

  getAll(params: { pageSize?: number } = {}): Observable<any> {
    const p = new HttpParams().set('pageSize', String(params.pageSize ?? 500));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateMenuDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateMenuDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
