// product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl, apiAssetUrl } from '../core/api-config';

// ─── Domain Model (mirrors ProductDto) ────────────────────────────────────────
export interface Product {
  productId:            number;
  name:                 string;
  code:                 string;
  type:                 string;
  barcodeSymbology:     string;
  brandId:              number | null;
  categoryId:           number | null;
  unitId:               number | null;
  purchaseUnitId:       number | null;
  saleUnitId:           number | null;
  cost:                 string;
  price:                string;
  qty:                  number | null;
  alertQuantity:        number | null;
  promotion:            number | null;
  promotionPrice:       string | null;
  startingDate:         string | null;
  lastDate:             string | null;
  taxId:                number | null;
  taxMethod:            number | null;
  image:                string | null;
  file:                 string | null;
  isVariant:            boolean | null;
  isBatch:              boolean | null;
  isDiffprice:          boolean | null;
  isImei:               boolean | null;
  featured:             number | null;
  productList:          string | null;
  variantList:          string | null;
  qtyList:              string | null;
  priceList:            string | null;
  productDetails:       string | null;
  isActive:             boolean | null;
  createdDate:          string | null;
  modifiedDate:         string | null;

  // Legacy/compat fields used across existing pages
  description:          string;
  saleProductCost:      number | null;
  purchaseProductCost:  number | null;
  unit:                 number | null;
  unitName:             string;
  discount:             number | null;
  quantity:             number | null;
  gst:                  number | null;
  cgst:                 number | null;
  sgst:                 number | null;
  tamilName:            string;
  minQuantity:          number | null;
  hsn:                  string;
}

// ─── API DTOs ─────────────────────────────────────────────────────────────────
export interface CreateProductDto {
  name:                 string;
  code?:                string | null;
  type?:                string | null;
  barcodeSymbology?:    string | null;
  brandId?:             number | null;
  categoryId?:          number | null;
  unitId?:              number | null;
  purchaseUnitId?:      number | null;
  saleUnitId?:          number | null;
  cost?:                string | null;
  price?:               string | null;
  qty?:                 number | null;
  alertQuantity?:       number | null;
  promotion?:           number | null;
  promotionPrice?:      string | null;
  startingDate?:        string | null;
  lastDate?:            string | null;
  taxId?:               number | null;
  taxMethod?:           number | null;
  image?:               string | null;
  file?:                string | null;
  isVariant?:           boolean | null;
  isBatch?:             boolean | null;
  isDiffprice?:         boolean | null;
  isImei?:              boolean | null;
  featured?:            number | null;
  productList?:         string | null;
  variantList?:         string | null;
  qtyList?:             string | null;
  priceList?:           string | null;
  productDetails?:      string | null;
  isActive?:            boolean | null;

  // Legacy request fields accepted by backend mapper
  description?:         string | null;
  saleProductCost?:     number | null;
  purchaseProductCost?: number | null;
  unit?:                number | null;
  discount?:            number | null;
  quantity?:            number | null;
  gst?:                 number | null;
  cgst?:                number | null;
  sgst?:                number | null;
  tamilName?:           string | null;
  minQuantity?:         number | null;
  hsn?:                 string | null;
  createdBy?:           number | null;
}

export interface UpdateProductDto {
  name?:                string;
  code?:                string | null;
  type?:                string | null;
  barcodeSymbology?:    string | null;
  brandId?:             number | null;
  categoryId?:          number | null;
  unitId?:              number | null;
  purchaseUnitId?:      number | null;
  saleUnitId?:          number | null;
  cost?:                string | null;
  price?:               string | null;
  qty?:                 number | null;
  alertQuantity?:       number | null;
  promotion?:           number | null;
  promotionPrice?:      string | null;
  startingDate?:        string | null;
  lastDate?:            string | null;
  taxId?:               number | null;
  taxMethod?:           number | null;
  image?:               string | null;
  file?:                string | null;
  isVariant?:           boolean | null;
  isBatch?:             boolean | null;
  isDiffprice?:         boolean | null;
  isImei?:              boolean | null;
  featured?:            number | null;
  productList?:         string | null;
  variantList?:         string | null;
  qtyList?:             string | null;
  priceList?:           string | null;
  productDetails?:      string | null;
  isActive?:            boolean | null;

  // Legacy request fields accepted by backend mapper
  description?:         string | null;
  saleProductCost?:     number | null;
  purchaseProductCost?: number | null;
  unit?:                number | null;
  discount?:            number | null;
  quantity?:            number | null;
  gst?:                 number | null;
  cgst?:                number | null;
  sgst?:                number | null;
  tamilName?:           string | null;
  minQuantity?:         number | null;
  hsn?:                 string | null;
  modifiedBy?:          number | null;
}

export interface ProductListParams {
  search?:     string;
  pageNumber?: number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly apiUrl = apiUrl('Products');

  constructor(private http: HttpClient) {}

  getAll(params: ProductListParams = {}): Observable<any> {
    let p = new HttpParams();
    if (params.search)     p = p.set('search',     params.search);
    if (params.pageNumber) p = p.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize)   p = p.set('pageSize',   params.pageSize.toString());
    return this.http.get<any>(this.apiUrl, { params: p });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateProductDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateProductDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  uploadImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<any>(`${this.apiUrl}/${id}/image`, formData);
  }

  deleteImage(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/image`);
  }

  resolveImageUrl(path: string | null | undefined): string | null {
    return apiAssetUrl(path);
  }
}
