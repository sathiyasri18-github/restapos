import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { forkJoin, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AppModule } from '../../module/app.module';
import {
  CreatePurchaseProductReturnDto,
  PurchaseProductReturnService,
  UpdatePurchaseProductReturnDto
} from '../../services/purchase-product-return.service';
import { ProductService } from '../../services/product.service';
import {
  CreateReturnPurchaseDto,
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
  productOptions: SelectOption[] = [];

  isEditMode = false;
  isLoading = false;
  isSaving = false;
  lookupsLoaded = false;

  private nextRowKey = 1;
  private removedLineIds: number[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private returnPurchaseService: ReturnPurchaseService,
    private purchaseProductReturnService: PurchaseProductReturnService,
    private supplierService: SupplierService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = Number(params.get('id') ?? 0);
      this.isEditMode = id > 0;
      this.loadLookups(() => {
        if (this.isEditMode) {
          this.loadReturnPurchase(id);
        } else {
          this.resetForm();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Edit Return Purchase' : 'New Return Purchase';
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

  formatMoney(value: number | null | undefined): string {
    if (value == null) return '0.00';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onBack(): void {
    this.router.navigate(['/purchase-list']);
  }

  addLine(): void {
    this.lines = [...this.lines, emptyLine(this.header.returnPurchaseId, this.nextRowKey++)];
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
  }

  onProductChange(line: LineRow): void {
    if (!line.productId) return;
    this.productService.getById(line.productId).subscribe({
      next: (res: any) => {
        const p = res?.data ?? res;
        if (p?.purchaseProductCost != null) line.netUnitCost = Number(p.purchaseProductCost);
        else if (p?.saleProductCost != null) line.netUnitCost = Number(p.saleProductCost);
        if (p?.gst != null) line.taxRate = Number(p.gst);
        if (p?.unit != null) line.purchaseUnitId = Number(p.unit);
        this.recalcLine(line);
        this.cdr.detectChanges();
      },
    });
  }

  onLineFieldChange(line: LineRow): void {
    this.recalcLine(line);
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
    if (!this.validate()) return;
    this.isSaving = true;
    const dto = this.buildHeaderDto();

    if (this.isEditMode && this.header.returnPurchaseId > 0) {
      this.saveEdit(dto);
    } else {
      this.saveAdd(dto);
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

  private loadReturnPurchase(id: number): void {
    this.isLoading = true;
    forkJoin({
      header: this.returnPurchaseService.getById(id),
      lines: this.purchaseProductReturnService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ header, lines }) => {
        const h = header?.data ?? header;
        this.header = this.mapHeader(h);
        const rawLines = this.extractItems(lines);
        this.lines = rawLines
          .filter((x: any) => Number(x.returnId ?? 0) === id)
          .map((x: any) => this.mapLine(x, id));
        if (!this.lines.length) {
          this.addLine();
        }
        this.removedLineIds = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load return purchase.',
        });
      },
    });
  }

  private resetForm(): void {
    this.header = emptyHeader();
    this.lines = [emptyLine(0, this.nextRowKey++)];
    this.selectedLines = [];
    this.removedLineIds = [];
    this.formErrors = {};
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
    line.qty = Number(x.qty ?? 0);
    line.purchaseUnitId = Number(x.purchaseUnitId ?? 0);
    line.netUnitCost = Number(x.netUnitCost ?? 0);
    line.discount = Number(x.discount ?? 0);
    line.taxRate = Number(x.taxRate ?? 0);
    line.tax = Number(x.tax ?? 0);
    line.total = Number(x.total ?? 0);
    return line;
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
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private recalcLine(line: LineRow): void {
    const base = Math.max(0, (line.qty ?? 0) * (line.netUnitCost ?? 0) - (line.discount ?? 0));
    line.tax = this.roundMoney(base * (line.taxRate ?? 0) / 100);
    line.total = this.roundMoney(base + line.tax);
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
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
      this.formErrors.lines = 'Add at least one line with product and quantity';
    }
    return Object.keys(this.formErrors).length === 0;
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
    const data = res?.data ?? res;
    return Number(data?.returnPurchaseId ?? data?.id ?? 0);
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
        return forkJoin(creates.length ? creates : [of(null)]).pipe(
          switchMap(() => of(returnId))
        );
      })
    ).subscribe({
      next: (returnId: number) => {
        this.isSaving = false;
        this.isEditMode = true;
        this.header.returnPurchaseId = returnId;
        this.lines.forEach(l => { l.returnId = returnId; });
        this.router.navigate([], {
          queryParams: { id: returnId },
          replaceUrl: true,
        });
        this.loadReturnPurchase(returnId);
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Return purchase created successfully.',
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not create return purchase.',
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
          detail: 'Return purchase updated successfully.',
        });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not update return purchase.',
        });
      },
    });
  }
}
