import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { debounceTime, forkJoin, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { apiUrl } from '../../../core/api-config';
import { AuthService } from '../../../services/auth.service';
import { CustomerService } from '../../../services/customer.service';
import {
  CreateProductReturnDto,
  ProductReturnService,
  UpdateProductReturnDto
} from '../../../services/product-return.service';
import { ProductSaleService } from '../../../services/product-sale.service';
import { ProductService } from '../../../services/product.service';
import {
  CreateSaleReturnDto,
  SaleReturnOrder,
  SaleReturnService,
  UpdateSaleReturnDto
} from '../../../services/sale-return.service';
import { SaleOrder, SaleService } from '../../../services/sale.service';
import { WarehouseService } from '../../../services/warehouse.service';

interface SelectOption<T = number> {
  label: string;
  value: T;
}

interface HeaderForm {
  saleReturnId: number;
  referenceNo: string;
  customerId: number;
  warehouseId: number;
  userId: number;
  billerId: number;
  accountId: number;
  cashRegisterId: number | null;
  orderTaxRate: number | null;
  orderTax: number | null;
  returnNote: string;
  staffNote: string;
  document: string;
}

interface LineRow {
  rowKey: number;
  productReturnId: number;
  returnId: number;
  productId: number;
  productName: string;
  sourceProductSaleId: number;
  soldQty: number;
  qty: number;
  saleUnitId: number;
  netUnitPrice: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
}

interface SourceSaleLine {
  productSaleId: number;
  productId: number;
  productName: string;
  qty: number;
  saleUnitId: number;
  netUnitPrice: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
}

interface HeaderFormErrors {
  referenceNo?: string;
  warehouseId?: string;
  customerId?: string;
  userId?: string;
  billerId?: string;
  accountId?: string;
  lines?: string;
}

function emptyHeader(): HeaderForm {
  return {
    saleReturnId: 0,
    referenceNo: '',
    customerId: 0,
    warehouseId: 0,
    userId: 0,
    billerId: 0,
    accountId: 0,
    cashRegisterId: null,
    orderTaxRate: null,
    orderTax: null,
    returnNote: '',
    staffNote: '',
    document: '',
  };
}

function emptyLine(returnId = 0, rowKey = 0): LineRow {
  return {
    rowKey,
    productReturnId: 0,
    returnId,
    productId: 0,
    productName: '',
    sourceProductSaleId: 0,
    soldQty: 0,
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
  selector: 'app-return-sale',
  imports: [AppModule],
  templateUrl: './return-sale.component.html',
  styleUrls: ['./return-sale.component.scss'],
  providers: [MessageService],
})
export class ReturnSaleComponent implements OnInit, OnDestroy {
  header = emptyHeader();
  lines: LineRow[] = [];
  selectedLines: LineRow[] = [];
  formErrors: HeaderFormErrors = {};

  customerOptions: SelectOption[] = [];
  warehouseOptions: SelectOption[] = [];
  productOptions: SelectOption[] = [];
  private customerMap = new Map<number, string>();
  private warehouseMap = new Map<number, string>();
  private productMap = new Map<number, string>();

  sourceSale: SaleOrder | null = null;
  sourceSaleLines: SourceSaleLine[] = [];

  detailsDialogVisible = false;
  saleDialogVisible = false;
  saleReturnSearchVisible = false;

  sales: SaleOrder[] = [];
  filteredSales: SaleOrder[] = [];
  selectedSaleInDialog: SaleOrder | null = null;
  saleSearchTerm = '';
  saleListLoading = false;
  private saleSearch$ = new Subject<void>();

  saleReturns: SaleReturnOrder[] = [];
  filteredSaleReturns: SaleReturnOrder[] = [];
  selectedSaleReturnInDialog: SaleReturnOrder | null = null;
  saleReturnSearchTerm = '';
  saleReturnListLoading = false;
  private saleReturnSearch$ = new Subject<void>();

  isEditMode = false;
  isLoading = false;
  isSaving = false;
  lookupsLoaded = false;

  private nextRowKey = 1;
  private removedLineIds: number[] = [];
  private defaultAccountId = 1;
  private destroy$ = new Subject<void>();

  constructor(
    private saleReturnService: SaleReturnService,
    private productReturnService: ProductReturnService,
    private saleService: SaleService,
    private productSaleService: ProductSaleService,
    private customerService: CustomerService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private authService: AuthService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.saleSearch$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.applySaleFilter());
    this.saleReturnSearch$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.applySaleReturnFilter());

    this.loadLookups();
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = Number(params.get('id') ?? 0);
      if (id > 0) {
        this.isEditMode = true;
        this.loadReturnSale(id);
      } else {
        this.isEditMode = false;
        this.resetForm();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Sales Return' : 'Sales Return';
  }

  get validLines(): LineRow[] {
    return this.lines.filter(l => l.productId > 0 && l.qty > 0);
  }

  get itemCount(): number {
    return this.validLines.length;
  }

  get totalQty(): number {
    return this.roundMoney(this.validLines.reduce((s, l) => s + (l.qty ?? 0), 0));
  }

  get totalPrice(): number {
    return this.roundMoney(
      this.validLines.reduce((s, l) => s + (l.qty ?? 0) * (l.netUnitPrice ?? 0), 0)
    );
  }

  get totalDiscount(): number {
    return this.roundMoney(this.validLines.reduce((s, l) => s + (l.discount ?? 0), 0));
  }

  get lineTaxTotal(): number {
    return this.roundMoney(this.validLines.reduce((s, l) => s + (l.tax ?? 0), 0));
  }

  get totalTax(): number {
    return this.roundMoney(this.lineTaxTotal + (this.header.orderTax ?? 0));
  }

  get grandTotal(): number {
    return this.roundMoney(this.validLines.reduce((s, l) => s + (l.total ?? 0), 0) + (this.header.orderTax ?? 0));
  }

  get hasSaleSearch(): boolean {
    return !!this.saleSearchTerm.trim();
  }

  get hasSaleReturnSearch(): boolean {
    return !!this.saleReturnSearchTerm.trim();
  }

  formatMoney(value: number | null | undefined): string {
    if (value == null) return '0.00';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getCustomerName(id: number | null | undefined): string {
    if (id == null || id <= 0) return '—';
    return this.customerMap.get(id) ?? String(id);
  }

  getWarehouseName(id: number | null | undefined): string {
    if (id == null || id <= 0) return '—';
    return this.warehouseMap.get(id) ?? String(id);
  }

  getProductName(productId: number): string {
    if (!productId) return '—';
    return this.productMap.get(productId) ?? `Product #${productId}`;
  }

  openDetailsDialog(): void {
    this.detailsDialogVisible = true;
  }

  openSaleDialog(): void {
    this.saleDialogVisible = true;
    this.selectedSaleInDialog = this.sourceSale;
    if (!this.sales.length) {
      this.loadSales();
    } else {
      this.applySaleFilter();
    }
  }

  openSaleReturnSearch(): void {
    this.saleReturnSearchVisible = true;
    this.selectedSaleReturnInDialog = null;
    if (!this.saleReturns.length) {
      this.loadSaleReturns();
    } else {
      this.applySaleReturnFilter();
    }
  }

  onSaleSearchChange(): void {
    this.saleSearch$.next();
  }

  onClearSaleSearch(): void {
    this.saleSearchTerm = '';
    this.applySaleFilter();
  }

  onSaleReturnSearchChange(): void {
    this.saleReturnSearch$.next();
  }

  onClearSaleReturnSearch(): void {
    this.saleReturnSearchTerm = '';
    this.applySaleReturnFilter();
  }

  confirmSaleSelection(): void {
    if (!this.selectedSaleInDialog) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Sale',
        detail: 'Please select a sale from the list.',
      });
      return;
    }
    this.bindSaleForReturn(this.selectedSaleInDialog.saleId);
    this.saleDialogVisible = false;
  }

  confirmSaleReturnSelection(): void {
    if (!this.selectedSaleReturnInDialog) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Return',
        detail: 'Please select a sales return from the list.',
      });
      return;
    }
    const id = this.selectedSaleReturnInDialog.saleReturnId;
    this.saleReturnSearchVisible = false;
    this.isEditMode = true;
    this.router.navigate([], { queryParams: { id }, replaceUrl: true });
    this.loadReturnSale(id);
  }

  onNewReturn(): void {
    this.isEditMode = false;
    this.router.navigate(['/return-sale'], { replaceUrl: true });
    this.resetForm();
  }

  removeSelectedLines(): void {
    if (!this.selectedLines.length) return;
    for (const line of this.selectedLines) {
      if (line.productReturnId > 0) {
        this.removedLineIds.push(line.productReturnId);
      }
    }
    const keys = new Set(this.selectedLines.map(l => l.rowKey));
    this.lines = this.lines.filter(l => !keys.has(l.rowKey));
    this.selectedLines = [];
    this.formErrors.lines = undefined;
  }

  onLineFieldChange(line: LineRow): void {
    if (line.soldQty > 0 && line.qty > line.soldQty) {
      line.qty = line.soldQty;
    }
    if (line.qty < 0) {
      line.qty = 0;
    }
    this.recalcLine(line);
    this.formErrors.lines = undefined;
  }

  onOrderTaxRateChange(): void {
    if (this.header.orderTaxRate != null && this.header.orderTaxRate > 0) {
      const base = this.validLines.reduce((s, l) => s + (l.total ?? 0), 0);
      this.header.orderTax = this.roundMoney(base * this.header.orderTaxRate / 100);
    }
  }

  onSave(): void {
    this.applyHeaderDefaults();
    if (!this.validate()) {
      this.notifyValidationErrors();
      return;
    }
    this.isSaving = true;
    const dto = this.buildHeaderDto();
    if (this.isEditMode) {
      this.saveEdit(dto);
    } else {
      this.saveAdd(dto);
    }
  }

  private loadSales(): void {
    this.saleListLoading = true;
    this.saleService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        this.sales = this.extractItems(res).map(x => this.mapSale(x));
        this.applySaleFilter();
        this.saleListLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.saleListLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load sales.',
        });
      },
    });
  }

  private loadSaleReturns(): void {
    this.saleReturnListLoading = true;
    this.saleReturnService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        this.saleReturns = this.extractItems(res).map(x => this.mapSaleReturn(x));
        this.applySaleReturnFilter();
        this.saleReturnListLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.saleReturnListLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load sales returns.',
        });
      },
    });
  }

  private applySaleFilter(): void {
    const term = this.saleSearchTerm.trim().toLowerCase();
    this.filteredSales = this.sales.filter(s =>
      !term
      || s.referenceNo.toLowerCase().includes(term)
      || (s.saleNote ?? '').toLowerCase().includes(term)
      || String(s.saleId).includes(term)
      || this.getCustomerName(s.customerId).toLowerCase().includes(term));
  }

  private applySaleReturnFilter(): void {
    const term = this.saleReturnSearchTerm.trim().toLowerCase();
    this.filteredSaleReturns = this.saleReturns.filter(r =>
      !term
      || r.referenceNo.toLowerCase().includes(term)
      || (r.returnNote ?? '').toLowerCase().includes(term)
      || String(r.saleReturnId).includes(term)
      || this.getCustomerName(r.customerId).toLowerCase().includes(term));
  }

  private bindSaleForReturn(saleId: number): void {
    this.isLoading = true;
    forkJoin({
      sale: this.saleService.getById(saleId),
      lines: this.productSaleService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ sale, lines, products }) => {
        this.buildProductMap(products);
        const s = sale?.data ?? sale;
        const saleOrder = this.mapSale(s);
        this.sourceSale = saleOrder;
        this.header.customerId = saleOrder.customerId;
        this.header.warehouseId = saleOrder.warehouseId;
        this.header.userId = saleOrder.userId || this.header.userId;
        const billerId = Number(saleOrder.billerId ?? 0);
        this.header.billerId = billerId > 0 ? billerId : this.header.billerId;
        this.applyHeaderDefaults();
        this.header.cashRegisterId = saleOrder.cashRegisterId;
        this.header.orderTaxRate = saleOrder.orderTaxRate;
        this.header.orderTax = saleOrder.orderTax;

        this.sourceSaleLines = this.extractItems(lines)
          .filter((x: any) => Number(x.saleId ?? 0) === saleId)
          .map((x: any) => {
            const productId = Number(x.productId ?? 0);
            const qty = Number(x.qty ?? 0);
            return {
              productSaleId: Number(x.productSaleId ?? x.id ?? 0),
              productId,
              productName: this.resolveProductName(productId),
              qty,
              saleUnitId: Number(x.saleUnitId ?? 0),
              netUnitPrice: Number(x.netUnitPrice ?? 0),
              discount: Number(x.discount ?? 0),
              taxRate: Number(x.taxRate ?? 0),
              tax: Number(x.tax ?? 0),
              total: Number(x.total ?? 0),
            };
          });

        this.lines = this.sourceSaleLines.map(sl => {
          const line = emptyLine(this.header.saleReturnId, this.nextRowKey++);
          this.applySourceSaleLine(line, sl);
          return line;
        });

        if (!this.header.referenceNo?.trim()) {
          this.header.referenceNo = `SR-${saleOrder.referenceNo || saleOrder.saleId}`;
        }

        this.formErrors = {};
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load sale details.',
        });
      },
    });
  }

  private applySourceSaleLine(line: LineRow, saleLine: SourceSaleLine): void {
    line.productId = saleLine.productId;
    line.productName = saleLine.productName;
    line.sourceProductSaleId = saleLine.productSaleId;
    line.soldQty = saleLine.qty;
    line.qty = saleLine.qty;
    line.saleUnitId = saleLine.saleUnitId;
    line.netUnitPrice = saleLine.netUnitPrice;
    line.discount = saleLine.discount;
    line.taxRate = saleLine.taxRate;
    line.tax = saleLine.tax;
    line.total = saleLine.total;
    this.recalcLine(line);
  }

  private loadLookups(): void {
    const accountParams = new HttpParams().set('pageNumber', '1').set('pageSize', '50');
    forkJoin({
      customers: this.customerService.getAll({ pageSize: 500 }),
      warehouses: this.warehouseService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
      accounts: this.http.get<any>(apiUrl('Account'), { params: accountParams }),
    }).subscribe({
      next: ({ customers, warehouses, products, accounts }) => {
        this.customerOptions = this.mapOptions(customers, 'customerId', 'name');
        this.warehouseOptions = this.mapOptions(warehouses, 'warehouseId', 'name');
        this.buildProductMap(products);
        this.resolveDefaultAccountId(accounts);
        this.customerMap = new Map(this.customerOptions.map(o => [o.value, o.label]));
        this.warehouseMap = new Map(this.warehouseOptions.map(o => [o.value, o.label]));
        this.lookupsLoaded = true;
        this.applyHeaderDefaults();
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Lookups',
          detail: 'Could not load dropdown data.',
        });
      },
    });
  }

  private loadReturnSale(id: number): void {
    this.isLoading = true;
    forkJoin({
      header: this.saleReturnService.getById(id),
      lines: this.productReturnService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ header, lines, products }) => {
        this.buildProductMap(products);
        const h = header?.data ?? header;
        this.header = this.mapHeader(h);
        const rawLines = this.extractItems(lines);
        this.lines = rawLines
          .filter((x: any) => Number(x.returnId ?? 0) === id)
          .map((x: any) => this.mapLine(x, id));
        this.removedLineIds = [];
        this.sourceSale = null;
        this.sourceSaleLines = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load sales return.',
        });
      },
    });
  }

  private resetForm(): void {
    this.header = emptyHeader();
    this.applyHeaderDefaults();
    this.lines = [];
    this.selectedLines = [];
    this.removedLineIds = [];
    this.formErrors = {};
    this.sourceSale = null;
    this.sourceSaleLines = [];
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
      this.formErrors.userId = 'User ID must be greater than 0';
    }
    if (!this.header.billerId || this.header.billerId <= 0) {
      this.formErrors.billerId = 'Biller ID must be greater than 0';
    }
    if (!this.header.accountId || this.header.accountId <= 0) {
      this.formErrors.accountId = 'Account ID must be greater than 0';
    }
    if (!this.validLines.length) {
      this.formErrors.lines = 'Select a sale to load return line items';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  private applyHeaderDefaults(): void {
    const user = this.authService.getUser();
    if ((!this.header.userId || this.header.userId <= 0) && user?.userId) {
      this.header.userId = user.userId;
    }
    if (!this.header.billerId || this.header.billerId <= 0) {
      this.header.billerId = this.header.userId;
    }
    if (!this.header.accountId || this.header.accountId <= 0) {
      this.header.accountId = this.defaultAccountId;
    }
  }

  private resolveDefaultAccountId(accountsRes: any): void {
    const accounts = this.extractItems(accountsRes);
    const defaultAccount = accounts.find((a: any) => a.isDefault || a.IsDefault);
    const pick = defaultAccount ?? accounts[0];
    const id = Number(pick?.id ?? pick?.Id ?? 0);
    if (id > 0) {
      this.defaultAccountId = id;
    }
  }

  private notifyValidationErrors(): void {
    const messages = Object.values(this.formErrors).filter(Boolean);
    if (messages.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Save',
        detail: messages.join('. '),
        life: 7000,
      });
    }
    if (this.formErrors.userId || this.formErrors.billerId || this.formErrors.accountId) {
      this.detailsDialogVisible = true;
    }
    this.cdr.detectChanges();
  }

  private buildHeaderDto(): CreateSaleReturnDto {
    return {
      referenceNo: this.header.referenceNo.trim(),
      userId: this.header.userId,
      cashRegisterId: this.header.cashRegisterId,
      customerId: this.header.customerId,
      warehouseId: this.header.warehouseId,
      billerId: this.header.billerId,
      accountId: this.header.accountId,
      item: this.itemCount,
      totalQty: this.totalQty,
      totalDiscount: this.totalDiscount,
      totalTax: this.totalTax,
      totalPrice: this.totalPrice,
      orderTaxRate: this.header.orderTaxRate,
      orderTax: this.header.orderTax,
      grandTotal: this.grandTotal,
      document: this.header.document?.trim() || null,
      returnNote: this.header.returnNote?.trim() || null,
      staffNote: this.header.staffNote?.trim() || null,
    };
  }

  private toCreateLineDto(line: LineRow, returnId: number): CreateProductReturnDto {
    this.recalcLine(line);
    return {
      returnId,
      productId: line.productId,
      productBatchId: null,
      variantId: null,
      imeiNumber: null,
      qty: line.qty,
      saleUnitId: line.saleUnitId,
      netUnitPrice: line.netUnitPrice,
      discount: line.discount,
      taxRate: line.taxRate,
      tax: line.tax,
      total: line.total,
    };
  }

  private toUpdateLineDto(line: LineRow, returnId: number): UpdateProductReturnDto {
    return { id: line.productReturnId, ...this.toCreateLineDto(line, returnId) };
  }

  private saveAdd(dto: CreateSaleReturnDto): void {
    this.saleReturnService.create(dto).pipe(
      switchMap(res => {
        const returnId = this.extractReturnId(res);
        if (!returnId) throw new Error('Missing return sale id');
        const creates = this.validLines.map(line =>
          this.productReturnService.create(this.toCreateLineDto(line, returnId))
        );
        if (!creates.length) return of(returnId);
        return forkJoin(creates).pipe(map(() => returnId));
      })
    ).subscribe({
      next: (returnId: number) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Sales return created successfully.',
        });
        this.isEditMode = true;
        this.header.saleReturnId = returnId;
        this.router.navigate([], { queryParams: { id: returnId }, replaceUrl: true });
        this.loadReturnSale(returnId);
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: err?.error?.message ?? err?.message ?? 'Could not create sales return.',
        });
      },
    });
  }

  private saveEdit(dto: CreateSaleReturnDto): void {
    const returnId = this.header.saleReturnId;
    const updateDto: UpdateSaleReturnDto = { id: returnId, ...dto };

    this.saleReturnService.update(returnId, updateDto).pipe(
      switchMap(() => {
        const ops = [
          ...this.validLines
            .filter(l => l.productReturnId > 0)
            .map(l => this.productReturnService.update(
              l.productReturnId,
              this.toUpdateLineDto(l, returnId)
            )),
          ...this.validLines
            .filter(l => l.productReturnId === 0)
            .map(l => this.productReturnService.create(this.toCreateLineDto(l, returnId))),
          ...this.removedLineIds.map(id => this.productReturnService.delete(id)),
        ];
        return ops.length ? forkJoin(ops) : of(null);
      })
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.removedLineIds = [];
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Sales return updated successfully.',
        });
        this.loadReturnSale(returnId);
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: err?.error?.message ?? err?.message ?? 'Could not update sales return.',
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

  private mapSaleReturn(x: any): SaleReturnOrder {
    return {
      saleReturnId: Number(x.saleReturnId ?? x.id ?? 0),
      referenceNo: x.referenceNo ?? '',
      userId: Number(x.userId ?? 0),
      cashRegisterId: x.cashRegisterId != null ? Number(x.cashRegisterId) : null,
      customerId: Number(x.customerId ?? 0),
      warehouseId: Number(x.warehouseId ?? 0),
      billerId: Number(x.billerId ?? 0),
      accountId: Number(x.accountId ?? 0),
      item: Number(x.item ?? 0),
      totalQty: Number(x.totalQty ?? 0),
      totalDiscount: Number(x.totalDiscount ?? 0),
      totalTax: Number(x.totalTax ?? 0),
      totalPrice: Number(x.totalPrice ?? 0),
      orderTaxRate: x.orderTaxRate != null ? Number(x.orderTaxRate) : null,
      orderTax: x.orderTax != null ? Number(x.orderTax) : null,
      grandTotal: Number(x.grandTotal ?? 0),
      document: x.document ?? '',
      returnNote: x.returnNote ?? '',
      staffNote: x.staffNote ?? '',
    };
  }

  private mapHeader(x: any): HeaderForm {
    return {
      saleReturnId: Number(x.saleReturnId ?? x.id ?? 0),
      referenceNo: x.referenceNo ?? '',
      customerId: Number(x.customerId ?? 0),
      warehouseId: Number(x.warehouseId ?? 0),
      userId: Number(x.userId ?? 0),
      billerId: Number(x.billerId ?? 0),
      accountId: Number(x.accountId ?? 0),
      cashRegisterId: x.cashRegisterId != null ? Number(x.cashRegisterId) : null,
      orderTaxRate: x.orderTaxRate != null ? Number(x.orderTaxRate) : null,
      orderTax: x.orderTax != null ? Number(x.orderTax) : null,
      returnNote: x.returnNote ?? '',
      staffNote: x.staffNote ?? '',
      document: x.document ?? '',
    };
  }

  private mapLine(x: any, returnId: number): LineRow {
    const line = emptyLine(returnId, this.nextRowKey++);
    line.productReturnId = Number(x.productReturnId ?? x.id ?? 0);
    line.productId = Number(x.productId ?? 0);
    line.productName = this.resolveProductName(line.productId);
    line.soldQty = Number(x.qty ?? 0);
    line.qty = Number(x.qty ?? 0);
    line.saleUnitId = Number(x.saleUnitId ?? 0);
    line.netUnitPrice = Number(x.netUnitPrice ?? 0);
    line.discount = Number(x.discount ?? 0);
    line.taxRate = Number(x.taxRate ?? 0);
    line.tax = Number(x.tax ?? 0);
    line.total = Number(x.total ?? 0);
    this.recalcLine(line);
    return line;
  }

  private buildProductMap(productsRes: any): void {
    const map = new Map<number, string>();
    for (const x of this.extractItems(productsRes)) {
      const id = Number(x.productId ?? x.ProductId ?? x.id ?? x.Id ?? 0);
      if (id <= 0) continue;
      const name = x.name ?? x.Name ?? x.code ?? x.Code ?? '';
      if (name) {
        map.set(id, String(name));
      }
    }
    this.productMap = map;
    this.productOptions = Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private resolveProductName(productId: number): string {
    if (!productId) return '—';
    return this.productMap.get(productId) ?? `Product #${productId}`;
  }

  private mapOptions(res: any, idKey: string, ...nameKeys: string[]): SelectOption[] {
    return this.extractItems(res).map((x: any) => {
      const id = Number(x[idKey] ?? x.id ?? 0);
      const name = nameKeys.map(k => x[k]).find(v => v != null && v !== '') ?? `#${id}`;
      return { label: String(name), value: id };
    });
  }

  private extractReturnId(res: any): number {
    const data = res?.data ?? res?.body ?? res;
    return Number(data?.saleReturnId ?? data?.id ?? data?.Id ?? 0);
  }

  private extractItems(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.Items)) return res.Items;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  private recalcLine(line: LineRow): void {
    const base = Math.max(0, (line.qty ?? 0) * (line.netUnitPrice ?? 0) - (line.discount ?? 0));
    line.tax = this.roundMoney(base * (line.taxRate ?? 0) / 100);
    line.total = this.roundMoney(base + line.tax);
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
