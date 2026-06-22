import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin, of, Subject, debounceTime, switchMap, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../../common/grid-report';
import { CustomerService } from '../../../services/customer.service';
import {
  CreateProductSaleDto,
  ProductSaleService,
  UpdateProductSaleDto
} from '../../../services/product-sale.service';
import { ProductService } from '../../../services/product.service';
import {
  CreateSaleDto,
  SaleOrder,
  SaleService,
  UpdateSaleDto
} from '../../../services/sale.service';
import { WarehouseService } from '../../../services/warehouse.service';

const DEFAULT_SALE_STATUS = 1;
const DEFAULT_PAYMENT_STATUS = 1;

interface SelectOption<T = number> {
  label: string;
  value: T;
}

interface HeaderFormErrors {
  referenceNo?: string;
  warehouseId?: string;
  customerId?: string;
  userId?: string;
  lines?: string;
}

interface SaleLineRow {
  rowKey: string;
  productSaleId: number;
  productId: number;
  qty: number;
  saleUnitId: number;
  netUnitPrice: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
}

interface HeaderForm {
  saleId: number;
  referenceNo: string;
  userId: number;
  cashRegisterId: number | null;
  customerId: number | null;
  warehouseId: number | null;
  billerId: number | null;
  shippingCost: number | null;
  orderDiscount: number | null;
  paidAmount: number | null;
  saleNote: string;
  staffNote: string;
}

function emptyHeader(): HeaderForm {
  return {
    saleId: 0,
    referenceNo: '',
    userId: 0,
    cashRegisterId: null,
    customerId: null,
    warehouseId: null,
    billerId: null,
    shippingCost: 0,
    orderDiscount: 0,
    paidAmount: 0,
    saleNote: '',
    staffNote: '',
  };
}

function emptyLine(rowKey: string): SaleLineRow {
  return {
    rowKey,
    productSaleId: 0,
    productId: 0,
    qty: 1,
    saleUnitId: 0,
    netUnitPrice: 0,
    discount: 0,
    taxRate: 0,
    tax: 0,
    total: 0,
  };
}

@Component({
  selector: 'app-sale',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class SaleComponent implements OnInit, OnDestroy {
  header = emptyHeader();
  lines: SaleLineRow[] = [];
  selectedLines: SaleLineRow[] = [];
  formErrors: HeaderFormErrors = {};
  isSaving = false;
  isLoading = false;
  isEditMode = false;
  lookupsLoaded = false;

  sales: SaleOrder[] = [];
  filteredSales: SaleOrder[] = [];
  selectedSale: SaleOrder | null = null;
  listLoading = false;
  listSearchTerm = '';
  private listSearch$ = new Subject<void>();

  customerOptions: SelectOption[] = [];
  warehouseOptions: SelectOption[] = [];
  productOptions: SelectOption[] = [];
  private customerMap = new Map<number, string>();
  private warehouseMap = new Map<number, string>();

  private removedLineIds: number[] = [];
  private lineKeyCounter = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private saleService: SaleService,
    private productSaleService: ProductSaleService,
    private customerService: CustomerService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.listSearch$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => this.applyListFilter());
    this.loadLookups(() => {
      this.loadSales();
      this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
        const id = Number(params.get('id') ?? 0);
        if (id > 0) {
          this.openSaleFromList({ saleId: id } as SaleOrder);
        } else {
          this.onNewSale(false);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Sale' : 'New Sale';
  }

  get itemCount(): number {
    return this.validLines.length;
  }

  get totalQty(): number {
    return this.round(this.validLines.reduce((s, l) => s + (l.qty ?? 0), 0));
  }

  get totalPrice(): number {
    return this.round(
      this.validLines.reduce((s, l) => s + (l.qty ?? 0) * (l.netUnitPrice ?? 0), 0)
    );
  }

  get totalTax(): number {
    return this.round(this.validLines.reduce((s, l) => s + (l.tax ?? 0), 0));
  }

  get totalDiscount(): number {
    return this.round(this.validLines.reduce((s, l) => s + (l.discount ?? 0), 0));
  }

  get linesGrandTotal(): number {
    return this.round(this.validLines.reduce((s, l) => s + (l.total ?? 0), 0));
  }

  get grandTotal(): number {
    const shipping = this.header.shippingCost ?? 0;
    const orderDisc = this.header.orderDiscount ?? 0;
    return this.round(this.linesGrandTotal + shipping - orderDisc);
  }

  get validLines(): SaleLineRow[] {
    return this.lines.filter(l => l.productId > 0 && l.qty > 0);
  }

  get hasActiveListFilters(): boolean {
    return !!this.listSearchTerm.trim();
  }

  get saleListReportConfig(): GridReportConfig {
    return {
      title: 'Sale List',
      subtitle: this.hasActiveListFilters ? `Search: ${this.listSearchTerm}` : undefined,
      fileName: 'sales',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Reference No', field: 'referenceNo' },
        { header: 'Customer', field: 'customerId' },
        { header: 'Warehouse', field: 'warehouseId' },
        { header: 'Grand Total', field: 'grandTotal', align: 'right' },
      ],
      rows: this.filteredSales.map(s => ({
        referenceNo: s.referenceNo || '—',
        customerId: this.getCustomerName(s.customerId),
        warehouseId: this.getWarehouseName(s.warehouseId),
        grandTotal: this.formatAmount(s.grandTotal),
      }))
    };
  }

  formatMoney(value: number | null | undefined): string {
    if (value == null) return '0.00';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatAmount(amount: number | null): string {
    if (amount == null) return '—';
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getCustomerName(id: number | null | undefined): string {
    if (id == null || id <= 0) return '—';
    return this.customerMap.get(id) ?? String(id);
  }

  getWarehouseName(id: number | null | undefined): string {
    if (id == null || id <= 0) return '—';
    return this.warehouseMap.get(id) ?? String(id);
  }

  onNewSale(clearRoute = true): void {
    this.isEditMode = false;
    this.selectedSale = null;
    this.resetForm();
    if (clearRoute) {
      this.router.navigate(['/sale'], { replaceUrl: true });
    }
  }

  onCancel(): void {
    this.onNewSale();
  }

  loadSales(): void {
    this.listLoading = true;
    this.saleService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        this.sales = this.extractItems(res).map(x => this.mapSale(x));
        this.applyListFilter();
        this.listLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.listLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load sales.',
        });
      },
    });
  }

  onListSearchChange(): void {
    this.listSearch$.next();
  }

  onClearListSearch(): void {
    this.listSearchTerm = '';
    this.applyListFilter();
  }

  private applyListFilter(): void {
    const term = this.listSearchTerm.trim().toLowerCase();
    this.filteredSales = this.sales.filter(s =>
      !term
      || s.referenceNo.toLowerCase().includes(term)
      || (s.saleNote ?? '').toLowerCase().includes(term));
  }

  openSaleFromList(sale: SaleOrder): void {
    this.selectedSale = sale;
    this.isEditMode = true;
    this.loadSale(sale.saleId);
  }

  onEditSelected(): void {
    if (this.selectedSale) this.openSaleFromList(this.selectedSale);
  }

  confirmDeleteSale(sale: SaleOrder, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Delete sale "<strong>${sale.referenceNo || sale.saleId}</strong>"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.executeDeleteSale(sale),
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedSale) this.confirmDeleteSale(this.selectedSale, event);
  }

  private executeDeleteSale(sale: SaleOrder): void {
    this.saleService.delete(sale.saleId).subscribe({
      next: () => {
        this.sales = this.sales.filter(s => s.saleId !== sale.saleId);
        if (this.selectedSale?.saleId === sale.saleId) {
          this.selectedSale = null;
        }
        if (this.header.saleId === sale.saleId) {
          this.onNewSale();
        }
        this.applyListFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `"${sale.referenceNo || sale.saleId}" was deleted.`,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete sale.',
        });
      },
    });
  }

  private mapSale(x: any): SaleOrder {
    return {
      saleId: Number(x.saleId ?? x.id ?? 0),
      referenceNo: x.referenceNo ?? '',
      userId: Number(x.userId ?? 0),
      cashRegisterId: x.cashRegisterId != null ? Number(x.cashRegisterId) : null,
      customerId: Number(x.customerId ?? 0),
      warehouseId: Number(x.warehouseId ?? 0),
      billerId: x.billerId != null ? Number(x.billerId) : null,
      item: Number(x.item ?? 0),
      totalQty: Number(x.totalQty ?? 0),
      totalDiscount: Number(x.totalDiscount ?? 0),
      totalTax: Number(x.totalTax ?? 0),
      totalPrice: Number(x.totalPrice ?? 0),
      grandTotal: Number(x.grandTotal ?? 0),
      orderTaxRate: x.orderTaxRate != null ? Number(x.orderTaxRate) : null,
      orderTax: x.orderTax != null ? Number(x.orderTax) : null,
      orderDiscount: x.orderDiscount != null ? Number(x.orderDiscount) : null,
      couponId: x.couponId != null ? Number(x.couponId) : null,
      couponDiscount: x.couponDiscount != null ? Number(x.couponDiscount) : null,
      shippingCost: x.shippingCost != null ? Number(x.shippingCost) : null,
      saleStatus: Number(x.saleStatus ?? 0),
      paymentStatus: Number(x.paymentStatus ?? 0),
      document: x.document ?? '',
      paidAmount: x.paidAmount != null ? Number(x.paidAmount) : null,
      saleNote: x.saleNote ?? '',
      staffNote: x.staffNote ?? '',
    };
  }

  addLine(): void {
    this.lines = [...this.lines, emptyLine(this.nextRowKey())];
    this.formErrors.lines = undefined;
  }

  removeSelectedLines(): void {
    if (!this.selectedLines.length) return;
    for (const line of this.selectedLines) {
      if (line.productSaleId > 0) {
        this.removedLineIds.push(line.productSaleId);
      }
    }
    const keys = new Set(this.selectedLines.map(l => l.rowKey));
    this.lines = this.lines.filter(l => !keys.has(l.rowKey));
    this.selectedLines = [];
    this.formErrors.lines = undefined;
  }

  onLineChange(line: SaleLineRow): void {
    this.recalcLine(line);
    this.formErrors.lines = undefined;
  }

  onProductSelect(line: SaleLineRow, productId: number): void {
    line.productId = productId ?? 0;
    if (!productId) {
      this.onLineChange(line);
      return;
    }

    this.productService.getById(productId).subscribe({
      next: (res: any) => {
        const p = res?.data ?? res;
        if (p?.saleProductCost != null) {
          line.netUnitPrice = Number(p.saleProductCost);
        } else if (p?.purchaseProductCost != null) {
          line.netUnitPrice = Number(p.purchaseProductCost);
        }
        if (p?.unit != null) {
          line.saleUnitId = Number(p.unit);
        }
        if (p?.gst != null) {
          line.taxRate = Number(p.gst);
        }
        this.recalcLine(line);
        this.cdr.detectChanges();
      },
    });
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    const totals = this.buildHeaderTotals();
    if (this.isEditMode) {
      this.saveEdit(totals);
    } else {
      this.saveAdd(totals);
    }
  }

  private loadLookups(onReady?: () => void): void {
    forkJoin({
      customers: this.customerService.getAll({ pageSize: 500 }),
      warehouses: this.warehouseService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ customers, warehouses, products }) => {
        this.customerOptions = this.mapOptions(customers, 'customerId', 'name');
        this.warehouseOptions = this.mapOptions(warehouses, 'warehouseId', 'name');
        this.productOptions = this.mapOptions(products, 'productId', 'name', 'productName');
        this.customerMap = new Map(this.customerOptions.map(o => [o.value, o.label]));
        this.warehouseMap = new Map(this.warehouseOptions.map(o => [o.value, o.label]));
        this.lookupsLoaded = true;
        onReady?.();
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Lookups',
          detail: 'Could not load dropdown data.',
        });
        onReady?.();
      },
    });
  }

  private loadSale(id: number): void {
    this.isLoading = true;
    this.removedLineIds = [];

    forkJoin({
      sale: this.saleService.getById(id),
      lines: this.productSaleService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ sale, lines }) => {
        const s = sale?.data ?? sale;
        this.header = this.mapHeader(s);
        const allLines = this.extractItems(lines);
        this.lines = allLines
          .filter((x: any) => Number(x.saleId ?? 0) === id)
          .map((x: any) => this.mapLineRow(x));
        if (!this.lines.length) {
          this.addLine();
        }
        const match = this.sales.find(s => s.saleId === id);
        if (match) this.selectedSale = match;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load sale.',
        });
      },
    });
  }

  private resetForm(): void {
    this.header = emptyHeader();
    this.lines = [emptyLine(this.nextRowKey())];
    this.selectedLines = [];
    this.removedLineIds = [];
    this.formErrors = {};
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.header.referenceNo?.trim()) {
      this.formErrors.referenceNo = 'Reference number is required';
    }
    if (!this.header.warehouseId || this.header.warehouseId <= 0) {
      this.formErrors.warehouseId = 'Warehouse is required';
    }
    if (!this.header.customerId || this.header.customerId <= 0) {
      this.formErrors.customerId = 'Customer is required';
    }
    if (!this.header.userId || this.header.userId <= 0) {
      this.formErrors.userId = 'User ID is required';
    }
    if (!this.validLines.length) {
      this.formErrors.lines = 'Add at least one line with product and quantity';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  private buildHeaderTotals() {
    return {
      item: this.itemCount,
      totalQty: this.totalQty,
      totalDiscount: this.totalDiscount,
      totalTax: this.totalTax,
      totalPrice: this.totalPrice,
      grandTotal: this.grandTotal,
    };
  }

  private saveAdd(totals: ReturnType<typeof this.buildHeaderTotals>): void {
    this.saleService.create(this.toCreateDto(totals)).pipe(
      switchMap((res: any) => {
        const saleId = this.extractSaleId(res);
        if (!saleId) throw new Error('Missing sale id');
        const creates = this.validLines.map(line =>
          this.productSaleService.create(this.toCreateLineDto(line, saleId))
        );
        return creates.length ? forkJoin(creates) : of([]);
      })
    ).subscribe({
      next: () => this.onSaveSuccess('Sale created successfully.'),
      error: () => this.onSaveError('Could not create sale.'),
    });
  }

  private saveEdit(totals: ReturnType<typeof this.buildHeaderTotals>): void {
    const saleId = this.header.saleId;

    this.saleService.update(saleId, this.toUpdateDto(totals)).pipe(
      switchMap(() => {
        const ops = [
          ...this.removedLineIds.map(id => this.productSaleService.delete(id)),
          ...this.lines
            .filter(l => l.productSaleId > 0 && l.productId > 0 && l.qty > 0)
            .map(l => this.productSaleService.update(
              l.productSaleId,
              this.toUpdateLineDto(l, saleId)
            )),
          ...this.lines
            .filter(l => l.productSaleId === 0 && l.productId > 0 && l.qty > 0)
            .map(l => this.productSaleService.create(this.toCreateLineDto(l, saleId))),
        ];
        return ops.length ? forkJoin(ops) : of([]);
      })
    ).subscribe({
      next: () => this.onSaveSuccess('Sale updated successfully.'),
      error: () => this.onSaveError('Could not update sale.'),
    });
  }

  private toCreateDto(totals: ReturnType<typeof this.buildHeaderTotals>): CreateSaleDto {
    return {
      referenceNo: this.header.referenceNo.trim(),
      userId: this.header.userId,
      cashRegisterId: this.header.cashRegisterId,
      customerId: this.header.customerId!,
      warehouseId: this.header.warehouseId!,
      billerId: this.header.billerId,
      item: totals.item,
      totalQty: totals.totalQty,
      totalDiscount: totals.totalDiscount,
      totalTax: totals.totalTax,
      totalPrice: totals.totalPrice,
      grandTotal: totals.grandTotal,
      orderTaxRate: null,
      orderTax: null,
      orderDiscount: this.header.orderDiscount ?? 0,
      couponId: null,
      couponDiscount: null,
      shippingCost: this.header.shippingCost ?? 0,
      saleStatus: DEFAULT_SALE_STATUS,
      paymentStatus: DEFAULT_PAYMENT_STATUS,
      document: null,
      paidAmount: this.header.paidAmount ?? 0,
      saleNote: this.header.saleNote?.trim() || null,
      staffNote: this.header.staffNote?.trim() || null,
    };
  }

  private toUpdateDto(totals: ReturnType<typeof this.buildHeaderTotals>): UpdateSaleDto {
    return { ...this.toCreateDto(totals), id: this.header.saleId };
  }

  private toCreateLineDto(line: SaleLineRow, saleId: number): CreateProductSaleDto {
    this.recalcLine(line);
    return {
      saleId,
      productId: line.productId,
      productBatchId: null,
      variantId: null,
      imeiNumber: null,
      qty: line.qty,
      saleUnitId: line.saleUnitId,
      netUnitPrice: line.netUnitPrice,
      discount: line.discount ?? 0,
      taxRate: line.taxRate ?? 0,
      tax: line.tax ?? 0,
      total: line.total ?? 0,
    };
  }

  private toUpdateLineDto(line: SaleLineRow, saleId: number): UpdateProductSaleDto {
    return { ...this.toCreateLineDto(line, saleId), id: line.productSaleId };
  }

  private recalcLine(line: SaleLineRow): void {
    const subtotal = (line.qty ?? 0) * (line.netUnitPrice ?? 0) - (line.discount ?? 0);
    line.tax = this.round(Math.max(0, subtotal) * (line.taxRate ?? 0) / 100);
    line.total = this.round(Math.max(0, subtotal) + line.tax);
  }

  private mapHeader(x: any): HeaderForm {
    const warehouseId = Number(x.warehouseId ?? 0);
    const customerId = Number(x.customerId ?? 0);
    return {
      saleId: Number(x.saleId ?? x.id ?? 0),
      referenceNo: x.referenceNo ?? '',
      userId: Number(x.userId ?? 0),
      cashRegisterId: x.cashRegisterId != null ? Number(x.cashRegisterId) : null,
      customerId: customerId > 0 ? customerId : null,
      warehouseId: warehouseId > 0 ? warehouseId : null,
      billerId: x.billerId != null ? Number(x.billerId) : null,
      shippingCost: x.shippingCost != null ? Number(x.shippingCost) : 0,
      orderDiscount: x.orderDiscount != null ? Number(x.orderDiscount) : 0,
      paidAmount: x.paidAmount != null ? Number(x.paidAmount) : 0,
      saleNote: x.saleNote ?? '',
      staffNote: x.staffNote ?? '',
    };
  }

  private mapLineRow(x: any): SaleLineRow {
    const row: SaleLineRow = {
      rowKey: this.nextRowKey(),
      productSaleId: Number(x.productSaleId ?? x.id ?? 0),
      productId: Number(x.productId ?? 0),
      qty: Number(x.qty ?? 0),
      saleUnitId: Number(x.saleUnitId ?? 0),
      netUnitPrice: Number(x.netUnitPrice ?? 0),
      discount: Number(x.discount ?? 0),
      taxRate: Number(x.taxRate ?? 0),
      tax: Number(x.tax ?? 0),
      total: Number(x.total ?? 0),
    };
    this.recalcLine(row);
    return row;
  }

  private mapOptions(res: any, idKey: string, ...nameKeys: string[]): SelectOption[] {
    return this.extractItems(res)
      .map((x: any) => {
        const id = Number(x[idKey] ?? x.id ?? 0);
        const name = nameKeys.map(k => x[k]).find(v => v != null && v !== '') ?? `#${id}`;
        return { label: String(name), value: id };
      })
      .filter(option => option.value > 0);
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private extractSaleId(res: any): number {
    const data = res?.data ?? res;
    return Number(data?.saleId ?? data?.id ?? 0);
  }

  private nextRowKey(): string {
    this.lineKeyCounter += 1;
    return `line-${this.lineKeyCounter}`;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private onSaveSuccess(detail: string): void {
    this.isSaving = false;
    this.messageService.add({ severity: 'success', summary: 'Saved', detail });
    this.loadSales();
    this.onNewSale();
  }

  private onSaveError(detail: string): void {
    this.isSaving = false;
    this.messageService.add({ severity: 'error', summary: 'Save Failed', detail });
  }
}
