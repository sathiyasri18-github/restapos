import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../core/api-config';

export interface PosProduct {
  productId: number;
  name: string;
  code: string;
  price: number;
  stockQty: number;
  brandId: number | null;
  categoryId: number;
  featured: number;
  image: string | null;
  saleUnitId: number;
  taxRate: number;
}

export interface PosCartLine {
  lineKey: string;
  productId: number;
  name: string;
  code: string;
  price: number;
  qty: number;
  taxRate: number;
  stockQty: number;
  saleUnitId: number;
}

export interface PosDraft {
  id: string;
  label: string;
  savedAt: string;
  customerId: number;
  priceTier: string;
  cart: PosCartLine[];
  orderDiscount: number;
  orderDiscountMode?: 'percent' | 'amount';
  orderDiscountInput?: number;
  couponDiscount: number;
  orderTax: number;
  orderTaxPercent?: number;
  shippingCost: number;
  saleNote: string;
}

export interface PosPaymentSplit {
  method: string;
  amount: number;
}

export const POS_DRAFTS_KEY = 'restapos_pos_drafts';

@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly productUrl = apiUrl('Products');

  constructor(private http: HttpClient) {}

  loadProducts(): Observable<any> {
    const params = new HttpParams().set('pageSize', '500');
    return this.http.get<any>(this.productUrl, { params });
  }

  mapProduct(x: any): PosProduct {
    const priceRaw = x.price ?? x.saleProductCost ?? x.PromotionPrice ?? '0';
    const price = typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw)) || 0;
    return {
      productId: Number(x.productId ?? x.id ?? x.Id ?? 0),
      name: x.name ?? x.Name ?? '',
      code: x.code ?? x.Code ?? x.hsn ?? '',
      price,
      stockQty: Number(x.qty ?? x.quantity ?? x.Qty ?? 0),
      brandId: x.brandId ?? x.BrandId ?? null,
      categoryId: Number(x.categoryId ?? x.CategoryId ?? 0),
      featured: Number(x.featured ?? x.Featured ?? 0),
      image: x.image ?? x.Image ?? null,
      saleUnitId: Number(x.saleUnitId ?? x.SaleUnitId ?? x.unit ?? x.UnitId ?? 0),
      taxRate: Number(x.gst ?? x.taxRate ?? x.TaxId ?? 0),
    };
  }

  extractItems(res: any): any[] {
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
  }

  getDrafts(): PosDraft[] {
    try {
      const raw = localStorage.getItem(POS_DRAFTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveDrafts(drafts: PosDraft[]): void {
    localStorage.setItem(POS_DRAFTS_KEY, JSON.stringify(drafts));
  }
}
