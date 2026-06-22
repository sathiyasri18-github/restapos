import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { forkJoin, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { CustomerService } from '../../../services/customer.service';
import {
  CreateProductReturnDto,
  ProductReturnService,
  UpdateProductReturnDto
} from '../../../services/product-return.service';
import { ProductService } from '../../../services/product.service';
import {
  CreateSaleReturnDto,
  SaleReturnService,
  UpdateSaleReturnDto
} from '../../../services/sale-return.service';
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

  isEditMode = false;
  isLoading = false;
  isSaving = false;
  lookupsLoaded = false;

  private nextRowKey = 1;
  private removedLineIds: number[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private saleReturnService: SaleReturnService,
    private productReturnService: ProductReturnService,
    private customerService: CustomerService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
    return this.isEditMode ? 'Edit Return Sale' : 'New Return Sale';
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

  formatMoney(value: number | null | undefined): string {
    if (value == null) return '0.00';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onBack(): void {
    this.router.navigate(['/sale']);
  }

  addLine(): void {
    this.lines = [...this.lines, emptyLine(this.header.saleReturnId, this.nextRowKey++)];
    this.formErrors.lines = undefined;
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
    this.recalcLine(line);
    this.formErrors.lines = undefined;
  }

  onProductChange(line: LineRow): void {
    if (!line.productId) {
      this.onLineFieldChange(line);
      return;
    }
    this.productService.getById(line.productId).subscribe({
      next: (res: any) => {
        const p = res?.data ?? res;
        if (p?.saleProductCost != null) {
          line.netUnitPrice = Number(p.saleProductCost);
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

  onOrderTaxRateChange(): void {
    if (this.header.orderTaxRate != null && this.header.orderTaxRate > 0) {
      const base = this.validLines.reduce((s, l) => s + (l.total ?? 0), 0);
      this.header.orderTax = this.roundMoney(base * this.header.orderTaxRate / 100);
    }
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    const dto = this.buildHeaderDto();
    if (this.isEditMode) {
      this.saveEdit(dto);
    } else {
      this.saveAdd(dto);
    }
  }

  private loadLookups(): void {
    forkJoin({
      customers: this.customerService.getAll({ pageSize: 500 }),
      warehouses: this.warehouseService.getAll({ pageSize: 500 }),
      products: this.productService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ customers, warehouses, products }) => {
        this.customerOptions = this.mapOptions(customers, 'customerId', 'name');
        this.warehouseOptions = this.mapOptions(warehouses, 'warehouseId', 'name');
        this.productOptions = this.mapOptions(products, 'productId', 'name', 'productName');
        this.lookupsLoaded = true;
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
          detail: 'Could not load return sale.',
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
      this.formErrors.lines = 'Add at least one line with product and quantity';
    }
    return Object.keys(this.formErrors).length === 0;
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
        return forkJoin(creates.length ? creates : [of(null)]);
      })
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Return sale created successfully.',
        });
        this.router.navigate(['/sale']);
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not create return sale.',
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
          detail: 'Return sale updated successfully.',
        });
        this.router.navigate(['/sale']);
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: 'Could not update return sale.',
        });
      },
    });
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

  private mapOptions(res: any, idKey: string, ...nameKeys: string[]): SelectOption[] {
    return this.extractItems(res).map((x: any) => {
      const id = Number(x[idKey] ?? x.id ?? 0);
      const name = nameKeys.map(k => x[k]).find(v => v != null && v !== '') ?? `#${id}`;
      return { label: String(name), value: id };
    });
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  private extractReturnId(res: any): number {
    const data = res?.data ?? res;
    return Number(data?.saleReturnId ?? data?.id ?? 0);
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
