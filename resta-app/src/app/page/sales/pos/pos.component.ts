import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin, catchError, of, switchMap } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { apiAssetUrl } from '../../../core/api-config';
import { AuthService } from '../../../services/auth.service';
import { BrandService } from '../../../services/brand.service';
import {
  CreateCustomerDto,
  Customer,
  CustomerService
} from '../../../services/customer.service';
import { CustomerGroupService } from '../../../services/customer-group.service';
import { LayoutService } from '../../../services/layout.service';
import {
  PosCartLine,
  PosDraft,
  PosPaymentSplit,
  PosProduct,
  PosService
} from '../../../services/pos.service';
import { ProductCategoryService } from '../../../services/product-category.service';
import {
  CreateProductSaleDto,
  ProductSaleService
} from '../../../services/product-sale.service';
import { CreateSaleDto, SaleService } from '../../../services/sale.service';
import { WarehouseService } from '../../../services/warehouse.service';
import { GeneralSettingService } from '../../../services/general-setting.service';
import { PosBillPrintService } from './pos-bill-print.service';
import { PosCalculatorComponent } from './pos-calculator.component';

type FilterTab = 'category' | 'brand' | 'featured';
type EditField = 'discount' | 'coupon' | 'tax' | 'shipping';
type DiscountMode = 'percent' | 'amount';
type PaymentMethod =
  | 'cash' | 'card' | 'razorpay' | 'credit' | 'multiple'
  | 'installment' | 'deposit' | 'points';

interface SelectOption {
  label: string;
  value: number;
}

interface RecentSaleRow {
  saleId: number;
  referenceNo: string;
  customerId: number;
  warehouseId: number;
  grandTotal: number;
  saleStatus: number;
  paymentStatus: number;
  orderDiscount: number;
  couponDiscount: number;
  orderTax: number;
  shippingCost: number;
  saleNote: string;
  createdDate: string | null;
}

interface PriceTierOption {
  label: string;
  value: string;
  percentage: number;
}

@Component({
  selector: 'app-pos',
  imports: [AppModule, PosCalculatorComponent],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class PosComponent implements OnInit, OnDestroy {
  products: PosProduct[] = [];
  filteredProducts: PosProduct[] = [];
  cart: PosCartLine[] = [];
  customers: Customer[] = [];
  customerOptions: SelectOption[] = [];
  categories: { id: number; name: string }[] = [];
  brands: { id: number; name: string }[] = [];
  recentSales: RecentSaleRow[] = [];
  selectedRecentSale: RecentSaleRow | null = null;

  selectedCustomerId = 0;
  priceTier = 'retail';
  productSearch = '';
  activeFilterTab: FilterTab = 'category';
  selectedCategoryId: number | null = null;
  selectedBrandId: number | null = null;

  orderDiscountMode: DiscountMode = 'percent';
  orderDiscountInput = 0;
  couponDiscount = 0;
  orderTaxPercent = 0;
  shippingCost = 0;
  saleNote = '';

  defaultWarehouseId = 0;
  isLoading = true;
  isSubmitting = false;
  isFullscreen = false;

  customerDialogVisible = false;
  newCustomerName = '';
  editDialogVisible = false;
  editField: EditField = 'discount';
  editFieldValue = 0;
  editDiscountMode: DiscountMode = 'percent';
  paymentDialogVisible = false;
  paymentMethod: PaymentMethod = 'cash';
  paymentSplits: PosPaymentSplit[] = [{ method: 'Cash', amount: 0 }, { method: 'Card', amount: 0 }];
  installmentCount = 3;
  draftsDialogVisible = false;
  recentDialogVisible = false;
  recentLoading = false;
  recentBinding = false;
  moreMenuVisible = false;
  calculatorDialogVisible = false;
  drafts: PosDraft[] = [];

  readonly priceTierOptions: PriceTierOption[] = [
    { label: 'Retail', value: 'retail', percentage: 0 },
    { label: 'Wholesale', value: 'wholesale', percentage: -10 },
    { label: 'Distributor', value: 'distributor', percentage: 5 },
  ];

  private readonly saleStatusLabels: Record<number, string> = {
    1: 'Pending',
    2: 'Completed',
    3: 'Partial',
    4: 'Cancelled',
  };

  private readonly paymentStatusLabels: Record<number, string> = {
    1: 'Pending',
    2: 'Paid',
    3: 'Partial',
  };

  private groupPercentages: Record<number, number> = {};
  private lineKeyCounter = 0;
  private sidebarWasCollapsed = false;
  private readonly beepSound = new Audio('assets/barcode-beep-sound.m4a');
  siteTitle = 'Resta POS';
  currency = '';

  constructor(
    private posService: PosService,
    private saleService: SaleService,
    private productSaleService: ProductSaleService,
    private customerService: CustomerService,
    private customerGroupService: CustomerGroupService,
    private warehouseService: WarehouseService,
    private categoryService: ProductCategoryService,
    private brandService: BrandService,
    private auth: AuthService,
    private layout: LayoutService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private generalSettingService: GeneralSettingService,
    private posBillPrintService: PosBillPrintService
  ) {}

  ngOnInit(): void {
    this.beepSound.preload = 'auto';
    this.sidebarWasCollapsed = this.layout.sidebarCollapsed();
    if (!this.sidebarWasCollapsed) {
      this.layout.toggleSidebar();
    }
    this.loadData();
    this.drafts = this.posService.getDrafts();
    this.loadPrintSettings();
  }

  private loadPrintSettings(): void {
    this.generalSettingService.getAll({ pageSize: 1 }).pipe(catchError(() => of(null))).subscribe({
      next: (res: any) => {
        const row = res ? this.posService.extractItems(res)[0] : null;
        if (!row) return;
        if (row.siteTitle) this.siteTitle = String(row.siteTitle);
        if (row.currency) this.currency = String(row.currency);
      },
    });
  }

  ngOnDestroy(): void {
    if (!this.sidebarWasCollapsed && this.layout.sidebarCollapsed()) {
      this.layout.toggleSidebar();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'F2') {
      e.preventDefault();
      const el = document.getElementById('pos-product-search') as HTMLInputElement | null;
      el?.focus();
    }
  }

  get selectedCustomer(): Customer | undefined {
    return this.customers.find(c => c.customerId === this.selectedCustomerId);
  }

  get itemCount(): number {
    return this.cart.length;
  }

  get totalUnits(): number {
    return this.cart.reduce((s, l) => s + l.qty, 0);
  }

  get subtotal(): number {
    return this.round(this.cart.reduce((s, l) => s + l.price * l.qty, 0));
  }

  get orderDiscount(): number {
    if (this.orderDiscountInput <= 0) {
      return 0;
    }
    if (this.orderDiscountMode === 'percent') {
      const pct = Math.min(this.orderDiscountInput, 100);
      return this.round(this.subtotal * pct / 100);
    }
    return this.round(Math.min(this.orderDiscountInput, this.subtotal));
  }

  get lineTaxTotal(): number {
    return this.round(this.cart.reduce((s, l) => {
      const base = l.price * l.qty;
      return s + base * l.taxRate / 100;
    }, 0));
  }

  get taxableSubtotal(): number {
    return Math.max(0, this.round(this.subtotal - this.orderDiscount - this.couponDiscount));
  }

  get orderTax(): number {
    if (this.orderTaxPercent <= 0) {
      return 0;
    }
    const pct = Math.min(this.orderTaxPercent, 100);
    return this.round(this.taxableSubtotal * pct / 100);
  }

  get totalTax(): number {
    return this.round(this.lineTaxTotal + this.orderTax);
  }

  get totalBeforeGrand(): number {
    return this.round(this.subtotal + this.totalTax + this.shippingCost - this.orderDiscount - this.couponDiscount);
  }

  get grandTotal(): number {
    return Math.max(0, this.totalBeforeGrand);
  }

  get customerLabel(): string {
    return this.selectedCustomer?.name ?? 'Walk in Customer';
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      products: this.posService.loadProducts().pipe(catchError(() => of(null))),
      customers: this.customerService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      groups: this.customerGroupService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      warehouses: this.warehouseService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      categories: this.categoryService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
      brands: this.brandService.getAll({ pageSize: 500 }).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ products, customers, groups, warehouses, categories, brands }) => {
        const raw = products ? this.posService.extractItems(products) : [];
        this.finishLoadData(raw, customers, groups, warehouses, categories, brands);
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'POS', detail: 'Could not load POS data.' });
      },
    });
  }

  private bindCustomers(res: any): void {
    if (!res) return;
    const list = this.posService.extractItems(res).map((x: any) => this.mapCustomer(x));
    this.customers = list;
    this.customerOptions = list.map(c => ({ label: c.name, value: c.customerId }));
    const walkIn = list.find(c => c.name.toLowerCase().includes('walk-in'))
      ?? list.find(c => c.isActive)
      ?? list[0];
    if (walkIn) {
      this.selectedCustomerId = walkIn.customerId;
    }
  }

  private mapCustomer(x: any): Customer {
    return {
      customerId: Number(x.customerId ?? x.id ?? 0),
      customerGroupId: Number(x.customerGroupId ?? 0),
      userId: x.userId != null ? Number(x.userId) : null,
      name: x.name ?? '',
      companyName: x.companyName ?? '',
      email: x.email ?? '',
      phoneNumber: x.phoneNumber ?? '',
      taxNo: x.taxNo ?? '',
      address: x.address ?? '',
      city: x.city ?? '',
      state: x.state ?? '',
      postalCode: x.postalCode ?? '',
      country: x.country ?? '',
      points: x.points != null ? Number(x.points) : null,
      deposit: x.deposit != null ? Number(x.deposit) : null,
      expense: x.expense != null ? Number(x.expense) : null,
      isActive: x.isActive ?? true,
    };
  }

  private bindGroups(res: any): void {
    if (!res) return;
    this.posService.extractItems(res).forEach((x: any) => {
      const id = Number(x.customerGroupId ?? x.id ?? 0);
      const pct = parseFloat(x.percentage ?? '0') || 0;
      if (id > 0) this.groupPercentages[id] = pct;
    });
  }

  private bindWarehouses(res: any): void {
    if (!res) return;
    const list = this.posService.extractItems(res);
    if (list.length) {
      this.defaultWarehouseId = Number(list[0].warehouseId ?? list[0].id ?? 0);
    }
  }

  private finishLoadData(raw: any[], customers: any, groups: any, warehouses: any, categories: any, brands: any): void {
    this.products = raw.map(x => this.posService.mapProduct(x)).filter(p => p.productId > 0);
    this.bindCustomers(customers);
    this.bindGroups(groups);
    this.bindWarehouses(warehouses);
    this.categories = categories
      ? this.posService.extractItems(categories).map((x: any) => ({
      id: Number(x.categoryId ?? x.id ?? 0),
      name: x.name ?? x.categoryName ?? '',
    })).filter(c => c.id > 0)
      : [];
    this.brands = brands
      ? this.posService.extractItems(brands).map((x: any) => ({
      id: Number(x.brandId ?? x.id ?? 0),
      name: x.title ?? x.name ?? '',
    })).filter(b => b.id > 0)
      : [];
    this.applyProductFilters();
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  onCustomerChange(): void {
    const c = this.selectedCustomer;
    if (!c) return;
    const pct = this.groupPercentages[c.customerGroupId] ?? 0;
    if (pct < 0) this.priceTier = 'wholesale';
    else if (pct > 0) this.priceTier = 'distributor';
    else this.priceTier = 'retail';
    this.recalcCartPrices();
  }

  onPriceTierChange(): void {
    this.recalcCartPrices();
  }

  private recalcCartPrices(): void {
    const tier = this.priceTierOptions.find(t => t.value === this.priceTier);
    const groupPct = this.selectedCustomer
      ? (this.groupPercentages[this.selectedCustomer.customerGroupId] ?? 0)
      : 0;
    const pct = tier?.percentage ?? groupPct;
    this.cart = this.cart.map(line => {
      const product = this.products.find(p => p.productId === line.productId);
      if (!product) return line;
      return { ...line, price: this.applyPriceTier(product.price, pct) };
    });
  }

  private applyPriceTier(basePrice: number, percentage: number): number {
    return this.round(basePrice * (1 + percentage / 100));
  }

  getEffectivePrice(product: PosProduct): number {
    const tier = this.priceTierOptions.find(t => t.value === this.priceTier);
    const groupPct = this.selectedCustomer
      ? (this.groupPercentages[this.selectedCustomer.customerGroupId] ?? 0)
      : 0;
    return this.applyPriceTier(product.price, tier?.percentage ?? groupPct);
  }

  onSearchChange(): void {
    this.applyProductFilters();
  }

  onSearchEnter(): void {
    const term = this.productSearch.trim();
    if (!term) return;

    const lower = term.toLowerCase();
    const exact = this.products.find(p =>
      p.code.toLowerCase() === lower
      || String(p.productId) === term
    );
    const product = exact ?? (this.filteredProducts.length === 1 ? this.filteredProducts[0] : undefined);

    if (product) {
      this.addToCart(product);
      this.productSearch = '';
      this.applyProductFilters();
    }
  }

  setFilterTab(tab: FilterTab): void {
    this.activeFilterTab = tab;
    this.selectedCategoryId = null;
    this.selectedBrandId = null;
    this.applyProductFilters();
  }

  selectCategory(id: number): void {
    this.selectedCategoryId = this.selectedCategoryId === id ? null : id;
    this.applyProductFilters();
  }

  selectBrand(id: number): void {
    this.selectedBrandId = this.selectedBrandId === id ? null : id;
    this.applyProductFilters();
  }

  private applyProductFilters(): void {
    const term = this.productSearch.trim().toLowerCase();
    this.filteredProducts = this.products.filter(p => {
      const matchesSearch = !term
        || p.name.toLowerCase().includes(term)
        || p.code.toLowerCase().includes(term);
      const matchesCategory = this.activeFilterTab !== 'category'
        || this.selectedCategoryId == null
        || p.categoryId === this.selectedCategoryId;
      const matchesBrand = this.activeFilterTab !== 'brand'
        || this.selectedBrandId == null
        || p.brandId === this.selectedBrandId;
      const matchesFeatured = this.activeFilterTab !== 'featured'
        || (p.featured != null && p.featured > 0);
      return matchesSearch && matchesCategory && matchesBrand && matchesFeatured;
    });
  }

  addToCart(product: PosProduct): void {
    const price = this.getEffectivePrice(product);
    const existing = this.cart.find(l => l.productId === product.productId);
    if (existing) {
      const prevQty = existing.qty;
      this.changeQty(existing, 1);
      if (existing.qty > prevQty) {
        this.playAddToCartBeep();
      }
      return;
    }
    this.cart = [...this.cart, {
      lineKey: this.nextLineKey(),
      productId: product.productId,
      name: product.name,
      code: product.code,
      price,
      qty: 1,
      taxRate: product.taxRate,
      stockQty: product.stockQty,
      saleUnitId: product.saleUnitId,
    }];
    this.playAddToCartBeep();
  }

  changeQty(line: PosCartLine, delta: number): void {
    const qty = this.roundQty(line.qty + delta);
    if (qty <= 0) {
      this.removeLine(line);
      return;
    }
    if (line.stockQty > 0 && qty > line.stockQty) {
      this.messageService.add({ severity: 'warn', summary: 'Stock', detail: `Only ${line.stockQty} in stock.` });
      return;
    }
    line.qty = qty;
    this.cart = [...this.cart];
  }

  setQty(line: PosCartLine, value: number): void {
    const qty = this.roundQty(value);
    if (qty <= 0) {
      this.removeLine(line);
      return;
    }
    line.qty = qty;
    this.cart = [...this.cart];
  }

  removeLine(line: PosCartLine): void {
    this.cart = this.cart.filter(l => l.lineKey !== line.lineKey);
  }

  lineSubtotal(line: PosCartLine): number {
    return this.round(line.price * line.qty);
  }

  openEditField(field: EditField): void {
    this.editField = field;
    if (field === 'discount') {
      this.editDiscountMode = this.orderDiscountMode;
      this.editFieldValue = this.orderDiscountInput;
    } else if (field === 'tax') {
      this.editFieldValue = this.orderTaxPercent;
    } else {
      this.editFieldValue = field === 'coupon' ? this.couponDiscount
        : this.shippingCost;
    }
    this.editDialogVisible = true;
  }

  applyEditField(): void {
    const v = Math.max(0, this.editFieldValue ?? 0);
    switch (this.editField) {
      case 'discount':
        this.orderDiscountMode = this.editDiscountMode;
        this.orderDiscountInput = this.editDiscountMode === 'percent'
          ? Math.min(v, 100)
          : v;
        break;
      case 'coupon': this.couponDiscount = v; break;
      case 'tax': this.orderTaxPercent = Math.min(v, 100); break;
      case 'shipping': this.shippingCost = v; break;
    }
    this.editDialogVisible = false;
  }

  previewEditDiscount(): number {
    const v = Math.max(0, this.editFieldValue ?? 0);
    if (this.editDiscountMode === 'percent') {
      return this.round(this.subtotal * Math.min(v, 100) / 100);
    }
    return this.round(Math.min(v, this.subtotal));
  }

  previewEditTax(): number {
    const v = Math.min(Math.max(0, this.editFieldValue ?? 0), 100);
    return this.round(this.taxableSubtotal * v / 100);
  }

  openAddCustomer(): void {
    this.newCustomerName = '';
    this.customerDialogVisible = true;
  }

  saveNewCustomer(): void {
    const name = this.newCustomerName.trim();
    if (!name) return;
    const dto: CreateCustomerDto = {
      customerGroupId: 1,
      userId: null,
      name,
      companyName: null,
      email: null,
      phoneNumber: '',
      taxNo: null,
      address: '',
      city: '',
      state: null,
      postalCode: null,
      country: null,
      points: null,
      deposit: null,
      expense: null,
      isActive: true,
    };
    this.customerService.create(dto).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res;
        const added = this.mapCustomer(raw);
        if (added.customerId) {
          this.customers = [...this.customers, added];
          this.customerOptions = [...this.customerOptions, { label: added.name, value: added.customerId }];
          this.selectedCustomerId = added.customerId;
        }
        this.customerDialogVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Customer', detail: 'Customer added.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Customer', detail: 'Could not add customer.' });
      },
    });
  }

  onPayment(method: PaymentMethod): void {
    if (!this.cart.length) {
      this.messageService.add({ severity: 'warn', summary: 'Cart', detail: 'Add products to the cart first.' });
      return;
    }
    if (!this.defaultWarehouseId) {
      this.messageService.add({ severity: 'error', summary: 'Warehouse', detail: 'No warehouse configured.' });
      return;
    }
    if (!this.selectedCustomerId) {
      this.messageService.add({ severity: 'error', summary: 'Customer', detail: 'Select a customer.' });
      return;
    }

    if (method === 'multiple' || method === 'installment') {
      this.paymentMethod = method;
      this.paymentSplits = [
        { method: 'Cash', amount: method === 'installment' ? this.grandTotal / this.installmentCount : 0 },
        { method: 'Card', amount: 0 },
      ];
      this.paymentDialogVisible = true;
      return;
    }

    if (method === 'deposit') {
      const dep = this.selectedCustomer?.deposit ?? 0;
      if (dep < this.grandTotal) {
        this.messageService.add({ severity: 'warn', summary: 'Deposit', detail: 'Insufficient customer deposit.' });
        return;
      }
    }

    if (method === 'points') {
      const pts = this.selectedCustomer?.points ?? 0;
      if (pts < this.grandTotal) {
        this.messageService.add({ severity: 'warn', summary: 'Points', detail: 'Insufficient reward points.' });
        return;
      }
    }

    this.completeSale(method);
  }

  confirmMultiplePayment(): void {
    const total = this.round(this.paymentSplits.reduce((s, p) => s + (p.amount ?? 0), 0));
    if (Math.abs(total - this.grandTotal) > 0.02) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Payment',
        detail: `Split total (${this.formatMoney(total)}) must equal grand total (${this.formatMoney(this.grandTotal)}).`,
      });
      return;
    }
    this.paymentDialogVisible = false;
    this.completeSale(this.paymentMethod);
  }

  private completeSale(method: PaymentMethod): void {
    this.isSubmitting = true;
    const userId = this.auth.getUser()?.userId ?? 1;
    const paidAmount = method === 'credit' ? 0
      : method === 'installment' ? this.round(this.grandTotal / this.installmentCount)
      : this.grandTotal;
    const paymentStatus = method === 'credit' ? 1 : method === 'installment' ? 3 : 2;
    const ref = `POS-${Date.now()}`;
    const totals = this.buildTotals();

    const saleDto: CreateSaleDto = {
      referenceNo: ref,
      userId,
      cashRegisterId: null,
      customerId: this.selectedCustomerId,
      warehouseId: this.defaultWarehouseId,
      billerId: userId,
      item: totals.item,
      totalQty: totals.totalQty,
      totalDiscount: totals.totalDiscount,
      totalTax: totals.totalTax,
      totalPrice: totals.totalPrice,
      grandTotal: totals.grandTotal,
      orderTaxRate: this.orderTaxPercent > 0 ? this.orderTaxPercent : null,
      orderTax: this.orderTax,
      orderDiscount: this.orderDiscount,
      couponId: null,
      couponDiscount: this.couponDiscount,
      shippingCost: this.shippingCost,
      saleStatus: 2,
      paymentStatus,
      document: null,
      paidAmount,
      saleNote: this.saleNote?.trim() || `[${method.toUpperCase()}] POS sale`,
      staffNote: method === 'installment' ? `Installment x${this.installmentCount}` : null,
    };

    this.saleService.create(saleDto).pipe(
      switchMap((res: any) => {
        const saleId = Number((res?.data ?? res)?.saleId ?? (res?.data ?? res)?.id ?? 0);
        if (!saleId) throw new Error('Missing sale id');
        const creates = this.cart.map(line => {
          const sub = line.price * line.qty;
          const tax = this.round(sub * line.taxRate / 100);
          const dto: CreateProductSaleDto = {
            saleId,
            productId: line.productId,
            productBatchId: null,
            variantId: null,
            imeiNumber: null,
            qty: line.qty,
            saleUnitId: line.saleUnitId || 1,
            netUnitPrice: line.price,
            discount: 0,
            taxRate: line.taxRate,
            tax,
            total: this.round(sub + tax),
          };
          return this.productSaleService.create(dto);
        });
        return forkJoin(creates);
      })
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Sale Complete',
          detail: `${this.formatMoney(this.grandTotal)} — ${method.toUpperCase()}`,
        });
        this.clearCart();
      },
      error: () => {
        this.isSubmitting = false;
        this.messageService.add({ severity: 'error', summary: 'Sale Failed', detail: 'Could not complete sale.' });
      },
    });
  }

  private buildTotals() {
    return {
      item: this.itemCount,
      totalQty: this.totalUnits,
      totalDiscount: this.round(this.orderDiscount + this.couponDiscount),
      totalTax: this.totalTax,
      totalPrice: this.subtotal,
      grandTotal: this.grandTotal,
    };
  }

  saveDraft(): void {
    if (!this.cart.length) {
      this.messageService.add({ severity: 'warn', summary: 'Draft', detail: 'Cart is empty.' });
      return;
    }
    const draft: PosDraft = {
      id: `draft-${Date.now()}`,
      label: `${this.customerLabel} — ${this.formatMoney(this.grandTotal)}`,
      savedAt: new Date().toISOString(),
      customerId: this.selectedCustomerId,
      priceTier: this.priceTier,
      cart: this.cart.map(l => ({ ...l })),
      orderDiscount: this.orderDiscount,
      orderDiscountMode: this.orderDiscountMode,
      orderDiscountInput: this.orderDiscountInput,
      couponDiscount: this.couponDiscount,
      orderTax: this.orderTax,
      orderTaxPercent: this.orderTaxPercent,
      shippingCost: this.shippingCost,
      saleNote: this.saleNote,
    };
    this.drafts = [draft, ...this.drafts].slice(0, 20);
    this.posService.saveDrafts(this.drafts);
    this.messageService.add({ severity: 'success', summary: 'Draft Saved', detail: draft.label });
  }

  openDrafts(): void {
    this.drafts = this.posService.getDrafts();
    this.draftsDialogVisible = true;
  }

  loadDraft(draft: PosDraft): void {
    this.selectedCustomerId = draft.customerId;
    this.priceTier = draft.priceTier;
    this.cart = draft.cart.map(l => ({ ...l }));
    this.orderDiscountMode = draft.orderDiscountMode ?? 'percent';
    if (draft.orderDiscountInput != null) {
      this.orderDiscountInput = draft.orderDiscountInput;
    } else if (draft.orderDiscount > 0) {
      this.orderDiscountMode = 'amount';
      this.orderDiscountInput = draft.orderDiscount;
    } else {
      this.orderDiscountInput = 0;
    }
    this.couponDiscount = draft.couponDiscount;
    if (draft.orderTaxPercent != null) {
      this.orderTaxPercent = draft.orderTaxPercent;
    } else if (draft.orderTax > 0) {
      const base = Math.max(0, this.subtotal - this.orderDiscount - this.couponDiscount);
      this.orderTaxPercent = base > 0 ? this.round(draft.orderTax / base * 100) : 0;
    } else {
      this.orderTaxPercent = 0;
    }
    this.shippingCost = draft.shippingCost;
    this.saleNote = draft.saleNote;
    this.draftsDialogVisible = false;
  }

  deleteDraft(draft: PosDraft, event: Event): void {
    event.stopPropagation();
    this.drafts = this.drafts.filter(d => d.id !== draft.id);
    this.posService.saveDrafts(this.drafts);
  }

  cancelSale(): void {
    this.confirmationService.confirm({
      message: 'Clear the current cart?',
      header: 'Cancel Sale',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.clearCart(),
    });
  }

  clearCart(): void {
    this.cart = [];
    this.orderDiscountMode = 'percent';
    this.orderDiscountInput = 0;
    this.couponDiscount = 0;
    this.orderTaxPercent = 0;
    this.shippingCost = 0;
    this.saleNote = '';
  }

  openRecentTransactions(): void {
    this.recentLoading = true;
    this.selectedRecentSale = null;
    this.recentDialogVisible = true;
    this.saleService.getAll({ pageSize: 30 }).subscribe({
      next: (res: any) => {
        const raw = this.posService.extractItems(res);
        this.recentSales = raw
          .map((x: any) => this.mapRecentSale(x))
          .sort((a, b) => this.recentSortTime(b) - this.recentSortTime(a));
        this.recentLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.recentLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Recent Sales',
          detail: 'Could not load recent transactions.',
        });
      },
    });
  }

  selectRecentSale(sale: RecentSaleRow): void {
    this.selectedRecentSale = sale;
  }

  loadSelectedRecentSale(): void {
    if (!this.selectedRecentSale) return;
    this.bindRecentSaleToPos(this.selectedRecentSale);
  }

  bindRecentSaleToPos(row: RecentSaleRow): void {
    this.recentBinding = true;
    forkJoin({
      sale: this.saleService.getById(row.saleId),
      lines: this.productSaleService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ sale, lines }) => {
        const s = sale?.data ?? sale;
        const saleId = Number(s?.saleId ?? s?.id ?? row.saleId);

        if (s?.customerId) {
          this.selectedCustomerId = Number(s.customerId);
          this.onCustomerChange();
        }
        if (s?.warehouseId) {
          this.defaultWarehouseId = Number(s.warehouseId);
        }

        this.orderDiscountMode = 'amount';
        this.orderDiscountInput = Number(s?.orderDiscount ?? row.orderDiscount ?? 0);
        this.couponDiscount = Number(s?.couponDiscount ?? row.couponDiscount ?? 0);
        this.shippingCost = Number(s?.shippingCost ?? row.shippingCost ?? 0);
        this.saleNote = s?.saleNote ?? row.saleNote ?? '';

        const saleLines = this.posService.extractItems(lines)
          .filter((x: any) => Number(x.saleId ?? 0) === saleId);

        this.cart = saleLines.map((line: any) => {
          const productId = Number(line.productId ?? 0);
          const product = this.products.find(p => p.productId === productId);
          return {
            lineKey: this.nextLineKey(),
            productId,
            name: product?.name ?? `Product #${productId}`,
            code: product?.code ?? '',
            price: Number(line.netUnitPrice ?? 0),
            qty: Number(line.qty ?? 0),
            taxRate: Number(line.taxRate ?? product?.taxRate ?? 0),
            stockQty: product?.stockQty ?? 0,
            saleUnitId: Number(line.saleUnitId ?? product?.saleUnitId ?? 1),
          };
        });

        const orderTaxAmount = Number(s?.orderTax ?? row.orderTax ?? 0);
        const orderTaxRate = Number(s?.orderTaxRate ?? 0);
        if (orderTaxRate > 0) {
          this.orderTaxPercent = orderTaxRate;
        } else {
          const base = this.taxableSubtotal;
          this.orderTaxPercent = base > 0 && orderTaxAmount > 0
            ? this.round(orderTaxAmount / base * 100)
            : 0;
        }

        this.recentBinding = false;
        this.recentDialogVisible = false;
        this.selectedRecentSale = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Loaded',
          detail: `Sale ${row.referenceNo || saleId} loaded into POS.`,
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.recentBinding = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load the selected sale.',
        });
      },
    });
  }

  getCustomerName(customerId: number): string {
    if (!customerId) return '—';
    return this.customers.find(c => c.customerId === customerId)?.name ?? `Customer #${customerId}`;
  }

  getSaleStatusLabel(status: number): string {
    return this.saleStatusLabels[status] ?? String(status);
  }

  getPaymentStatusLabel(status: number): string {
    return this.paymentStatusLabels[status] ?? String(status);
  }

  formatSaleDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  private mapRecentSale(x: any): RecentSaleRow {
    return {
      saleId: Number(x.saleId ?? x.id ?? 0),
      referenceNo: x.referenceNo ?? '',
      customerId: Number(x.customerId ?? 0),
      warehouseId: Number(x.warehouseId ?? 0),
      grandTotal: Number(x.grandTotal ?? 0),
      saleStatus: Number(x.saleStatus ?? 0),
      paymentStatus: Number(x.paymentStatus ?? 0),
      orderDiscount: Number(x.orderDiscount ?? 0),
      couponDiscount: Number(x.couponDiscount ?? 0),
      orderTax: Number(x.orderTax ?? 0),
      shippingCost: Number(x.shippingCost ?? 0),
      saleNote: x.saleNote ?? '',
      createdDate: x.createdDate ?? x.modifiedDate ?? null,
    };
  }

  private recentSortTime(row: RecentSaleRow): number {
    if (!row.createdDate) return 0;
    const t = new Date(row.createdDate).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  goHome(): void {
    this.router.navigate(['/sale']);
  }

  openCalculator(): void {
    this.calculatorDialogVisible = true;
  }

  togglePosFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen?.();
      this.isFullscreen = false;
    }
  }

  printBill(): void {
    if (!this.cart.length) {
      this.messageService.add({ severity: 'info', summary: 'Print', detail: 'Add products to the cart first.' });
      return;
    }
    try {
      const user = this.auth.getUser();
      this.posBillPrintService.print({
        siteTitle: this.siteTitle,
        currency: this.currency,
        referenceNo: `BILL-${Date.now()}`,
        customerName: this.customerLabel,
        customerPhone: this.selectedCustomer?.phoneNumber || undefined,
        cashierName: user?.displayName || user?.userName || undefined,
        saleNote: this.saleNote,
        lines: this.cart.map(line => ({
          name: line.name,
          code: line.code,
          qty: line.qty,
          price: line.price,
          subtotal: this.lineSubtotal(line),
        })),
        itemCount: this.itemCount,
        totalUnits: this.totalUnits,
        subtotal: this.subtotal,
        orderDiscount: this.orderDiscount,
        couponDiscount: this.couponDiscount,
        lineTaxTotal: this.lineTaxTotal,
        orderTax: this.orderTax,
        totalTax: this.totalTax,
        shippingCost: this.shippingCost,
        grandTotal: this.grandTotal,
      });
    } catch (err) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Print',
        detail: err instanceof Error ? err.message : 'Could not print the bill.',
      });
    }
  }

  formatMoney(value: number | null | undefined): string {
    if (value == null) return '0.00';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDraftDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  productImage(product: PosProduct): string {
    return apiAssetUrl(product.image) || 'assets/images/product-placeholder.png';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect fill="#f1f5f9" width="120" height="120"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="sans-serif">No Image</text></svg>'
    );
  }

  private nextLineKey(): string {
    this.lineKeyCounter += 1;
    return `cart-${this.lineKeyCounter}`;
  }

  private playAddToCartBeep(): void {
    this.beepSound.currentTime = 0;
    this.beepSound.play().catch(() => {});
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private roundQty(value: number): number {
    return Math.max(0, Math.round(value * 1000) / 1000);
  }
}
