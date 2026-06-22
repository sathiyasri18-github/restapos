import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { forkJoin, Subject, debounceTime, takeUntil } from 'rxjs';
import { AppModule } from '../../../module/app.module';
import { GridReportConfig, GridReportToolbarComponent } from '../../../common/grid-report';
import { BrandService } from '../../../services/brand.service';
import { ProductCategoryService } from '../../../services/product-category.service';
import { ProductUnitService } from '../../../services/product-unit.service';
import { TaxService } from '../../../services/tax.service';
import {
  Product,
  ProductService,
  CreateProductDto,
  UpdateProductDto
} from '../../../services/product.service';

type DialogMode = 'add' | 'edit';

interface SelectOption {
  label: string;
  value: number;
}

interface FormErrors {
  name?: string;
  code?: string;
}

function emptyForm(): Product {
  return {
    productId: 0,
    name: '',
    code: '',
    type: 'standard',
    barcodeSymbology: 'C128',
    brandId: null,
    categoryId: null,
    unitId: null,
    purchaseUnitId: null,
    saleUnitId: null,
    cost: '0',
    price: '0',
    qty: null,
    alertQuantity: null,
    promotion: null,
    promotionPrice: null,
    startingDate: null,
    lastDate: null,
    taxId: null,
    taxMethod: null,
    image: null,
    file: null,
    isVariant: false,
    isBatch: false,
    isDiffprice: false,
    isImei: false,
    featured: null,
    productList: null,
    variantList: null,
    qtyList: null,
    priceList: null,
    productDetails: '',
    isActive: true,
    createdDate: null,
    modifiedDate: null,

    description: '',
    saleProductCost: 0,
    purchaseProductCost: 0,
    unit: null,
    unitName: '',
    discount: null,
    quantity: null,
    gst: null,
    cgst: null,
    sgst: null,
    tamilName: '',
    minQuantity: null,
    hsn: '',
  };
}

@Component({
  selector: 'app-product',
  imports: [AppModule, GridReportToolbarComponent],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  providers: [ConfirmationService, MessageService]
})
export class ProductComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  isLoading = false;
  totalRecords = 0;

  searchTerm = '';
  activeFilter: boolean | null = null;
  private search$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  dialogVisible = false;
  dialogMode: DialogMode = 'add';
  formData: Product = emptyForm();
  formErrors: FormErrors = {};
  isSaving = false;
  pendingImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isUploadingImage = false;

  lookupsLoaded = false;
  brandOptions: SelectOption[] = [];
  categoryOptions: SelectOption[] = [];
  unitOptions: SelectOption[] = [];
  taxOptions: SelectOption[] = [];

  readonly statusFilterOptions = [
    { label: 'All', value: null as boolean | null },
    { label: 'Active', value: true as boolean | null },
    { label: 'Inactive', value: false as boolean | null },
  ];

  constructor(
    private productService: ProductService,
    private brandService: BrandService,
    private categoryService: ProductCategoryService,
    private productUnitService: ProductUnitService,
    private taxService: TaxService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilter());
    this.loadLookups();
    this.loadProducts();
  }

  private loadLookups(): void {
    forkJoin({
      brands: this.brandService.getAll({ pageSize: 500 }),
      categories: this.categoryService.getAll({ pageSize: 500 }),
      units: this.productUnitService.getAll({ pageSize: 500 }),
      taxes: this.taxService.getAll({ pageSize: 500 }),
    }).subscribe({
      next: ({ brands, categories, units, taxes }) => {
        this.brandOptions = this.mapOptions(brands, 'brandId', 'title');
        this.categoryOptions = this.mapOptions(categories, 'categoryId', 'name', 'categoryName');
        this.unitOptions = this.mapUnitOptions(units);
        this.taxOptions = this.mapTaxOptions(taxes);
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

  private mapOptions(res: any, idKey: string, ...nameKeys: string[]): SelectOption[] {
    return this.extractItems(res)
      .map((x: any) => {
        const id = Number(x[idKey] ?? x.id ?? 0);
        const name = nameKeys.map(k => x[k]).find(v => v != null && v !== '') ?? `#${id}`;
        return { label: String(name), value: id };
      })
      .filter(option => option.value > 0);
  }

  private mapUnitOptions(res: any): SelectOption[] {
    return this.extractItems(res)
      .map((x: any) => {
        const id = Number(x.productUnitId ?? x.id ?? 0);
        const code = x.unitCode ?? '';
        const name = x.unitName ?? '';
        const label = code && name ? `${code} — ${name}` : (name || code || `#${id}`);
        return { label, value: id };
      })
      .filter(option => option.value > 0);
  }

  private mapTaxOptions(res: any): SelectOption[] {
    return this.extractItems(res)
      .map((x: any) => {
        const id = Number(x.taxId ?? x.id ?? 0);
        const name = x.name ?? '';
        const rate = x.rate != null ? Number(x.rate) : 0;
        const label = name ? `${name} (${rate}%)` : `#${id}`;
        return { label, value: id };
      })
      .filter(option => option.value > 0);
  }

  private extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get dialogTitle(): string {
    return this.dialogMode === 'add' ? 'Add Product' : 'Edit Product';
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm.trim() || this.activeFilter !== null;
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll({ pageSize: 500 }).subscribe({
      next: (res: any) => {
        const raw: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items) ? res.items
          : Array.isArray(res?.data) ? res.data
          : [];
        this.products = raw.map(x => this.mapProduct(x));
        this.totalRecords = res?.totalCount ?? this.products.length;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Could not load products. Please try again.'
        });
      }
    });
  }

  private mapProduct(x: any): Product {
    const cost = x.cost ?? (x.purchaseProductCost != null ? String(x.purchaseProductCost) : '0');
    const price = x.price ?? (x.saleProductCost != null ? String(x.saleProductCost) : '0');
    const qty = x.qty != null ? Number(x.qty) : (x.quantity != null ? Number(x.quantity) : null);
    const alertQuantity = x.alertQuantity != null ? Number(x.alertQuantity) : (x.minQuantity != null ? Number(x.minQuantity) : null);
    const productDetails = x.productDetails ?? x.description ?? '';
    const taxMethod = x.taxMethod != null ? Number(x.taxMethod) : null;
    return {
      productId: Number(x.productId ?? x.id ?? 0),
      name: x.name ?? '',
      code: x.code ?? '',
      type: x.type ?? 'standard',
      barcodeSymbology: x.barcodeSymbology ?? 'C128',
      brandId: x.brandId != null ? Number(x.brandId) : null,
      categoryId: x.categoryId != null ? Number(x.categoryId) : null,
      unitId: x.unitId != null ? Number(x.unitId) : (x.unit != null ? Number(x.unit) : null),
      purchaseUnitId: x.purchaseUnitId != null ? Number(x.purchaseUnitId) : null,
      saleUnitId: x.saleUnitId != null ? Number(x.saleUnitId) : null,
      cost: String(cost ?? '0'),
      price: String(price ?? '0'),
      qty,
      alertQuantity,
      promotion: x.promotion != null ? Number(x.promotion) : null,
      promotionPrice: x.promotionPrice ?? null,
      startingDate: x.startingDate ?? null,
      lastDate: x.lastDate ?? null,
      taxId: x.taxId != null ? Number(x.taxId) : null,
      taxMethod,
      image: x.image ?? null,
      file: x.file ?? null,
      isVariant: x.isVariant ?? false,
      isBatch: x.isBatch ?? false,
      isDiffprice: x.isDiffprice ?? false,
      isImei: x.isImei ?? false,
      featured: x.featured != null ? Number(x.featured) : null,
      productList: x.productList ?? null,
      variantList: x.variantList ?? null,
      qtyList: x.qtyList ?? null,
      priceList: x.priceList ?? null,
      productDetails,
      isActive: x.isActive ?? true,
      createdDate: x.createdDate ?? null,
      modifiedDate: x.modifiedDate ?? null,

      description: productDetails,
      saleProductCost: Number(price ?? 0),
      purchaseProductCost: Number(cost ?? 0),
      unit: x.unit != null ? Number(x.unit) : (x.unitId != null ? Number(x.unitId) : null),
      unitName: x.unitName ?? '',
      discount: x.discount != null ? Number(x.discount) : null,
      quantity: qty,
      gst: x.gst != null ? Number(x.gst) : null,
      cgst: x.cgst != null ? Number(x.cgst) : null,
      sgst: x.sgst != null ? Number(x.sgst) : null,
      tamilName: x.tamilName ?? '',
      minQuantity: alertQuantity,
      hsn: x.hsn ?? '',
    };
  }

  onSearchChange(): void { this.search$.next(); }
  onFilterChange(): void { this.applyFilter(); }
  onClearSearch(): void {
    this.searchTerm = '';
    this.activeFilter = null;
    this.applyFilter();
  }

  private applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = this.products.filter(p => {
      const matchesSearch = !term
        || p.name.toLowerCase().includes(term)
        || p.code.toLowerCase().includes(term)
        || (p.productDetails ?? '').toLowerCase().includes(term)
        || (p.hsn ?? '').toLowerCase().includes(term);
      const active = p.isActive ?? true;
      const matchesStatus = this.activeFilter === null || active === this.activeFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddDialog(): void {
    this.dialogMode = 'add';
    this.formData = emptyForm();
    this.formErrors = {};
    this.clearPendingImage();
    this.dialogVisible = true;
  }

  openEditDialog(product: Product): void {
    this.dialogMode = 'edit';
    this.formData = { ...product };
    this.formErrors = {};
    this.clearPendingImage();
    this.imagePreviewUrl = this.productService.resolveImageUrl(product.image);
    this.dialogVisible = true;
  }

  onEditSelected(): void { if (this.selectedProduct) this.openEditDialog(this.selectedProduct); }
  onDialogHide(): void {
    this.formErrors = {};
    this.isSaving = false;
    this.clearPendingImage();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.messageService.add({ severity: 'warn', summary: 'Image', detail: 'Please select an image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({ severity: 'warn', summary: 'Image', detail: 'Image must be 5 MB or smaller.' });
      return;
    }

    this.pendingImageFile = file;
    if (this.imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.imagePreviewUrl = URL.createObjectURL(file);

    if (this.dialogMode === 'edit' && this.formData.productId > 0) {
      this.uploadImageForProduct(this.formData.productId, file);
    }
  }

  removeImage(): void {
    if (this.dialogMode === 'edit' && this.formData.productId > 0 && this.formData.image) {
      this.isUploadingImage = true;
      this.productService.deleteImage(this.formData.productId).subscribe({
        next: (res: any) => {
          const updated = this.mapProduct(res?.data ?? res ?? { ...this.formData, image: null });
          this.applyProductUpdate(updated);
          this.clearPendingImage();
          this.isUploadingImage = false;
          this.messageService.add({ severity: 'success', summary: 'Image', detail: 'Product image removed.' });
        },
        error: () => {
          this.isUploadingImage = false;
          this.messageService.add({ severity: 'error', summary: 'Image', detail: 'Could not remove product image.' });
        },
      });
      return;
    }

    this.clearPendingImage();
  }

  productImageUrl(product: Product): string | null {
    return this.productService.resolveImageUrl(product.image);
  }

  private clearPendingImage(): void {
    if (this.imagePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
    this.pendingImageFile = null;
    this.imagePreviewUrl = this.productService.resolveImageUrl(this.formData.image);
  }

  private uploadImageForProduct(productId: number, file: File): void {
    this.isUploadingImage = true;
    this.productService.uploadImage(productId, file).subscribe({
      next: (res: any) => {
        const updated = this.mapProduct(res?.data ?? res);
        this.applyProductUpdate(updated);
        this.pendingImageFile = null;
        if (this.imagePreviewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(this.imagePreviewUrl);
        }
        this.imagePreviewUrl = this.productService.resolveImageUrl(updated.image);
        this.isUploadingImage = false;
        this.messageService.add({ severity: 'success', summary: 'Image', detail: 'Product image uploaded.' });
      },
      error: (err) => {
        this.isUploadingImage = false;
        const detail = err?.error?.message ?? 'Could not upload product image.';
        this.messageService.add({ severity: 'error', summary: 'Image', detail });
      },
    });
  }

  private applyProductUpdate(updated: Product): void {
    this.formData = { ...this.formData, ...updated };
    const idx = this.products.findIndex(p => p.productId === updated.productId);
    if (idx !== -1) {
      this.products = [...this.products.slice(0, idx), updated, ...this.products.slice(idx + 1)];
    }
    if (this.selectedProduct?.productId === updated.productId) {
      this.selectedProduct = updated;
    }
    this.applyFilter();
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.formData.name?.trim()) this.formErrors.name = 'Product name is required';
    if (!this.formData.code?.trim()) this.formErrors.code = 'Product code is required';
    return Object.keys(this.formErrors).length === 0;
  }

  onSave(): void {
    if (!this.validate()) return;
    this.isSaving = true;
    if (this.dialogMode === 'add') this.saveAdd();
    else this.saveEdit();
  }

  private toCreateDto(f: Product): CreateProductDto {
    return {
      name: f.name.trim(),
      code: f.code.trim(),
      type: f.type?.trim() || 'standard',
      barcodeSymbology: f.barcodeSymbology?.trim() || 'C128',
      brandId: f.brandId,
      categoryId: f.categoryId,
      unitId: f.unitId,
      purchaseUnitId: f.purchaseUnitId,
      saleUnitId: f.saleUnitId,
      cost: f.cost,
      price: f.price,
      qty: f.qty,
      alertQuantity: f.alertQuantity,
      promotion: f.promotion,
      promotionPrice: f.promotionPrice,
      startingDate: f.startingDate,
      lastDate: f.lastDate,
      taxId: f.taxId,
      taxMethod: f.taxMethod,
      image: f.image,
      file: f.file,
      isVariant: f.isVariant,
      isBatch: f.isBatch,
      isDiffprice: f.isDiffprice,
      isImei: f.isImei,
      featured: f.featured,
      productList: f.productList,
      variantList: f.variantList,
      qtyList: f.qtyList,
      priceList: f.priceList,
      productDetails: f.productDetails,
      isActive: f.isActive,
      createdBy: null
    };
  }

  private toUpdateDto(f: Product): UpdateProductDto {
    return { ...this.toCreateDto(f), modifiedBy: null };
  }

  private saveAdd(): void {
    this.productService.create(this.toCreateDto(this.formData)).subscribe({
      next: (res: any) => {
        const added = this.mapProduct(res?.data ?? res ?? this.formData);
        const pendingFile = this.pendingImageFile;

        const complete = (product: Product) => {
          this.products = [...this.products, product];
          this.totalRecords++;
          this.applyFilter();
          this.dialogVisible = false;
          this.isSaving = false;
          this.clearPendingImage();
          this.messageService.add({ severity: 'success', summary: 'Product Added', detail: `"${product.name}" was added successfully.` });
        };

        if (pendingFile && added.productId > 0) {
          this.productService.uploadImage(added.productId, pendingFile).subscribe({
            next: (uploadRes: any) => {
              complete(this.mapProduct(uploadRes?.data ?? uploadRes ?? added));
            },
            error: () => {
              complete(added);
              this.messageService.add({ severity: 'warn', summary: 'Image', detail: 'Product saved, but image upload failed.' });
            },
          });
          return;
        }

        complete(added);
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: 'Could not add product. Please try again.' });
      }
    });
  }

  private saveEdit(): void {
    this.productService.update(this.formData.productId, this.toUpdateDto(this.formData)).subscribe({
      next: () => {
        const idx = this.products.findIndex(p => p.productId === this.formData.productId);
        if (idx !== -1) {
          this.products = [...this.products.slice(0, idx), { ...this.formData }, ...this.products.slice(idx + 1)];
        }
        if (this.selectedProduct?.productId === this.formData.productId) {
          this.selectedProduct = { ...this.formData };
        }
        this.applyFilter();
        this.dialogVisible = false;
        this.isSaving = false;
        this.messageService.add({ severity: 'success', summary: 'Product Updated', detail: `"${this.formData.name}" was updated successfully.` });
      },
      error: () => {
        this.isSaving = false;
        this.messageService.add({ severity: 'error', summary: 'Update Failed', detail: 'Could not update product. Please try again.' });
      }
    });
  }

  confirmDelete(product: Product, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Delete "<strong>${product.name}</strong>"? This action cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-outlined p-button-sm',
      accept: () => this.executeDelete(product)
    });
  }

  onDeleteSelected(event: Event): void { if (this.selectedProduct) this.confirmDelete(this.selectedProduct, event); }

  private executeDelete(product: Product): void {
    this.productService.delete(product.productId).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.productId !== product.productId);
        if (this.selectedProduct?.productId === product.productId) this.selectedProduct = null;
        this.totalRecords--;
        this.applyFilter();
        this.messageService.add({ severity: 'success', summary: 'Product Deleted', detail: `"${product.name}" was deleted.` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Delete Failed', detail: 'Could not delete product. Please try again.' });
      }
    });
  }

  get productReportConfig(): GridReportConfig {
    return {
      title: 'Product List',
      subtitle: this.hasActiveFilters ? `Search: ${this.searchTerm || '—'}` : undefined,
      fileName: 'products',
      columns: [
        { header: '#', field: '_index', align: 'center' },
        { header: 'Name', field: 'name' },
        { header: 'Code', field: 'code' },
        { header: 'Type', field: 'type' },
        { header: 'Cost', field: 'cost' },
        { header: 'Price', field: 'price' },
        { header: 'Qty', field: 'qty', align: 'right' },
        { header: 'Active', field: 'isActive', align: 'center' },
      ],
      rows: this.filteredProducts.map(p => ({
        name: p.name,
        code: p.code || '—',
        type: p.type || '—',
        cost: p.cost || '0',
        price: p.price || '0',
        qty: p.qty ?? '—',
        isActive: p.isActive ? 'Yes' : 'No',
      }))
    };
  }
}

