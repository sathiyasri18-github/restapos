import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface AppRole {
  roleId: number;
  roleName: string;
  description: string | null;
  isActive: boolean;
}

export interface RoleMenuPermission {
  menuId: number;
  menuCode: string;
  menuName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface CreateRoleDto {
  roleName: string;
  description: string | null;
  isActive: boolean;
  createdBy: number | null;
}

export interface UpdateRoleDto {
  roleId: number;
  roleName: string;
  description: string | null;
  isActive: boolean;
  modifiedBy: number | null;
}

export interface SetRoleMenusDto {
  menus: {
    menuId: number;
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }[];
  modifiedBy: number | null;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly apiUrl = apiUrl('Roles');

  constructor(private http: HttpClient) {}

  getAll(params: { search?: string; isActive?: boolean; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search) p = p.set('search', params.search);
    if (params.isActive != null) p = p.set('isActive', String(params.isActive));
    p = p.set('pageSize', String(params.pageSize ?? 200));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateRoleDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateRoleDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getMenus(roleId: number): Observable<RoleMenuPermission[]> {
    return this.http.get<RoleMenuPermission[]>(`${this.apiUrl}/${roleId}/menus`);
  }

  setMenus(roleId: number, dto: SetRoleMenusDto): Observable<RoleMenuPermission[]> {
    return this.http.put<RoleMenuPermission[]>(`${this.apiUrl}/${roleId}/menus`, dto);
  }
}
