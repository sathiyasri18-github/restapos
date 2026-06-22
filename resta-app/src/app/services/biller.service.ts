import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface Biller {
  billerId: number;
  name: string;
  image: string | null;
  companyName: string;
  vatNumber: string | null;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  isActive: boolean;
}

export interface BillerListParams {
  pageNumber?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class BillerService {
  private readonly apiUrl = apiUrl('Biller');

  constructor(private http: HttpClient) {}

  getAll(params: BillerListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.pageNumber) p = p.set('pageNumber', String(params.pageNumber));
    if (params.pageSize) p = p.set('pageSize', String(params.pageSize));
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
