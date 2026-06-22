import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface UserRoleEntry {
  userId: number;
  userName: string;
  displayName: string;
  roleId: number;
  roleName: string;
  rowKey: string;
}

export interface AssignUserRolesDto {
  userId: number;
  roleIds: number[];
  modifiedBy: number | null;
}

@Injectable({ providedIn: 'root' })
export class UserRoleService {
  private readonly apiUrl = apiUrl('UserRole');

  constructor(private http: HttpClient) {}

  getAll(params: { userId?: number; roleId?: number; pageSize?: number } = {}): Observable<any> {
    let p = new HttpParams().set('pageSize', String(params.pageSize ?? 500));
    if (params.userId != null) p = p.set('userId', String(params.userId));
    if (params.roleId != null) p = p.set('roleId', String(params.roleId));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getByUser(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`);
  }

  assign(dto: AssignUserRolesDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/assign`, dto);
  }

  remove(userId: number, roleId: number): Observable<any> {
    const p = new HttpParams().set('userId', String(userId)).set('roleId', String(roleId));
    return this.http.delete<any>(this.apiUrl, { params: p });
  }
}
