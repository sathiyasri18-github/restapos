import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../module/app.module';
import {
  BusinessDashboard,
  BusinessDashboardSummary,
  DailyTrendItem,
  ExpenseCategorySummary,
  ReportsService
} from '../../services/reports.service';

interface KpiCard {
  key: string;
  title: string;
  icon: string;
  tone: string;
  count: number;
  amount: number;
  subtitle?: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [AppModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [MessageService]
})
export class DashboardComponent implements OnInit {
  isLoading = false;
  fromDate: Date | null = null;
  toDate: Date | null = null;
  dashboard: BusinessDashboard | null = null;
  kpiCards: KpiCard[] = [];
  summaryCards: KpiCard[] = [];

  constructor(
    private reportsService: ReportsService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.toDate = today;
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.loadDashboard();
  }

  get dateRangeLabel(): string {
    if (!this.dashboard) return '';
    return `${this.formatDisplayDate(this.dashboard.fromDate)} – ${this.formatDisplayDate(this.dashboard.toDate)}`;
  }

  get dailyTrend(): DailyTrendItem[] {
    return this.dashboard?.dailyTrend ?? [];
  }

  get expenseByCategory(): ExpenseCategorySummary[] {
    return this.dashboard?.expenseByCategory ?? [];
  }

  onDateChange(): void {
    this.loadDashboard();
  }

  onClearDates(): void {
    const today = new Date();
    this.toDate = today;
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.reportsService.getBusinessDashboard({
      fromDate: this.toDateOnly(this.fromDate) ?? undefined,
      toDate: this.toDateOnly(this.toDate) ?? undefined,
    }).subscribe({
      next: (res) => {
        this.dashboard = this.normalizeDashboard(res);
        this.buildKpiCards(this.dashboard.summary);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Dashboard',
          detail: 'Could not load dashboard data.'
        });
      }
    });
  }

  formatMoney(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDisplayDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value.includes('T') ? value : `${value}T00:00:00`);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getBarWidth(amount: number, items: { amount: number }[]): number {
    const max = Math.max(...items.map(i => i.amount), 1);
    return Math.round((amount / max) * 100);
  }

  getDailyNet(row: DailyTrendItem): number {
    return row.salesAmount - row.purchaseAmount - row.expenseAmount;
  }

  goToSales(): void {
    this.router.navigate(['/sale']);
  }

  goToPurchases(): void {
    this.router.navigate(['/product-purchase']);
  }

  goToExpenses(): void {
    this.router.navigate(['/voucher-entry']);
  }

  private buildKpiCards(summary: BusinessDashboardSummary): void {
    this.kpiCards = [
      { key: 'sales', title: 'Sales', icon: 'pi-shopping-bag', tone: 'sales', count: summary.sales.count, amount: summary.sales.amount },
      { key: 'purchases', title: 'Purchases', icon: 'pi-shopping-cart', tone: 'purchases', count: summary.purchases.count, amount: summary.purchases.amount },
      { key: 'salesReturns', title: 'Sales Returns', icon: 'pi-replay', tone: 'returns', count: summary.salesReturns.count, amount: summary.salesReturns.amount },
      { key: 'purchaseReturns', title: 'Purchase Returns', icon: 'pi-undo', tone: 'returns', count: summary.purchaseReturns.count, amount: summary.purchaseReturns.amount },
      { key: 'expenses', title: 'Expenses', icon: 'pi-wallet', tone: 'expenses', count: summary.expenses.count, amount: summary.expenses.amount },
    ];

    this.summaryCards = [
      { key: 'netSales', title: 'Net Sales', icon: 'pi-chart-line', tone: 'net-positive', count: summary.sales.count - summary.salesReturns.count, amount: summary.netSales, subtitle: 'Sales minus sales returns' },
      { key: 'netPurchases', title: 'Net Purchases', icon: 'pi-truck', tone: 'net-neutral', count: summary.purchases.count - summary.purchaseReturns.count, amount: summary.netPurchases, subtitle: 'Purchases minus purchase returns' },
      { key: 'netPosition', title: 'Net Position', icon: 'pi-dollar', tone: summary.netPosition >= 0 ? 'net-positive' : 'net-negative', count: 0, amount: summary.netPosition, subtitle: 'Net sales − net purchases − expenses' },
    ];
  }

  private normalizeDashboard(res: any): BusinessDashboard {
    const summaryRaw = res?.summary ?? res?.Summary ?? {};
    const metric = (obj: any, camel: string, pascal: string) => ({
      count: Number(obj?.[camel]?.count ?? obj?.[camel]?.Count ?? obj?.[pascal]?.Count ?? obj?.[pascal]?.count ?? 0),
      amount: Number(obj?.[camel]?.amount ?? obj?.[camel]?.Amount ?? obj?.[pascal]?.Amount ?? obj?.[pascal]?.amount ?? 0),
    });

    const summary: BusinessDashboardSummary = {
      sales: metric(summaryRaw, 'sales', 'Sales'),
      purchases: metric(summaryRaw, 'purchases', 'Purchases'),
      salesReturns: metric(summaryRaw, 'salesReturns', 'SalesReturns'),
      purchaseReturns: metric(summaryRaw, 'purchaseReturns', 'PurchaseReturns'),
      expenses: metric(summaryRaw, 'expenses', 'Expenses'),
      netSales: Number(summaryRaw.netSales ?? summaryRaw.NetSales ?? 0),
      netPurchases: Number(summaryRaw.netPurchases ?? summaryRaw.NetPurchases ?? 0),
      netPosition: Number(summaryRaw.netPosition ?? summaryRaw.NetPosition ?? 0),
    };

    const dailyRaw = res?.dailyTrend ?? res?.DailyTrend ?? [];
    const dailyTrend: DailyTrendItem[] = dailyRaw.map((d: any) => ({
      date: d.date ?? d.Date ?? '',
      salesAmount: Number(d.salesAmount ?? d.SalesAmount ?? 0),
      salesCount: Number(d.salesCount ?? d.SalesCount ?? 0),
      purchaseAmount: Number(d.purchaseAmount ?? d.PurchaseAmount ?? 0),
      purchaseCount: Number(d.purchaseCount ?? d.PurchaseCount ?? 0),
      expenseAmount: Number(d.expenseAmount ?? d.ExpenseAmount ?? 0),
      expenseCount: Number(d.expenseCount ?? d.ExpenseCount ?? 0),
    }));

    const expenseRaw = res?.expenseByCategory ?? res?.ExpenseByCategory ?? [];
    const expenseByCategory: ExpenseCategorySummary[] = expenseRaw.map((e: any) => ({
      categoryName: e.categoryName ?? e.CategoryName ?? 'Uncategorized',
      count: Number(e.count ?? e.Count ?? 0),
      amount: Number(e.amount ?? e.Amount ?? 0),
    }));

    return {
      fromDate: res?.fromDate ?? res?.FromDate ?? '',
      toDate: res?.toDate ?? res?.ToDate ?? '',
      summary,
      dailyTrend,
      expenseByCategory,
    };
  }

  private toDateOnly(value: Date | null): string | null {
    if (!value) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
