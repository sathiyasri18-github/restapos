import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface DashboardMetric {
  count: number;
  amount: number;
}

export interface BusinessDashboardSummary {
  sales: DashboardMetric;
  purchases: DashboardMetric;
  salesReturns: DashboardMetric;
  purchaseReturns: DashboardMetric;
  expenses: DashboardMetric;
  netSales: number;
  netPurchases: number;
  netPosition: number;
}

export interface DailyTrendItem {
  date: string;
  salesAmount: number;
  salesCount: number;
  purchaseAmount: number;
  purchaseCount: number;
  expenseAmount: number;
  expenseCount: number;
}

export interface ExpenseCategorySummary {
  categoryName: string;
  count: number;
  amount: number;
}

export interface BusinessDashboard {
  fromDate: string;
  toDate: string;
  summary: BusinessDashboardSummary;
  dailyTrend: DailyTrendItem[];
  expenseByCategory: ExpenseCategorySummary[];
}

export interface BusinessDashboardParams {
  fromDate?: string;
  toDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly apiUrl = apiUrl('Reports');

  constructor(private http: HttpClient) {}

  getBusinessDashboard(params: BusinessDashboardParams = {}): Observable<BusinessDashboard> {
    let p = new HttpParams();
    if (params.fromDate) p = p.set('fromDate', params.fromDate);
    if (params.toDate) p = p.set('toDate', params.toDate);
    return this.http.get<any>(`${this.apiUrl}/business-dashboard`, { params: p });
  }
}
