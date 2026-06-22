import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';
import { ServiceCall } from './service-call.service';

export interface DashboardCountItem {
  label: string;
  count: number;
}

export interface ServiceCallDashboardCharts {
  serviceType:       DashboardCountItem[];
  status:            DashboardCountItem[];
  priority:          DashboardCountItem[];
  actionTaken:       DashboardCountItem[];
  assignedEngineer:  DashboardCountItem[];
}

export interface ServiceCallDashboard {
  charts:       ServiceCallDashboardCharts;
  serviceCalls: ServiceCall[];
}

export interface ServiceCallDashboardParams {
  fromDate?: string;
  toDate?:   string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly apiUrl = apiUrl('Reports');

  constructor(private http: HttpClient) {}

  getServiceCallDashboard(params: ServiceCallDashboardParams = {}): Observable<ServiceCallDashboard> {
    let p = new HttpParams();
    if (params.fromDate) p = p.set('fromDate', params.fromDate);
    if (params.toDate)   p = p.set('toDate', params.toDate);
    return this.http.get<ServiceCallDashboard>(`${this.apiUrl}/service-calls/dashboard`, { params: p });
  }
}
