import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface RoleMenuEntry {
  id: number;
  roleId: number;
  roleName: string;
  menuId: number;
  menuCode: string;
  menuName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CreateRoleMenuDto {
  roleId: number;
  menuId: number;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdBy: number | null;
}

export interface UpdateRoleMenuDto {
  id: number;
  roleId: number;
  menuId: number;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  modifiedBy: number | null;
}

@Injectable({ providedIn: 'root' })
export class RoleMenuService {
  private readonly apiUrl = apiUrl('RoleMenu');

  constructor(private http: HttpClient) {}

  getAll(params: { roleId?: number; menuId?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams().set('pageSize', String(params.pageSize ?? 500));
    if (params.roleId != null) p = p.set('roleId', String(params.roleId));
    if (params.menuId != null) p = p.set('menuId', String(params.menuId));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateRoleMenuDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateRoleMenuDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
