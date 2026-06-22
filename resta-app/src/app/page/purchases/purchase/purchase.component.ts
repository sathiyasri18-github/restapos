// purchase.component.ts

import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../../common/grid-report';
import { ProductService } from '../../../services/product.service';
import {
  CreatePurchaseLineDto,
  PurchaseLine,
  PurchaseLineService,
  UpdatePurchaseLineDto
} from '../../../services/purchase-line.service';
import {
  CreatePurchaseRequest,
  Purchase,
  PurchaseService,
  UpdatePurchaseRequest
} from '../../../services/purchase.service';
import { SupplierService } from '../../../services/supplier.service';

type DialogMode = 'add' | 'edit';

interface SelectOption<T = number> {
  label: string;
  value: T;
}

interface PurFormErrors {
  supplierId?: string;
  date?:       string;
}

interface LineFormErrors {
  productId?: string;
  quantity?: string;
  price?:    string;
}

function emptyPurchaseForm(): Purchase {
  return {
    purchaseId:   0,
    purchaseCode: '',
    date:         new Date(),
    supplierId:   null,
    supplierName: '',
    type:         null,
    orderNo:      '',
    totalAmount:  null,
  };
}

function emptyLineForm(purchaseId: number | null = null): PurchaseLine {
  return {
    purchaseLineId: 0,
    purchaseId,
    productId:      null,
    quantity:       1,
    price:          null,
    gst:            null,
    amount:         null,
  };
}

@Component({
  selector: 'app-purchase',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class PurchaseComponent implements OnInit, OnDestroy {

  purchases: Purchase[] = [];
  selectedPurchase: Purchase | null = null;
  purLoading = false;
  purTotalRecords = 0;
  purSearchTerm = '';
  purFromDate: Date | null = null;
  purToDate: Date | null = null;
  private purSearch$ = new Subject<string>();

  purDialogVisible = false;
  purDialogMode: DialogMode = 'add';
  purFormData: Purchase = emptyPurchaseForm();
  purFormErrors: PurFormErrors = {};
  purSaving = false;

  lines: PurchaseLine[] = [];
  selectedLine: PurchaseLine | null = null;
  lineLoading = false;
  lineTotalRecords = 0;

  lineDialogVisible = false;
  lineDialogMode: DialogMode = 'add';
  lineFormData: PurchaseLine = emptyLineForm();
  lineFormErrors: LineFormErrors = {};
  lineSaving = false;
  lineFormIncludeGst = false;
  private productGstRate: number | null = null;

  supplierOptions: SelectOption[] = [];
  productOptions: SelectOption[] = [];
  private supplierMap = new Map<number, string>();
  private productMap = new Map<number, string>();

  private destroy$ = new Subject<void>();

  constructor(
    private purchaseService: PurchaseService,
    private purchaseLineService: PurchaseLineService,
    private supplierService: SupplierService,
    private productService: ProductService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.purSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.loadPurchases(term));

    this.loadLookups();
    this.loadPurchases();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get purDialogTitle(): string {
    return this.purDialogMode === 'add' ? 'Add Purchase' : 'Edit Purchase';
  }

  get lineDialogTitle(): string {
    return this.lineDialogMode === 'add' ? 'Add Line Item' : 'Edit Line Item';
  }

  get hasPurSearch(): boolean {
    return !!this.purSearchTerm.trim() || !!this.purFromDate || !!this.purToDate;
  }

  get hasSelectedPurchase(): boolean {
    return this.selectedPurchase != null;
  }

  get lineFormAmount(): number {
    return this.calcAmount(
      this.lineFormData.quantity,
      this.lineFormData.price,
      this.lineFormData.gst,
      this.lineFormIncludeGst
    );
  }

  get linesSubtotal(): number {
    return this.lines.reduce((s, l) => s + this.calcLineTotal(l), 0);
  }

  formatDate(value: Date | null | undefined): string {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatMoney(value: number | null | undefined): string {
    if (value == null) return '—';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  calcAmount(
    qty: number | null,
    price: number | null,
    gst: number | null,
    includeGst = false
  ): number {
    const base = (qty ?? 0) * (price ?? 0);
    return includeGst ? base : base + (gst ?? 0);
  }

  calcLineTotal(line: PurchaseLine): number {
    if (line.includeGst) {
      return (line.quantity ?? 0) * (line.price ?? 0);
    }
    const base = (line.quantity ?? 0) * (line.price ?? 0);
    const stored = line.amount ?? base;
    if (Math.abs(stored - base) < 0.02) {
      return base;
    }
    return this.calcAmount(line.quantity, line.price, line.gst, false);
  }

  private inferIncludeGst(line: PurchaseLine): boolean {
    if (line.includeGst != null) return line.includeGst;
    const base = (line.quantity ?? 0) * (line.price ?? 0);
    const stored = line.amount ?? base;
    return Math.abs(stored - base) < 0.02;
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  recalcLineGst(): void {
    const qty = this.lineFormData.quantity ?? 0;
    const price = this.lineFormData.price ?? 0;
    const rate = this.productGstRate ?? 0;
    const base = qty * price;

    if (rate <= 0 || base <= 0) {
      if (this.lineFormIncludeGst) {
        this.lineFormData.gst = 0;
      }
      return;
    }

    this.lineFormData.gst = this.lineFormIncludeGst
      ? this.roundMoney(base * rate / (100 + rate))
      : this.roundMoney(base * rate / 100);
  }

  getSupplierName(id: number | null): string {
    if (id == null) return '—';
    return this.supplierMap.get(id) ?? '—';
  }

  getProductName(id: number | null): string {
    if (id == null) return '—';
    return this.productMap.get(id) ?? '—';
  }

  loadLookups(): void {
    forkJoin({
      suppliers: this.supplierService.getAll({ pageSize: 500 }),
      products:  this.productService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ suppliers, products }) => {
        this.bindSuppliers(suppliers);
        this.bindProducts(products);
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'warn', summary: 'Lookups', detail: 'Could not load suppliers or products.' });
      }
    });
  }

  private bindSuppliers(res: any): void {
    const list = this.extractItems(res);
    this.supplierMap.clear();
    this.supplierOptions = list.map((s: any) => {
      const id = s.supplierId ?? s.id ?? 0;
      const name = s.name ?? s.supplierName ?? '';
      this.supplierMap.set(id, name);
      return { label: name, value: id };
    });
  }

  private bindProducts(res: any): void {
    const list = this.extractItems(res);
    this.productMap.clear();
    this.productOptions = list.map((p: any) => {
      const id = p.productId ?? p.id ?? 0;
      const name = p.name ?? p.productName ?? '';
      this.productMap.set(id, name);
      return { label: name, value: id };
    });
  }

  loadPurchases(search = ''): void {
    this.purLoading = true;
    const params: {
      search: string;
      pageSize: number;
      fromDate?: string;
      toDate?: string;
    } = { search, pageSize: 200 };

    if (this.purFromDate) params.fromDate = this.toIsoDateTime(this.purFromDate, false);
    if (this.purToDate)   params.toDate   = this.toIsoDateTime(this.purToDate, true);

    this.purchaseService.getAll(params).subscribe({
      next: (res: any) => {
        const raw = this.extractItems(res);
        this.purchases = raw.map((x: any) => this.mapPurchase(x));
        this.purTotalRecords = res?.totalCount ?? this.purchases.length;
        this.purLoading = false;

        if (this.selectedPurchase) {
          const still = this.purchases.find(p => p.purchaseId === this.selectedPurchase!.purchaseId);
          if (still) {
            this.selectedPurchase = still;
            this.loadLines();
          } else {
            this.clearLinePanel();
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.purLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load purchases.' });
      }
    });
  }

  private mapPurchase(x: any): Purchase {
    const supplierId = x.supplierId != null ? Number(x.supplierId) : null;
    return {
      purchaseId:   Number(x.purchaseId ?? x.id ?? 0),
      purchaseCode: x.purchaseCode ?? '',
      date:         x.date ? new Date(x.date) : null,
      supplierId,
      supplierName: x.supplierName ?? (supplierId != null ? this.supplierMap.get(supplierId) ?? '' : ''),
      type:         x.type != null ? Number(x.type) : null,
      orderNo:      x.orderNo ?? '',
      totalAmount:  x.totalAmount != null ? Number(x.totalAmount) : null,
      createdDate:  x.createdDate ? new Date(x.createdDate) : null,
      modifiedDate: x.modifiedDate ? new Date(x.modifiedDate) : null,
    };
  }

  loadLines(): void {
    if (!this.selectedPurchase) return;

    this.lineLoading = true;
    this.purchaseLineService.getAll({
      purchaseId: this.selectedPurchase.purchaseId,
      pageSize: 500
    }).subscribe({
      next: (res: any) => {
        const raw = this.extractItems(res);
        this.lines = raw.map((x: any) => this.mapLine(x));
        this.lineTotalRecords = res?.totalCount ?? this.lines.length;
        this.lineLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.lineLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Load Failed', detail: 'Could not load purchase lines.' });
      }
    });
  }

  private mapLine(x: any): PurchaseLine {
    const line: PurchaseLine = {
      purchaseLineId: Number(x.purchaseLineId ?? x.id ?? 0),
      purchaseId:     x.purchaseId != null ? Number(x.purchaseId) : null,
      productId:      x.productId != null ? Number(x.productId) : null,
      quantity:       x.quantity != null ? Number(x.quantity) : null,
      price:          x.price != null ? Number(x.price) : null,
      gst:            x.gst != null ? Number(x.gst) : null,
      amount:         x.amount != null ? Number(x.amount) : null,
    };
    line.includeGst = this.inferIncludeGst(line);
    if (line.amount == null) {
      line.amount = this.calcLineTotal(line);
    }
    return line;
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private toIsoDateTime(d: Date, endOfDay: boolean): string {
    const copy = new Date(d);
    if (endOfDay) copy.setHours(23, 59, 59, 999);
    else copy.setHours(0, 0, 0, 0);
    return copy.toISOString();
  }

  private toDateOnly(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onPurSearchChange(): void {
    this.purSearch$.next(this.purSearchTerm);
  }

  onPurDateFilterChange(): void {
    this.loadPurchases(this.purSearchTerm);
  }

  onClearPurSearch(): void {
    this.purSearchTerm = '';
    this.purFromDate = null;
    this.purToDate = null;
    this.loadPurchases();
  }

  onPurchaseSelect(): void {
    this.selectedLine = null;
    if (this.selectedPurchase) {
      this.loadLines();
    } else {
      this.clearLinePanel();
    }
  }

  private clearLinePanel(): void {
    this.lines = [];
    this.selectedLine = null;
    this.lineTotalRecords = 0;
  }

  openPurAddDialog(): void {
    this.purDialogMode = 'add';
    this.purFormData = emptyPurchaseForm();
    this.purFormErrors = {};
    this.purDialogVisible = true;
  }

  openPurEditDialog(item: Purchase): void {
    this.purDialogMode = 'edit';
    this.purFormData = {
      ...item,
      date: item.date ? new Date(item.date) : null,
    };
    if (this.selectedPurchase?.purchaseId === item.purchaseId && this.lines.length > 0) {
      this.purFormData.totalAmount = this.roundMoney(this.linesSubtotal);
    }
    this.purFormErrors = {};
    this.purDialogVisible = true;
  }

  onPurEditSelected(): void {
    if (this.selectedPurchase) this.openPurEditDialog(this.selectedPurchase);
  }

  onPurDialogHide(): void {
    this.purFormErrors = {};
    this.purSaving = false;
  }

  private validatePur(): boolean {
    this.purFormErrors = {};
    if (!this.purFormData.supplierId) this.purFormErrors.supplierId = 'Supplier is required';
    if (!this.purFormData.date) this.purFormErrors.date = 'Date is required';
    return Object.keys(this.purFormErrors).length === 0;
  }

  onPurSave(): void {
    if (!this.validatePur()) return;
    this.purSaving = true;
    this.purDialogMode === 'add' ? this.savePurAdd() : this.savePurEdit();
  }

  private toCreatePurDto(f: Purchase): CreatePurchaseRequest {
    return {
      purchaseCode: f.purchaseCode?.trim() || null,
      date:         f.date ? this.toIsoDateTime(f.date, false) : null,
      supplierId:   f.supplierId,
      type:         f.type,
      orderNo:      f.orderNo?.trim() || null,
      totalAmount:  f.totalAmount,
      createdBy:    null,
    };
  }

  private toUpdatePurDto(f: Purchase): UpdatePurchaseRequest {
    return {
      purchaseCode: f.purchaseCode?.trim() || null,
      date:         f.date ? this.toIsoDateTime(f.date, false) : null,
      supplierId:   f.supplierId,
      type:         f.type,
      orderNo:      f.orderNo?.trim() || null,
      totalAmount:  f.totalAmount,
      modifiedBy:   null,
    };
  }

  private savePurAdd(): void {
    this.purchaseService.create(this.toCreatePurDto(this.purFormData)).subscribe({
      next: (res: any) => {
        const added = this.mapPurchase(res?.data ?? res ?? this.purFormData);
        this.purchases = [...this.purchases, added];
        this.purTotalRecords++;
        this.purDialogVisible = false;
        this.purSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Purchase Added', detail: 'Purchase created successfully.' });
      },
      error: () => {
        this.purSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add purchase.' });
      }
    });
  }

  private savePurEdit(): void {
    this.purchaseService.update(this.purFormData.purchaseId, this.toUpdatePurDto(this.purFormData)).subscribe({
      next: () => {
        const idx = this.purchases.findIndex(p => p.purchaseId === this.purFormData.purchaseId);
        if (idx !== -1) {
          this.purchases = [
            ...this.purchases.slice(0, idx),
            { ...this.purFormData, supplierName: this.getSupplierName(this.purFormData.supplierId) },
            ...this.purchases.slice(idx + 1)
          ];
        }
        if (this.selectedPurchase?.purchaseId === this.purFormData.purchaseId) {
          this.selectedPurchase = { ...this.purFormData };
        }
        this.purDialogVisible = false;
        this.purSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Purchase Updated', detail: 'Purchase updated successfully.' });
      },
      error: () => {
        this.purSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update purchase.' });
      }
    });
  }

  confirmPurDelete(item: Purchase, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete purchase <strong>${item.purchaseCode || '#' + item.purchaseId}</strong>? Lines may also be removed.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executePurDelete(item)
    });
  }

  onPurDeleteSelected(event: Event): void {
    if (this.selectedPurchase) this.confirmPurDelete(this.selectedPurchase, event);
  }

  private executePurDelete(item: Purchase): void {
    this.purchaseService.delete(item.purchaseId).subscribe({
      next: () => {
        this.purchases = this.purchases.filter(p => p.purchaseId !== item.purchaseId);
        if (this.selectedPurchase?.purchaseId === item.purchaseId) {
          this.selectedPurchase = null;
          this.clearLinePanel();
        }
        this.purTotalRecords--;
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Purchase deleted.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete purchase.' });
      }
    });
  }

  openLineAddDialog(): void {
    if (!this.selectedPurchase) return;
    this.lineDialogMode = 'add';
    this.lineFormData = emptyLineForm(this.selectedPurchase.purchaseId);
    this.lineFormErrors = {};
    this.lineFormIncludeGst = false;
    this.productGstRate = null;
    this.lineDialogVisible = true;
  }

  openLineEditDialog(item: PurchaseLine): void {
    this.lineDialogMode = 'edit';
    this.lineFormData = { ...item };
    this.lineFormErrors = {};
    this.lineFormIncludeGst = this.inferIncludeGst(item);
    this.productGstRate = null;
    if (item.productId) {
      this.productService.getById(item.productId).subscribe({
        next: (res: any) => {
          const p = res?.data ?? res;
          if (p?.gst != null) this.productGstRate = Number(p.gst);
          this.cdr.detectChanges();
        }
      });
    }
    this.lineDialogVisible = true;
  }

  onLineEditSelected(): void {
    if (this.selectedLine) this.openLineEditDialog(this.selectedLine);
  }

  onLineDialogHide(): void {
    this.lineFormErrors = {};
    this.lineSaving = false;
    this.lineFormIncludeGst = false;
    this.productGstRate = null;
  }

  onIncludeGstChange(): void {
    this.recalcLineGst();
    this.cdr.detectChanges();
  }

  onLineQtyPriceChange(): void {
    this.recalcLineGst();
  }

  onProductSelect(productId: number): void {
    if (!productId) return;
    this.productService.getById(productId).subscribe({
      next: (res: any) => {
        const p = res?.data ?? res;
        if (this.lineDialogMode === 'add') {
          if (p?.purchaseProductCost != null) this.lineFormData.price = Number(p.purchaseProductCost);
          else if (p?.saleProductCost != null) this.lineFormData.price = Number(p.saleProductCost);
        }
        this.productGstRate = p?.gst != null ? Number(p.gst) : null;
        this.recalcLineGst();
        this.cdr.detectChanges();
      }
    });
  }

  private validateLine(): boolean {
    this.lineFormErrors = {};
    if (!this.lineFormData.productId) this.lineFormErrors.productId = 'Product is required';
    if (this.lineFormData.quantity == null || this.lineFormData.quantity <= 0) {
      this.lineFormErrors.quantity = 'Quantity must be greater than 0';
    }
    if (this.lineFormData.price == null || this.lineFormData.price < 0) {
      this.lineFormErrors.price = 'Price is required';
    }
    return Object.keys(this.lineFormErrors).length === 0;
  }

  onLineSave(): void {
    if (!this.validateLine()) return;
    this.recalcLineGst();
    this.lineFormData.amount = this.lineFormAmount;
    this.lineSaving = true;
    this.lineDialogMode === 'add' ? this.saveLineAdd() : this.saveLineEdit();
  }

  private toCreateLineDto(f: PurchaseLine): CreatePurchaseLineDto {
    return {
      purchaseId: f.purchaseId,
      productId:  f.productId,
      quantity:   f.quantity,
      price:      f.price,
      gst:        f.gst,
      createdBy:  null,
    };
  }

  private toUpdateLineDto(f: PurchaseLine): UpdatePurchaseLineDto {
    return {
      purchaseLineId: f.purchaseLineId,
      purchaseId:     f.purchaseId,
      productId:      f.productId,
      quantity:       f.quantity,
      price:          f.price,
      gst:            f.gst,
      modifiedBy:     null,
    };
  }

  private saveLineAdd(): void {
    this.purchaseLineService.create(this.toCreateLineDto(this.lineFormData)).subscribe({
      next: (res: any) => {
        const added = this.mapLine(res?.data ?? res ?? this.lineFormData);
        added.includeGst = this.lineFormIncludeGst;
        added.amount = this.calcLineTotal(added);
        this.lines = [...this.lines, added];
        this.lineTotalRecords++;
        this.lineDialogVisible = false;
        this.lineSaving = false;
        this.syncPurchaseTotalFromLines();
        this.messageService.add({ severity: 'success', summary: 'Line Added', detail: 'Purchase line added.' });
      },
      error: () => {
        this.lineSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add line.' });
      }
    });
  }

  private saveLineEdit(): void {
    this.purchaseLineService.update(this.lineFormData.purchaseLineId, this.toUpdateLineDto(this.lineFormData)).subscribe({
      next: () => {
        const idx = this.lines.findIndex(l => l.purchaseLineId === this.lineFormData.purchaseLineId);
        const updated: PurchaseLine = {
          ...this.lineFormData,
          amount: this.lineFormAmount,
          includeGst: this.lineFormIncludeGst,
        };
        if (idx !== -1) {
          this.lines = [...this.lines.slice(0, idx), updated, ...this.lines.slice(idx + 1)];
        }
        if (this.selectedLine?.purchaseLineId === this.lineFormData.purchaseLineId) {
          this.selectedLine = updated;
        }
        this.lineDialogVisible = false;
        this.lineSaving = false;
        this.syncPurchaseTotalFromLines();
        this.messageService.add({ severity: 'success', summary: 'Line Updated', detail: 'Purchase line updated.' });
      },
      error: () => {
        this.lineSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update line.' });
      }
    });
  }

  private syncPurchaseTotalFromLines(): void {
    if (!this.selectedPurchase) return;

    const total = this.roundMoney(this.linesSubtotal);
    const purchase = this.selectedPurchase;
    const dto: UpdatePurchaseRequest = {
      purchaseCode: purchase.purchaseCode?.trim() || null,
      date:         purchase.date ? this.toIsoDateTime(purchase.date, false) : null,
      supplierId:   purchase.supplierId,
      type:         purchase.type,
      orderNo:      purchase.orderNo?.trim() || null,
      totalAmount:  total,
      modifiedBy:   null,
    };

    this.purchaseService.update(purchase.purchaseId, dto).subscribe({
      next: () => {
        const updated: Purchase = { ...purchase, totalAmount: total };
        const idx = this.purchases.findIndex(x => x.purchaseId === updated.purchaseId);
        if (idx !== -1) {
          this.purchases = [...this.purchases.slice(0, idx), updated, ...this.purchases.slice(idx + 1)];
        }
        if (this.selectedPurchase?.purchaseId === updated.purchaseId) {
          this.selectedPurchase = updated;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Purchase Total',
          detail: 'Line saved but could not update purchase total.'
        });
      }
    });
  }

  confirmLineDelete(item: PurchaseLine, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Delete this line item?',
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeLineDelete(item)
    });
  }

  onLineDeleteSelected(event: Event): void {
    if (this.selectedLine) this.confirmLineDelete(this.selectedLine, event);
  }

  private executeLineDelete(item: PurchaseLine): void {
    this.purchaseLineService.delete(item.purchaseLineId).subscribe({
      next: () => {
        this.lines = this.lines.filter(l => l.purchaseLineId !== item.purchaseLineId);
        if (this.selectedLine?.purchaseLineId === item.purchaseLineId) {
          this.selectedLine = null;
        }
        this.lineTotalRecords--;
        this.syncPurchaseTotalFromLines();
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Line deleted.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete line.' });
      }
    });
  }

  get purchasesReportConfig(): GridReportConfig {
    const subtitleParts: string[] = [];
    if (this.hasPurSearch) {
      subtitleParts.push(`Search: ${this.purSearchTerm}`);
    }
    if (this.purFromDate || this.purToDate) {
      subtitleParts.push(
        `Date: ${this.formatDate(this.purFromDate ?? undefined)} – ${this.formatDate(this.purToDate ?? undefined)}`
      );
    }
    return {
      title: 'Purchases',
      subtitle: subtitleParts.length ? subtitleParts.join(' | ') : undefined,
      fileName: 'purchases',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Code', field: 'purchaseCode' },
        { header: 'Date', field: 'date', format: (v) => this.formatDate(v as Date | null | undefined) },
        {
          header: 'Supplier',
          field: 'supplierId',
          format: (v, row) =>
            String(row['supplierName'] ?? this.getSupplierName(v as number | null))
        },
        { header: 'Total', field: 'totalAmount', align: 'right', format: (v) => this.formatMoney(v as number | null | undefined) }
      ],
      rows: this.purchases.map(p => ({
        purchaseCode: p.purchaseCode,
        date: p.date,
        supplierId: p.supplierId,
        supplierName: p.supplierName,
        totalAmount: p.totalAmount
      }))
    };
  }

  get purchaseLinesReportConfig(): GridReportConfig {
    const purchase = this.selectedPurchase;
    return {
      title: 'Purchase Lines',
      subtitle: purchase
        ? `Purchase: ${purchase.purchaseCode || purchase.purchaseId} | ${this.getSupplierName(purchase.supplierId)}`
        : undefined,
      fileName: purchase ? `purchase_lines_${purchase.purchaseId}` : 'purchase_lines',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        {
          header: 'Product',
          field: 'productId',
          format: (v) => this.getProductName(v as number | null)
        },
        { header: 'Qty', field: 'quantity', align: 'right' },
        { header: 'Price', field: 'price', align: 'right', format: (v) => this.formatMoney(v as number | null | undefined) },
        { header: 'GST', field: 'gst', align: 'right', format: (v) => this.formatMoney(v as number | null | undefined) },
        { header: 'Amount', field: 'amount', align: 'right', format: (v) => this.formatMoney(v as number | null | undefined) }
      ],
      rows: this.lines.map(l => ({
        productId: l.productId,
        quantity: l.quantity,
        price: l.price,
        gst: l.gst,
        amount: l.amount
      }))
    };
  }
}
