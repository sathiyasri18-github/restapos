import { Injectable, InjectionToken, inject } from '@angular/core';
import { environment, Environment } from '../../environments/environment';

/** Injection token for environment values (provided in app.config.ts). */
export const ENVIRONMENT = new InjectionToken<Environment>('ENVIRONMENT');

/**
 * Build a versioned API URL for a controller, e.g. apiUrl('Customers') → …/api/v1/Customers
 */
export function apiUrl(controller: string): string {
  const base = environment.apiBaseUrl.replace(/\/$/, '');
  const path = controller.replace(/^\//, '');
  return `${base}/api/${environment.apiVersion}/${path}`;
}

/** Resolve a relative upload path (e.g. uploads/products/...) to a full URL. */
export function apiAssetUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const value = path.trim();
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }
  const base = environment.apiBaseUrl.replace(/\/$/, '');
  return `${base}/${value.replace(/^\//, '')}`;
}

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  readonly env = inject(ENVIRONMENT);

  endpoint(controller: string): string {
    return apiUrl(controller);
  }
}
