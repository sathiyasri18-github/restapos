import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { apiUrl } from '../core/api-config';

export const MENU_CACHE_KEY = 'auth_menu_tree';
const AUTH_USER_KEY = 'auth_user';

interface MenuTreeCache {
  userId: number;
  data: unknown;
}

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

  /** Returns cached menu tree when available; otherwise fetches and caches. */
  loadMyTree(): Observable<any> {
    const cached = this.getCachedMyTree();
    if (cached != null) {
      return of(cached);
    }
    return this.fetchAndCacheMyTree();
  }

  /** Fetches menu tree from API and stores it for the signed-in user. */
  fetchAndCacheMyTree(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tree/me`).pipe(
      tap(tree => this.setCachedMyTree(tree))
    );
  }

  getCachedMyTree(): unknown | null {
    const userId = this.getStoredUserId();
    if (userId == null) return null;

    const raw = localStorage.getItem(MENU_CACHE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as MenuTreeCache;
      if (parsed.userId !== userId) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  setCachedMyTree(data: unknown): void {
    const userId = this.getStoredUserId();
    if (userId == null) return;
    localStorage.setItem(MENU_CACHE_KEY, JSON.stringify({ userId, data } satisfies MenuTreeCache));
  }

  clearMenuCache(): void {
    localStorage.removeItem(MENU_CACHE_KEY);
  }

  private getStoredUserId(): number | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as { userId?: number };
      return user.userId ?? null;
    } catch {
      return null;
    }
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
