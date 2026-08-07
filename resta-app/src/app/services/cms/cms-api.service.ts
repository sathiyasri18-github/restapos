import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { cmsApiUrl } from '../../core/api-config';

export interface ApiResponse<T> {
  success?: boolean;
  Success?: boolean;
  data?: T;
  Data?: T;
  message?: string;
  Message?: string;
}

function unwrap<T>(r: ApiResponse<T> | T): T {
  if (r != null && typeof r === 'object' && ('success' in (r as object) || 'Success' in (r as object) || 'data' in (r as object) || 'Data' in (r as object))) {
    const body = r as ApiResponse<T>;
    const ok = body.success ?? body.Success;
    const data = (body.data ?? body.Data) as T;
    if (ok === false) {
      throw new Error(body.message || body.Message || 'Request failed');
    }
    return data;
  }
  return r as T;
}

@Injectable({ providedIn: 'root' })
export class CmsApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(cmsApiUrl(path))
      .pipe(map(r => unwrap(r)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(cmsApiUrl(path), body)
      .pipe(map(r => unwrap(r)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(cmsApiUrl(path), body)
      .pipe(map(r => unwrap(r)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(cmsApiUrl(path))
      .pipe(map(r => unwrap(r)));
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(cmsApiUrl(path), body)
      .pipe(map(r => unwrap(r)));
  }

  /** Upload a file to POST api/admin/upload/{folder}; returns the stored URL/path. */
  upload(folder: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http
      .post<ApiResponse<string>>(cmsApiUrl(`upload/${folder}`), formData)
      .pipe(
        map(r => {
          const path = unwrap(r);
          if (!path || typeof path !== 'string') {
            throw new Error((r as ApiResponse<string>)?.message || (r as ApiResponse<string>)?.Message || 'Upload failed');
          }
          return path;
        })
      );
  }
}
