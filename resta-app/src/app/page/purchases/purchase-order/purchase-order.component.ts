import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin, of, Subject, debounceTime, switchMap, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../../common/grid-report';
import {
  CreateProductPurchaseDto,
  ProductPurchaseService,
  UpdateProductPurchaseDto
} from '../../../services/product-purchase.service';
import {
  CreatePurchaseOrderDto,
  PurchaseOrder,
  PurchaseOrderService,
  UpdatePurchaseOrderDto
} from '../../../services/purchase-order.service';
import { ProductService } from '../../../services/product.service';
import { SupplierService } from '../../../services/supplier.service';
import { WarehouseService } from '../../../services/warehouse.service';

const DEFAULT_PURCHASE_STATUS = 1;
const DEFAULT_PAYMENT_STATUS = 1;

interface SelectOption<T = number> {
  label: string;
  value: T;
}

interface HeaderFormErrors {
  referenceNo?: string;
  warehouseId?: string;
  userId?: string;
  lines?: string;
}

interface PurchaseLineRow {
  rowKey: string;
  productPurchaseId: number;
  productId: number;
  qty: number;
  purchaseUnitId: number;
  netUnitCost: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  recieved: number;
}

interface HeaderForm {
  purchaseId: number;
  referenceNo: string;
  userId: number;
  warehouseId: number | null;
  supplierId: number | null;
  shippingCost: number | null;
  orderDiscount: number | null;
  note: string;
}

function emptyHeader(): HeaderForm {
  return {
    purchaseId: 0,
    referenceNo: '',
    userId: 0,
    warehouseId: null,
    supplierId: null,
    shippingCost: 0,
    orderDiscount: 0,
    note: '',
  };
}

function emptyLine(rowKey: string): PurchaseLineRow {
  return {
    rowKey,
    productPurchaseId: 0,
    productId: 0,
    qty: 1,
    purchaseUnitId: 0,
    netUnitCost: 0,
    discount: 0,
    taxRate: 0,
    tax: 0,
    total: 0,
    recieved: 0,
  };
}

@Component({
  selector: 'app-purchase-order',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class PurchaseOrderComponent implements OnInit, OnDestroy {
  header = emptyHeader();
  lines: PurchaseLineRow[] = [];
  selectedLines: PurchaseLineRow[] = [];
  formErrors: HeaderFormErrors = {};
  isSaving = false;
  isLoading = false;
  isEditMode = false;
  lookupsLoaded = false;

  purchaseOrders: PurchaseOrder[] = [];
  filteredPurchaseOrders: PurchaseOrder[] = [];
  selectedPurchaseOrder: PurchaseOrder | null = null;
  listLoading = false;
  listSearchTerm = '';
  private listSearch$ = new Subject<void>();

  supplierOptions: SelectOption[] = [];
  warehouseOptions: SelectOption[] = [];
  productOptions: SelectOption[] = [];
  private warehouseMap = new Map<number, string>();
  private supplierMap = new Map<number, string>();

  private readonly statusLabels: Record<number, string> = {
    1: 'Pending',
    2: 'Received',
    3: 'Partial',
    4: 'Cancelled',
  };

  private readonly paymentStatusLabels: Record<number, string> = {
    1: 'Pending',
    2: 'Paid',
    3: 'Partial',
  };

  private removedLineIds: number[] = [];
  private lineKeyCounter = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private productPurchaseService: ProductPurchaseService,
    private supplierService: SupplierService,
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
      this.loadPurchaseOrders();
      this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
        const id = Number(params.get('id') ?? 0);
        if (id > 0) {
          this.openPurchaseFromList({ purchaseId: id } as PurchaseOrder);
        } else {
          this.onNewPurchase(false);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Purchase Order' : 'New Purchase Order';
  }

  get itemCount(): number {
    return this.validLines.length;
  }

  get totalQty(): number {
    return this.round(this.validLines.reduce((s, l) => s + (l.qty ?? 0), 0));
  }

  get totalCost(): number {
    return this.round(
      this.validLines.reduce((s, l) => s + (l.qty ?? 0) * (l.netUnitCost ?? 0), 0)
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

  get validLines(): PurchaseLineRow[] {
    return this.lines.filter(l => l.productId > 0 && l.qty > 0);
  }

  get hasActiveListFilters(): boolean {
    return !!this.listSearchTerm.trim();
  }

  get purchaseListReportConfig(): GridReportConfig {
    return {
      title: 'Purchase Orders',
      subtitle: this.hasActiveListFilters ? `Search: ${this.listSearchTerm}` : undefined,
      fileName: 'purchase-orders',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Reference No', field: 'referenceNo' },
        { header: 'Warehouse', field: 'warehouseId', align: 'center' },
        { header: 'Supplier', field: 'supplierId', align: 'center' },
        { header: 'Grand Total', field: 'grandTotal', align: 'right' },
        { header: 'Status', field: 'status', align: 'center' },
        { header: 'Payment Status', field: 'paymentStatus', align: 'center' },
      ],
      rows: this.filteredPurchaseOrders.map(po => ({
        referenceNo: po.referenceNo || '—',
        warehouseId: this.getWarehouseName(po.warehouseId),
        supplierId: this.getSupplierName(po.supplierId),
        grandTotal: this.formatAmount(po.grandTotal),
        status: this.getStatusLabel(po.status),
        paymentStatus: this.getPaymentStatusLabel(po.paymentStatus),
      })),
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

  getWarehouseName(id: number | null | undefined): string {
    if (id == null || id <= 0) return '—';
    return this.warehouseMap.get(id) ?? String(id);
  }

  getSupplierName(id: number | null | undefined): string {
    if (id == null || id <= 0) return '—';
    return this.supplierMap.get(id) ?? String(id);
  }

  getStatusLabel(status: number | null | undefined): string {
    if (status == null) return '—';
    return this.statusLabels[status] ?? String(status);
  }

  getPaymentStatusLabel(paymentStatus: number | null | undefined): string {
    if (paymentStatus == null) return '—';
    return this.paymentStatusLabels[paymentStatus] ?? String(paymentStatus);
  }

  onNewPurchase(clearRoute = true): void {
    this.isEditMode = false;
    this.selectedPurchaseOrder = null;
    this.resetForm();
    if (clearRoute) {
      this.router.navigate(['/product-purchase'], { replaceUrl: true });
    }
  }

  onCancel(): void {
    this.onNewPurchase();
  }

  loadPurchaseOrders(): void {
    this.listLoading = true;
    this.purchaseOrderService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        this.purchaseOrders = this.extractItems(res).map(x => this.mapPurchaseOrder(x));
        this.applyListFilter();
        this.listLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.listLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load purchase orders.',
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
    this.filteredPurchaseOrders = this.purchaseOrders.filter(po =>
      !term
      || po.referenceNo.toLowerCase().includes(term)
      || (po.note ?? '').toLowerCase().includes(term));
  }

  openPurchaseFromList(purchaseOrder: PurchaseOrder): void {
    this.selectedPurchaseOrder = purchaseOrder;
    this.isEditMode = true;
    this.loadPurchase(purchaseOrder.purchaseId);
  }

  onEditSelected(): void {
    if (this.selectedPurchaseOrder) {
      this.openPurchaseFromList(this.selectedPurchaseOrder);
    }
  }

  confirmDeletePurchase(purchaseOrder: PurchaseOrder, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      message: `Delete purchase "<strong>${purchaseOrder.referenceNo || purchaseOrder.purchaseId}</strong>"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.executeDeletePurchase(purchaseOrder),
    });
  }

  onDeleteSelected(event: Event): void {
    if (this.selectedPurchaseOrder) {
      this.confirmDeletePurchase(this.selectedPurchaseOrder, event);
    }
  }

  private executeDeletePurchase(purchaseOrder: PurchaseOrder): void {
    this.purchaseOrderService.delete(purchaseOrder.purchaseId).subscribe({
      next: () => {
        this.purchaseOrders = this.purchaseOrders.filter(
          po => po.purchaseId !== purchaseOrder.purchaseId
        );
        if (this.selectedPurchaseOrder?.purchaseId === purchaseOrder.purchaseId) {
          this.selectedPurchaseOrder = null;
        }
        if (this.header.purchaseId === purchaseOrder.purchaseId) {
          this.onNewPurchase();
        }
        this.applyListFilter();
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `"${purchaseOrder.referenceNo || purchaseOrder.purchaseId}" was deleted.`,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'Could not delete purchase order.',
        });
      },
    });
  }

  addLine(): void {
    this.lines = [...this.lines, emptyLine(this.nextRowKey())];
    this.formErrors.lines = undefined;
  }

  removeSelectedLines(): void {
    if (!this.selectedLines.length) return;

    for (const line of this.selectedLines) {
      if (line.productPurchaseId > 0) {
        this.removedLineIds.push(line.productPurchaseId);
      }
    }

    const keys = new Set(this.selectedLines.map(l => l.rowKey));
    this.lines = this.lines.filter(l => !keys.has(l.rowKey));
    this.selectedLines = [];
    this.formErrors.lines = undefined;
  }

  onLineChange(line: PurchaseLineRow): void {
    this.recalcLine(line);
    this.formErrors.lines = undefined;
  }

  onProductSelect(line: PurchaseLineRow, productId: number): void {
    line.productId = productId ?? 0;
    if (!productId) {
      this.onLineChange(line);
      return;
    }

    this.productService.getById(productId).subscribe({
      next: (res: any) => {
        const p = res?.data ?? res;
        if (p?.purchaseProductCost != null) {
          line.netUnitCost = Number(p.purchaseProductCost);
        } else if (p?.saleProductCost != null) {
          line.netUnitCost = Number(p.saleProductCost);
        }
        if (p?.unit != null) {
          line.purchaseUnitId = Number(p.unit);
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
      suppliers: this.supplierService.getAll({ pageSize: 500 }),
      warehouses: this.warehouseService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ suppliers, warehouses, products }) => {
        this.supplierOptions = this.mapOptions(suppliers, 'supplierId', 'name', 'supplierName');
        this.warehouseOptions = this.mapOptions(warehouses, 'warehouseId', 'name');
        this.productOptions = this.mapOptions(products, 'productId', 'name', 'productName');
        this.supplierMap = new Map(this.supplierOptions.map(o => [o.value, o.label]));
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

  private loadPurchase(id: number): void {
    this.isLoading = true;
    this.removedLineIds = [];

    forkJoin({
      purchase: this.purchaseOrderService.getById(id),
      lines: this.productPurchaseService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ purchase, lines }) => {
        const p = purchase?.data ?? purchase;
        this.header = this.mapHeader(p);
        const allLines = this.extractItems(lines);
        this.lines = allLines
          .filter((x: any) => Number(x.purchaseId ?? 0) === id)
          .map((x: any) => this.mapLineRow(x));
        if (!this.lines.length) {
          this.addLine();
        }
        const match = this.purchaseOrders.find(po => po.purchaseId === id);
        if (match) this.selectedPurchaseOrder = match;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load purchase order.',
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
      totalCost: this.totalCost,
      grandTotal: this.grandTotal,
    };
  }

  private saveAdd(totals: ReturnType<typeof this.buildHeaderTotals>): void {
    this.purchaseOrderService.create(this.toCreateDto(totals)).pipe(
      switchMap((res: any) => {
        const purchaseId = this.extractPurchaseId(res);
        if (!purchaseId) {
          throw new Error('Missing purchase id');
        }
        const creates = this.validLines.map(line =>
          this.productPurchaseService.create(this.toCreateLineDto(line, purchaseId))
        );
        return creates.length ? forkJoin(creates) : of([]);
      })
    ).subscribe({
      next: () => this.onSaveSuccess('Purchase order created successfully.'),
      error: () => this.onSaveError('Could not create purchase order.'),
    });
  }

  private saveEdit(totals: ReturnType<typeof this.buildHeaderTotals>): void {
    const purchaseId = this.header.purchaseId;

    this.purchaseOrderService.update(purchaseId, this.toUpdateDto(totals)).pipe(
      switchMap(() => {
        const ops = [
          ...this.removedLineIds.map(id => this.productPurchaseService.delete(id)),
          ...this.lines
            .filter(l => l.productPurchaseId > 0 && l.productId > 0 && l.qty > 0)
            .map(l =>
              this.productPurchaseService.update(
                l.productPurchaseId,
                this.toUpdateLineDto(l, purchaseId)
              )
            ),
          ...this.lines
            .filter(l => l.productPurchaseId === 0 && l.productId > 0 && l.qty > 0)
            .map(l => this.productPurchaseService.create(this.toCreateLineDto(l, purchaseId))),
        ];
        return ops.length ? forkJoin(ops) : of([]);
      })
    ).subscribe({
      next: () => this.onSaveSuccess('Purchase order updated successfully.'),
      error: () => this.onSaveError('Could not update purchase order.'),
    });
  }

  private toCreateDto(totals: ReturnType<typeof this.buildHeaderTotals>): CreatePurchaseOrderDto {
    return {
      referenceNo: this.header.referenceNo.trim(),
      userId: this.header.userId,
      warehouseId: this.header.warehouseId!,
      supplierId: this.header.supplierId,
      item: totals.item,
      totalQty: totals.totalQty,
      totalDiscount: totals.totalDiscount,
      totalTax: totals.totalTax,
      totalCost: totals.totalCost,
      orderTaxRate: null,
      orderTax: null,
      orderDiscount: this.header.orderDiscount ?? 0,
      shippingCost: this.header.shippingCost ?? 0,
      grandTotal: totals.grandTotal,
      paidAmount: 0,
      status: DEFAULT_PURCHASE_STATUS,
      paymentStatus: DEFAULT_PAYMENT_STATUS,
      document: null,
      note: this.header.note?.trim() || null,
    };
  }

  private toUpdateDto(totals: ReturnType<typeof this.buildHeaderTotals>): UpdatePurchaseOrderDto {
    return {
      ...this.toCreateDto(totals),
      id: this.header.purchaseId,
    };
  }

  private toCreateLineDto(line: PurchaseLineRow, purchaseId: number): CreateProductPurchaseDto {
    this.recalcLine(line);
    return {
      purchaseId,
      productId: line.productId,
      productBatchId: null,
      variantId: null,
      imeiNumber: null,
      qty: line.qty,
      recieved: line.recieved ?? line.qty,
      purchaseUnitId: line.purchaseUnitId,
      netUnitCost: line.netUnitCost,
      discount: line.discount ?? 0,
      taxRate: line.taxRate ?? 0,
      tax: line.tax ?? 0,
      total: line.total ?? 0,
    };
  }

  private toUpdateLineDto(line: PurchaseLineRow, purchaseId: number): UpdateProductPurchaseDto {
    return {
      ...this.toCreateLineDto(line, purchaseId),
      id: line.productPurchaseId,
    };
  }

  private recalcLine(line: PurchaseLineRow): void {
    const subtotal = (line.qty ?? 0) * (line.netUnitCost ?? 0) - (line.discount ?? 0);
    line.tax = this.round(Math.max(0, subtotal) * (line.taxRate ?? 0) / 100);
    line.total = this.round(Math.max(0, subtotal) + line.tax);
  }

  private mapHeader(x: any): HeaderForm {
    const warehouseId = Number(x.warehouseId ?? 0);
    return {
      purchaseId: Number(x.purchaseId ?? x.id ?? 0),
      referenceNo: x.referenceNo ?? '',
      userId: Number(x.userId ?? 0),
      warehouseId: warehouseId > 0 ? warehouseId : null,
      supplierId: x.supplierId != null ? Number(x.supplierId) : null,
      shippingCost: x.shippingCost != null ? Number(x.shippingCost) : 0,
      orderDiscount: x.orderDiscount != null ? Number(x.orderDiscount) : 0,
      note: x.note ?? '',
    };
  }

  private mapLineRow(x: any): PurchaseLineRow {
    const row: PurchaseLineRow = {
      rowKey: this.nextRowKey(),
      productPurchaseId: Number(x.productPurchaseId ?? x.id ?? 0),
      productId: Number(x.productId ?? 0),
      qty: Number(x.qty ?? 0),
      purchaseUnitId: Number(x.purchaseUnitId ?? 0),
      netUnitCost: Number(x.netUnitCost ?? 0),
      discount: Number(x.discount ?? 0),
      taxRate: Number(x.taxRate ?? 0),
      tax: Number(x.tax ?? 0),
      total: Number(x.total ?? 0),
      recieved: Number(x.recieved ?? x.qty ?? 0),
    };
    this.recalcLine(row);
    return row;
  }

  private mapPurchaseOrder(x: any): PurchaseOrder {
    return {
      purchaseId: x.purchaseId ?? x.id ?? 0,
      referenceNo: x.referenceNo ?? '',
      userId: x.userId ?? 0,
      warehouseId: x.warehouseId ?? 0,
      supplierId: x.supplierId ?? null,
      item: x.item ?? 0,
      totalQty: x.totalQty ?? 0,
      totalDiscount: x.totalDiscount ?? 0,
      totalTax: x.totalTax ?? 0,
      totalCost: x.totalCost ?? 0,
      orderTaxRate: x.orderTaxRate ?? null,
      orderTax: x.orderTax ?? null,
      orderDiscount: x.orderDiscount ?? null,
      shippingCost: x.shippingCost ?? null,
      grandTotal: x.grandTotal ?? 0,
      paidAmount: x.paidAmount ?? 0,
      status: x.status ?? 0,
      paymentStatus: x.paymentStatus ?? 0,
      document: x.document ?? '',
      note: x.note ?? '',
    };
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

  private extractPurchaseId(res: any): number {
    const data = res?.data ?? res;
    return Number(data?.purchaseId ?? data?.id ?? 0);
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
    this.loadPurchaseOrders();
    this.onNewPurchase();
  }

  private onSaveError(detail: string): void {
    this.isSaving = false;
    this.messageService.add({ severity: 'error', summary: 'Save Failed', detail });
  }
}
