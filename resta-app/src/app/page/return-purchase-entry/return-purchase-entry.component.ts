import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { debounceTime, forkJoin, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import { apiUrl } from '../../core/api-config';
import { AuthService } from '../../services/auth.service';
import {
  CreatePurchaseProductReturnDto,
  PurchaseProductReturnService,
  UpdatePurchaseProductReturnDto
} from '../../services/purchase-product-return.service';
import { ProductPurchaseService } from '../../services/product-purchase.service';
import { ProductService } from '../../services/product.service';
import { Purchase, PurchaseService } from '../../services/purchase.service';
import {
  CreateReturnPurchaseDto,
  ReturnPurchaseOrder,
  ReturnPurchaseService,
  UpdateReturnPurchaseDto
} from '../../services/return-purchase.service';
import { SupplierService } from '../../services/supplier.service';
import { WarehouseService } from '../../services/warehouse.service';

interface SelectOption<T = number> {
  label: string;
  value: T;
}

interface HeaderForm {
  returnPurchaseId: number;
  referenceNo: string;
  supplierId: number | null;
  warehouseId: number;
  userId: number;
  accountId: number;
  orderTaxRate: number | null;
  orderTax: number | null;
  returnNote: string;
  staffNote: string;
  document: string;
}

interface LineRow {
  rowKey: number;
  purchaseProductReturnId: number;
  returnId: number;
  productId: number;
  productName: string;
  sourcePurchaseLineId: number;
  purchasedQty: number;
  qty: number;
  purchaseUnitId: number;
  netUnitCost: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
}

interface SourcePurchaseLine {
  purchaseLineId: number;
  productId: number;
  productName: string;
  qty: number;
  purchaseUnitId: number;
  netUnitCost: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
}

interface HeaderFormErrors {
  referenceNo?: string;
  warehouseId?: string;
  userId?: string;
  accountId?: string;
  lines?: string;
}

function emptyHeader(): HeaderForm {
  return {
    returnPurchaseId: 0,
    referenceNo: '',
    supplierId: null,
    warehouseId: 0,
    userId: 0,
    accountId: 0,
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
    purchaseProductReturnId: 0,
    returnId,
    productId: 0,
    productName: '',
    sourcePurchaseLineId: 0,
    purchasedQty: 0,
    qty: 1,
    purchaseUnitId: 0,
    netUnitCost: 0,
    discount: 0,
    taxRate: 0,
    tax: 0,
    total: 0,
  };
}

@Component({
  selector: 'app-return-purchase-entry',
  imports: [AppModule],
  templateUrl: './return-purchase-entry.component.html',
  styleUrls: ['./return-purchase-entry.component.scss'],
  providers: [MessageService],
})
export class ReturnPurchaseEntryComponent implements OnInit, OnDestroy {
  header = emptyHeader();
  lines: LineRow[] = [];
  selectedLines: LineRow[] = [];
  formErrors: HeaderFormErrors = {};

  supplierOptions: SelectOption[] = [];
  warehouseOptions: SelectOption[] = [];
  private supplierMap = new Map<number, string>();
  private warehouseMap = new Map<number, string>();
  private productMap = new Map<number, string>();

  sourcePurchase: Purchase | null = null;
  sourcePurchaseLines: SourcePurchaseLine[] = [];

  detailsDialogVisible = false;
  purchaseDialogVisible = false;
  purchaseReturnSearchVisible = false;

  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  selectedPurchaseInDialog: Purchase | null = null;
  purchaseSearchTerm = '';
  purchaseListLoading = false;
  private purchaseSearch$ = new Subject<void>();

  purchaseReturns: ReturnPurchaseOrder[] = [];
  filteredPurchaseReturns: ReturnPurchaseOrder[] = [];
  selectedPurchaseReturnInDialog: ReturnPurchaseOrder | null = null;
  purchaseReturnSearchTerm = '';
  purchaseReturnListLoading = false;
  private purchaseReturnSearch$ = new Subject<void>();

  isEditMode = false;
  isLoading = false;
  isSaving = false;
  lookupsLoaded = false;

  private nextRowKey = 1;
  private removedLineIds: number[] = [];
  private defaultAccountId = 1;
  private destroy$ = new Subject<void>();

  constructor(
    private returnPurchaseService: ReturnPurchaseService,
    private purchaseProductReturnService: PurchaseProductReturnService,
    private purchaseService: PurchaseService,
    private productPurchaseService: ProductPurchaseService,
    private supplierService: SupplierService,
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
    this.purchaseSearch$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.applyPurchaseFilter());
    this.purchaseReturnSearch$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => this.applyPurchaseReturnFilter());

    this.loadLookups();
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = Number(params.get('id') ?? 0);
      if (id > 0) {
        this.isEditMode = true;
        this.loadReturnPurchase(id);
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
    return this.isEditMode ? 'Edit Purchase Return' : 'Purchase Return';
  }

  get validLines(): LineRow[] {
    return this.lines.filter(l => l.productId > 0 && l.qty > 0);
  }

  get itemCount(): number {
    return this.validLines.length;
  }

  get totalQty(): number {
    return this.validLines.reduce((s, l) => s + (l.qty ?? 0), 0);
  }

  get totalCost(): number {
    return this.roundMoney(this.validLines.reduce((s, l) => s + (l.qty ?? 0) * (l.netUnitCost ?? 0), 0));
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

  get linesSubtotal(): number {
    return this.roundMoney(this.validLines.reduce((s, l) => s + (l.total ?? 0), 0));
  }

  get grandTotal(): number {
    return this.roundMoney(this.linesSubtotal + (this.header.orderTax ?? 0));
  }

  get hasPurchaseSearch(): boolean {
    return !!this.purchaseSearchTerm.trim();
  }

  get hasPurchaseReturnSearch(): boolean {
    return !!this.purchaseReturnSearchTerm.trim();
  }

  formatMoney(value: number | null | undefined): string {
    if (value == null) return '0.00';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(value: Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getSupplierName(id: number | null | undefined): string {
    if (id == null || id <= 0) return '—';
    return this.supplierMap.get(id) ?? String(id);
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

  openPurchaseDialog(): void {
    this.purchaseDialogVisible = true;
    this.selectedPurchaseInDialog = this.sourcePurchase;
    if (!this.purchases.length) {
      this.loadPurchases();
    } else {
      this.applyPurchaseFilter();
    }
  }

  openPurchaseReturnSearch(): void {
    this.purchaseReturnSearchVisible = true;
    this.selectedPurchaseReturnInDialog = null;
    if (!this.purchaseReturns.length) {
      this.loadPurchaseReturns();
    } else {
      this.applyPurchaseReturnFilter();
    }
  }

  onPurchaseSearchChange(): void {
    this.purchaseSearch$.next();
  }

  onClearPurchaseSearch(): void {
    this.purchaseSearchTerm = '';
    this.applyPurchaseFilter();
  }

  onPurchaseReturnSearchChange(): void {
    this.purchaseReturnSearch$.next();
  }

  onClearPurchaseReturnSearch(): void {
    this.purchaseReturnSearchTerm = '';
    this.applyPurchaseReturnFilter();
  }

  confirmPurchaseSelection(): void {
    if (!this.selectedPurchaseInDialog) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Purchase',
        detail: 'Please select a purchase from the list.',
      });
      return;
    }
    this.bindPurchaseForReturn(this.selectedPurchaseInDialog.purchaseId);
    this.purchaseDialogVisible = false;
  }

  confirmPurchaseReturnSelection(): void {
    if (!this.selectedPurchaseReturnInDialog) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Return',
        detail: 'Please select a purchase return from the list.',
      });
      return;
    }
    const id = this.selectedPurchaseReturnInDialog.returnPurchaseId;
    this.purchaseReturnSearchVisible = false;
    this.isEditMode = true;
    this.router.navigate([], { queryParams: { id }, replaceUrl: true });
    this.loadReturnPurchase(id);
  }

  onNewReturn(): void {
    this.isEditMode = false;
    this.router.navigate(['/return-purchase-entry'], { replaceUrl: true });
    this.resetForm();
  }

  removeSelectedLines(): void {
    if (!this.selectedLines.length) return;
    const removeKeys = new Set(this.selectedLines.map(l => l.rowKey));
    for (const line of this.selectedLines) {
      if (line.purchaseProductReturnId > 0) {
        this.removedLineIds.push(line.purchaseProductReturnId);
      }
    }
    this.lines = this.lines.filter(l => !removeKeys.has(l.rowKey));
    this.selectedLines = [];
    this.formErrors.lines = undefined;
  }

  onLineFieldChange(line: LineRow): void {
    if (line.purchasedQty > 0 && line.qty > line.purchasedQty) {
      line.qty = line.purchasedQty;
    }
    if (line.qty < 0) {
      line.qty = 0;
    }
    this.recalcLine(line);
    this.formErrors.lines = undefined;
  }

  onOrderTaxRateChange(): void {
    const rate = this.header.orderTaxRate ?? 0;
    if (rate <= 0) {
      this.header.orderTax = 0;
      return;
    }
    const base = this.totalCost - this.totalDiscount;
    this.header.orderTax = this.roundMoney(base * rate / 100);
  }

  onSave(): void {
    this.applyHeaderDefaults();
    if (!this.validate()) {
      this.notifyValidationErrors();
      return;
    }
    this.isSaving = true;
    const dto = this.buildHeaderDto();
    if (this.isEditMode && this.header.returnPurchaseId > 0) {
      this.saveEdit(dto);
    } else {
      this.saveAdd(dto);
    }
  }

  private loadPurchases(): void {
    this.purchaseListLoading = true;
    this.purchaseService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        this.purchases = this.extractItems(res).map(x => this.mapPurchase(x));
        this.applyPurchaseFilter();
        this.purchaseListLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.purchaseListLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load purchases.',
        });
      },
    });
  }

  private loadPurchaseReturns(): void {
    this.purchaseReturnListLoading = true;
    this.returnPurchaseService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        this.purchaseReturns = this.extractItems(res).map(x => this.mapPurchaseReturn(x));
        this.applyPurchaseReturnFilter();
        this.purchaseReturnListLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.purchaseReturnListLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load purchase returns.',
        });
      },
    });
  }

  private applyPurchaseFilter(): void {
    const term = this.purchaseSearchTerm.trim().toLowerCase();
    this.filteredPurchases = this.purchases.filter(p =>
      !term
      || (p.purchaseCode ?? '').toLowerCase().includes(term)
      || (p.orderNo ?? '').toLowerCase().includes(term)
      || String(p.purchaseId).includes(term)
      || this.getSupplierName(p.supplierId).toLowerCase().includes(term));
  }

  private applyPurchaseReturnFilter(): void {
    const term = this.purchaseReturnSearchTerm.trim().toLowerCase();
    this.filteredPurchaseReturns = this.purchaseReturns.filter(r =>
      !term
      || r.referenceNo.toLowerCase().includes(term)
      || (r.returnNote ?? '').toLowerCase().includes(term)
      || String(r.returnPurchaseId).includes(term)
      || this.getSupplierName(r.supplierId).toLowerCase().includes(term));
  }

  private bindPurchaseForReturn(purchaseId: number): void {
    if (!purchaseId || purchaseId <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Purchase',
        detail: 'Could not resolve purchase id.',
      });
      return;
    }

    this.isLoading = true;
    forkJoin({
      purchase: this.purchaseService.getById(purchaseId),
      lines: this.productPurchaseService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ purchase, lines, products }) => {
        this.buildProductMap(products);
        const p = purchase?.data ?? purchase;
        const purchaseOrder = this.mapPurchase(p);
        this.sourcePurchase = purchaseOrder;
        this.header.supplierId = purchaseOrder.supplierId;
        const warehouseId = Number(p?.warehouseId ?? p?.WarehouseId ?? 0);
        if (warehouseId > 0) {
          this.header.warehouseId = warehouseId;
        }
        const userId = Number(p?.userId ?? p?.UserId ?? 0);
        if (userId > 0) {
          this.header.userId = userId;
        }
        this.applyHeaderDefaults();

        this.sourcePurchaseLines = this.extractItems(lines)
          .filter((x: any) => Number(x.purchaseId ?? x.PurchaseId ?? 0) === purchaseId)
          .map((x: any) => this.mapSourcePurchaseLine(x));

        this.lines = this.sourcePurchaseLines.map(sl => {
          const line = emptyLine(this.header.returnPurchaseId, this.nextRowKey++);
          this.applySourcePurchaseLine(line, sl);
          return line;
        });

        if (!this.header.referenceNo?.trim()) {
          this.header.referenceNo = `PR-${purchaseOrder.purchaseCode || purchaseOrder.purchaseId}`;
        }

        if (!this.lines.length) {
          this.messageService.add({
            severity: 'warn',
            summary: 'No Lines',
            detail: 'This purchase has no product lines to return.',
          });
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
          detail: 'Could not load purchase details.',
        });
      },
    });
  }

  private mapSourcePurchaseLine(x: any): SourcePurchaseLine {
    const productId = Number(x.productId ?? x.ProductId ?? 0);
    const qty = Number(x.qty ?? x.Qty ?? 0);
    const netUnitCost = Number(x.netUnitCost ?? x.NetUnitCost ?? 0);
    const taxRate = Number(x.taxRate ?? x.TaxRate ?? 0);
    const discount = Number(x.discount ?? x.Discount ?? 0);
    const tax = Number(x.tax ?? x.Tax ?? 0);
    const total = Number(x.total ?? x.Total ?? 0);
    const purchaseUnitId = Number(x.purchaseUnitId ?? x.PurchaseUnitId ?? 0);

    const line: SourcePurchaseLine = {
      purchaseLineId: Number(x.productPurchaseId ?? x.id ?? x.Id ?? 0),
      productId,
      productName: this.resolveProductName(productId),
      qty,
      purchaseUnitId,
      netUnitCost,
      discount,
      taxRate,
      tax: this.roundMoney(tax),
      total: this.roundMoney(total),
    };

    if (!line.total && qty > 0) {
      const base = Math.max(0, qty * netUnitCost - discount);
      line.tax = this.roundMoney(tax || base * taxRate / 100);
      line.total = this.roundMoney(total || base + line.tax);
    }

    return line;
  }

  private applySourcePurchaseLine(line: LineRow, purchaseLine: SourcePurchaseLine): void {
    line.productId = purchaseLine.productId;
    line.productName = purchaseLine.productName;
    line.sourcePurchaseLineId = purchaseLine.purchaseLineId;
    line.purchasedQty = purchaseLine.qty;
    line.qty = purchaseLine.qty;
    line.purchaseUnitId = purchaseLine.purchaseUnitId;
    line.netUnitCost = purchaseLine.netUnitCost;
    line.discount = purchaseLine.discount;
    line.taxRate = purchaseLine.taxRate;
    line.tax = purchaseLine.tax;
    line.total = purchaseLine.total;
    this.recalcLine(line);
  }

  private loadLookups(): void {
    const accountParams = new HttpParams().set('pageNumber', '1').set('pageSize', '50');
    forkJoin({
      suppliers: this.supplierService.getAll({ pageSize: 500 }),
      warehouses: this.warehouseService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
      accounts: this.http.get<any>(apiUrl('Account'), { params: accountParams }),
    }).subscribe({
      next: ({ suppliers, warehouses, products, accounts }) => {
        this.supplierOptions = this.mapOptions(suppliers, 'supplierId', 'name', 'supplierName');
        this.warehouseOptions = this.mapOptions(warehouses, 'warehouseId', 'name');
        this.buildProductMap(products);
        this.resolveDefaultAccountId(accounts);
        this.supplierMap = new Map(this.supplierOptions.map(o => [o.value, o.label]));
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

  private loadReturnPurchase(id: number): void {
    this.isLoading = true;
    forkJoin({
      header: this.returnPurchaseService.getById(id),
      lines: this.purchaseProductReturnService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ header, lines, products }) => {
        this.buildProductMap(products);
        const h = header?.data ?? header;
        this.header = this.mapHeader(h);
        this.applyHeaderDefaults();
        const rawLines = this.extractItems(lines);
        this.lines = rawLines
          .filter((x: any) => Number(x.returnId ?? 0) === id)
          .map((x: any) => this.mapLine(x, id));
        this.removedLineIds = [];
        this.sourcePurchase = null;
        this.sourcePurchaseLines = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load purchase return.',
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
    this.sourcePurchase = null;
    this.sourcePurchaseLines = [];
  }

  private mapPurchase(x: any): Purchase {
    const supplierIdRaw = x.supplierId ?? x.SupplierId;
    const supplierId = supplierIdRaw != null ? Number(supplierIdRaw) : null;
    const purchaseId = Number(x.purchaseId ?? x.id ?? x.Id ?? 0);
    const created = x.createdDate ?? x.CreatedDate ?? x.date ?? null;
    const totalRaw = x.totalAmount ?? x.grandTotal ?? x.GrandTotal ?? x.totalCost ?? x.TotalCost;
    return {
      purchaseId,
      purchaseCode: x.purchaseCode ?? x.referenceNo ?? x.ReferenceNo ?? '',
      date: created ? new Date(created) : null,
      supplierId,
      supplierName: x.supplierName ?? (supplierId != null ? this.getSupplierName(supplierId) : ''),
      type: x.type != null ? Number(x.type) : (x.status != null ? Number(x.status) : null),
      orderNo: x.orderNo ?? x.note ?? x.Note ?? '',
      totalAmount: totalRaw != null ? Number(totalRaw) : null,
    };
  }

  private mapPurchaseReturn(x: any): ReturnPurchaseOrder {
    return {
      returnPurchaseId: Number(x.returnPurchaseId ?? x.id ?? 0),
      referenceNo: x.referenceNo ?? '',
      supplierId: x.supplierId != null ? Number(x.supplierId) : null,
      warehouseId: Number(x.warehouseId ?? 0),
      userId: Number(x.userId ?? 0),
      accountId: Number(x.accountId ?? 0),
      item: Number(x.item ?? 0),
      totalQty: Number(x.totalQty ?? 0),
      totalDiscount: Number(x.totalDiscount ?? 0),
      totalTax: Number(x.totalTax ?? 0),
      totalCost: Number(x.totalCost ?? 0),
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
      returnPurchaseId: Number(x.returnPurchaseId ?? x.id ?? 0),
      referenceNo: x.referenceNo ?? '',
      supplierId: x.supplierId != null ? Number(x.supplierId) : null,
      warehouseId: Number(x.warehouseId ?? 0),
      userId: Number(x.userId ?? 0),
      accountId: Number(x.accountId ?? 0),
      orderTaxRate: x.orderTaxRate != null ? Number(x.orderTaxRate) : null,
      orderTax: x.orderTax != null ? Number(x.orderTax) : null,
      returnNote: x.returnNote ?? '',
      staffNote: x.staffNote ?? '',
      document: x.document ?? '',
    };
  }

  private mapLine(x: any, returnId: number): LineRow {
    const line = emptyLine(returnId, this.nextRowKey++);
    line.purchaseProductReturnId = Number(x.purchaseProductReturnId ?? x.id ?? 0);
    line.productId = Number(x.productId ?? 0);
    line.productName = this.resolveProductName(line.productId);
    line.purchasedQty = Number(x.qty ?? 0);
    line.qty = Number(x.qty ?? 0);
    line.purchaseUnitId = Number(x.purchaseUnitId ?? 0);
    line.netUnitCost = Number(x.netUnitCost ?? 0);
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
  }

  private resolveProductName(productId: number): string {
    if (!productId) return '—';
    return this.productMap.get(productId) ?? `Product #${productId}`;
  }

  private mapOptions(res: any, idKey: string, ...nameKeys: string[]): SelectOption[] {
    return this.extractItems(res).map((x: any) => {
      const id = Number(x[idKey] ?? x.id ?? 0);
      let name = '';
      for (const key of nameKeys) {
        if (x[key]) {
          name = x[key];
          break;
        }
      }
      return { label: name || `#${id}`, value: id };
    });
  }

  private extractItems(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.Items)) return res.Items;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }

  private applyHeaderDefaults(): void {
    const user = this.authService.getUser();
    if ((!this.header.userId || this.header.userId <= 0) && user?.userId) {
      this.header.userId = user.userId;
    }
    if (!this.header.accountId || this.header.accountId <= 0) {
      this.header.accountId = this.defaultAccountId;
    }
    if ((!this.header.warehouseId || this.header.warehouseId <= 0) && this.warehouseOptions.length === 1) {
      this.header.warehouseId = this.warehouseOptions[0].value;
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
    if (this.formErrors.userId || this.formErrors.accountId) {
      this.detailsDialogVisible = true;
    }
    this.cdr.detectChanges();
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.header.referenceNo?.trim()) {
      this.formErrors.referenceNo = 'Reference number is required';
    }
    if (!this.header.warehouseId || this.header.warehouseId <= 0) {
      this.formErrors.warehouseId = 'Warehouse is required';
    }
    if (!this.header.userId || this.header.userId <= 0) {
      this.formErrors.userId = 'User ID must be greater than 0';
    }
    if (!this.header.accountId || this.header.accountId <= 0) {
      this.formErrors.accountId = 'Account ID must be greater than 0';
    }
    if (!this.validLines.length) {
      this.formErrors.lines = 'Select a purchase to load return line items';
    }
    return Object.keys(this.formErrors).length === 0;
  }

  private recalcLine(line: LineRow): void {
    const base = Math.max(0, (line.qty ?? 0) * (line.netUnitCost ?? 0) - (line.discount ?? 0));
    line.tax = this.roundMoney(base * (line.taxRate ?? 0) / 100);
    line.total = this.roundMoney(base + line.tax);
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private buildHeaderDto(): CreateReturnPurchaseDto {
    return {
      referenceNo: this.header.referenceNo.trim(),
      supplierId: this.header.supplierId,
      warehouseId: this.header.warehouseId,
      userId: this.header.userId,
      accountId: this.header.accountId,
      item: this.itemCount,
      totalQty: this.totalQty,
      totalDiscount: this.totalDiscount,
      totalTax: this.totalTax,
      totalCost: this.totalCost,
      orderTaxRate: this.header.orderTaxRate,
      orderTax: this.header.orderTax,
      grandTotal: this.grandTotal,
      document: this.header.document?.trim() || null,
      returnNote: this.header.returnNote?.trim() || null,
      staffNote: this.header.staffNote?.trim() || null,
    };
  }

  private toCreateLineDto(line: LineRow, returnId: number): CreatePurchaseProductReturnDto {
    this.recalcLine(line);
    return {
      returnId,
      productId: line.productId,
      productBatchId: null,
      variantId: null,
      imeiNumber: null,
      qty: line.qty,
      purchaseUnitId: line.purchaseUnitId,
      netUnitCost: line.netUnitCost,
      discount: line.discount,
      taxRate: line.taxRate,
      tax: line.tax,
      total: line.total,
    };
  }

  private toUpdateLineDto(line: LineRow, returnId: number): UpdatePurchaseProductReturnDto {
    return {
      id: line.purchaseProductReturnId,
      ...this.toCreateLineDto(line, returnId),
    };
  }

  private extractReturnId(res: any): number {
    const data = res?.data ?? res?.body ?? res;
    return Number(data?.returnPurchaseId ?? data?.id ?? data?.Id ?? 0);
  }

  private saveAdd(dto: CreateReturnPurchaseDto): void {
    this.returnPurchaseService.create(dto).pipe(
      switchMap(res => {
        const returnId = this.extractReturnId(res);
        if (!returnId) {
          throw new Error('Missing return purchase id');
        }
        const creates = this.validLines.map(line =>
          this.purchaseProductReturnService.create(this.toCreateLineDto(line, returnId))
        );
        if (!creates.length) return of(returnId);
        return forkJoin(creates).pipe(map(() => returnId));
      })
    ).subscribe({
      next: (returnId: number) => {
        this.isSaving = false;
        this.isEditMode = true;
        this.header.returnPurchaseId = returnId;
        this.router.navigate([], {
          queryParams: { id: returnId },
          replaceUrl: true,
        });
        this.loadReturnPurchase(returnId);
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Purchase return created successfully.',
        });
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: err?.error?.message ?? err?.message ?? 'Could not create purchase return.',
        });
      },
    });
  }

  private saveEdit(dto: CreateReturnPurchaseDto): void {
    const updateDto: UpdateReturnPurchaseDto = {
      id: this.header.returnPurchaseId,
      ...dto,
    };
    const returnId = this.header.returnPurchaseId;

    this.returnPurchaseService.update(returnId, updateDto).pipe(
      switchMap(() => {
        const ops = [
          ...this.validLines
            .filter(l => l.purchaseProductReturnId > 0)
            .map(l => this.purchaseProductReturnService.update(
              l.purchaseProductReturnId,
              this.toUpdateLineDto(l, returnId)
            )),
          ...this.validLines
            .filter(l => l.purchaseProductReturnId === 0)
            .map(l => this.purchaseProductReturnService.create(this.toCreateLineDto(l, returnId))),
          ...this.removedLineIds.map(id => this.purchaseProductReturnService.delete(id)),
        ];
        return ops.length ? forkJoin(ops) : of(null);
      })
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.removedLineIds = [];
        this.loadReturnPurchase(returnId);
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Purchase return updated successfully.',
        });
      },
      error: (err) => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: err?.error?.message ?? err?.message ?? 'Could not update purchase return.',
        });
      },
    });
  }
}
