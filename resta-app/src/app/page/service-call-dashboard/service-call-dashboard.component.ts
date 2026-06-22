import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { CategoryService } from '../../services/category.service';
import { CustomerService } from '../../services/customer.service';
import { EmployeeService } from '../../services/employee.service';
import {
  DashboardCountItem,
  ReportsService,
  ServiceCallDashboard,
  ServiceCallDashboardCharts
} from '../../services/reports.service';
import { ServiceCall } from '../../services/service-call.service';

@Component({
  selector: 'app-service-call-dashboard',
  imports: [AppModule],
  templateUrl: './service-call-dashboard.component.html',
  styleUrls: ['./service-call-dashboard.component.scss'],
  providers: [MessageService]
})
export class ServiceCallDashboardComponent implements OnInit {

  isLoading = false;
  lookupsLoading = false;
  fromDate: Date | null = null;
  toDate: Date | null = null;
  charts: ServiceCallDashboardCharts | null = null;
  serviceCalls: ServiceCall[] = [];
  selectedServiceCall: ServiceCall | null = null;

  private customerMap = new Map<number, string>();
  private employeeMap = new Map<number, string>();
  private categoryMap = new Map<number, string>();

  constructor(
    private reportsService: ReportsService,
    private customerService: CustomerService,
    private employeeService: EmployeeService,
    private categoryService: CategoryService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.toDate = today;
    this.fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.loadLookups();
    this.loadDashboard();
  }

  get totalCalls(): number {
    return this.serviceCalls.length;
  }

  formatDate(value: Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getCustomerName(id: number): string {
    return this.customerMap.get(id) ?? '—';
  }

  getCategoryName(id: number | null | undefined): string {
    if (id == null) return '—';
    return this.categoryMap.get(id) ?? '—';
  }

  getServiceTypeName(id: number): string {
    return this.getCategoryName(id);
  }

  getActionTakenName(id: number | null): string {
    return this.getCategoryName(id);
  }

  getStatusName(id: number): string {
    return this.getCategoryName(id);
  }

  getPriorityName(id: number | null): string {
    return this.getCategoryName(id);
  }

  getEmployeeName(id: number | null): string {
    if (id == null) return '—';
    return this.employeeMap.get(id) ?? '—';
  }

  getStatusClass(statusId: number): string {
    const s = (this.getStatusName(statusId) ?? '').toUpperCase();
    if (s.includes('COMPLETE')) return 'completed';
    if (s.includes('PEND')) return 'pending';
    if (s.includes('CANCEL')) return 'cancelled';
    return 'other';
  }

  getChartMax(items: DashboardCountItem[]): number {
    if (!items?.length) return 1;
    return Math.max(...items.map(i => i.count), 1);
  }

  getBarWidth(item: DashboardCountItem, items: DashboardCountItem[]): number {
    const max = this.getChartMax(items);
    return Math.round((item.count / max) * 100);
  }

  onDateChange(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.reportsService.getServiceCallDashboard({
      fromDate: this.toDateOnly(this.fromDate) ?? undefined,
      toDate:   this.toDateOnly(this.toDate) ?? undefined,
    }).subscribe({
      next: (res) => {
        const dashboard = this.normalizeDashboard(res);
        this.charts = dashboard.charts;
        this.serviceCalls = dashboard.serviceCalls;
        this.selectedServiceCall = null;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Dashboard',
          detail: 'Could not load service call dashboard.'
        });
      }
    });
  }

  goToServiceCalls(): void {
    this.router.navigate(['/service-call']);
  }

  private loadLookups(): void {
    this.lookupsLoading = true;
    forkJoin({
      customers: this.customerService.getAll({ pageSize: 500 }),
      employees: this.employeeService.getAll({ isActive: true, pageSize: 500 }),
      categories: this.categoryService.getAll({ pageSize: 2000 }),
    }).subscribe({
      next: ({ customers, employees, categories }) => {
        this.bindCustomers(customers);
        this.bindEmployees(employees);
        this.bindCategories(categories);
        this.lookupsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.lookupsLoading = false;
      }
    });
  }

  private bindCustomers(res: any): void {
    const list = this.extractItems(res);
    this.customerMap.clear();
    list.forEach((c: any) => {
      const id = c.customerId ?? c.id ?? 0;
      this.customerMap.set(id, c.name ?? c.customerName ?? '');
    });
  }

  private bindEmployees(res: any): void {
    const list = this.extractItems(res);
    this.employeeMap.clear();
    list.forEach((e: any) => {
      const id = e.employeeId ?? e.id ?? 0;
      this.employeeMap.set(id, e.employeeName ?? e.name ?? '');
    });
  }

  private bindCategories(res: any): void {
    const list = this.extractItems(res);
    this.categoryMap.clear();
    list.forEach((x: any) => {
      const id = x.categoryId ?? x.id ?? 0;
      const name = x.categoryName ?? '';
      if (id) this.categoryMap.set(id, name);
    });
  }

  private normalizeDashboard(res: any): ServiceCallDashboard {
    const charts = res?.charts ?? res?.Charts ?? {};
    const mapItems = (items: any[]): DashboardCountItem[] =>
      (items ?? []).map(i => ({
        label: i.label ?? i.Label ?? '',
        count: Number(i.count ?? i.Count ?? 0),
      }));

    return {
      charts: {
        serviceType:      mapItems(charts.serviceType ?? charts.ServiceType),
        status:           mapItems(charts.status ?? charts.Status),
        priority:         mapItems(charts.priority ?? charts.Priority),
        actionTaken:      mapItems(charts.actionTaken ?? charts.ActionTaken),
        assignedEngineer: mapItems(charts.assignedEngineer ?? charts.AssignedEngineer),
      },
      serviceCalls: (res?.serviceCalls ?? res?.ServiceCalls ?? [])
        .map((x: any) => this.mapServiceCall(x)),
    };
  }

  private mapServiceCall(x: any): ServiceCall {
    return {
      serviceCallId:      Number(x.serviceCallId ?? x.id ?? 0),
      customerId:         Number(x.customerId ?? 0),
      serviceTypeId:      Number(x.serviceTypeId ?? 0),
      problemReport:      x.problemReport ?? '',
      actionTakenId:      x.actionTakenId != null ? Number(x.actionTakenId) : null,
      assignedEngineerId: x.assignedEngineerId != null ? Number(x.assignedEngineerId) : null,
      chiefEngineerId:    x.chiefEngineerId != null ? Number(x.chiefEngineerId) : null,
      serviceDate:        x.serviceDate ? this.parseDate(x.serviceDate) : null,
      dueDate:            x.dueDate ? this.parseDate(x.dueDate) : null,
      completedDate:      x.completedDate ? this.parseDate(x.completedDate) : null,
      statusId:           Number(x.statusId ?? 0),
      priorityId:         x.priorityId != null ? Number(x.priorityId) : null,
      remarks:            x.remarks ?? '',
    };
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private parseDate(value: string | Date): Date {
    if (value instanceof Date) return value;
    const parts = String(value).split('T')[0].split('-');
    if (parts.length === 3) return new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return new Date(value);
  }

  private toDateOnly(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
