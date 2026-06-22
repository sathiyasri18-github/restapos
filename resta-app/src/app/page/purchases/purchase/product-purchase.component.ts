import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../../module/app.module';

export interface PurchaseLine {
  rowNo: number;
  product: string;
  unit: string;
  quantity: number;
  price: number;
  gst: number;
  amount: number;
}

export interface PurchaseOrder {
  id: number;
  code: string;
  date: string;
  orderNo: string;
  supplier: string;
  totQuantity: number;
  totAmount: number;
}

export interface SearchProduct {
  id: number;
  name: string;
  description: string;
  quantity: number;
  gst: number;
  unit: string;
}

@Component({
  selector: 'app-product-purchase',
  imports: [AppModule],
  templateUrl: './product-purchase.component.html',
  styleUrls: ['./product-purchase.component.scss'],
  providers: [MessageService],
})
export class ProductPurchaseComponent implements OnInit {

  // ── Header fields ──────────────────────────────────────────────
  purchaseNo: string = 'PUR003297';
  purchaseDate: Date = new Date('2025-04-01');
  orderNo: string = '1';
  supplier: string = 'SHOP';
  supplierOptions = ['SHOP', 'VIMAL TRADERS', 'OTHER'];

  // ── Search (right panel) ───────────────────────────────────────
  searchCustomer: string = '';
  searchCode: string = '';
  searchFromDate: Date = new Date('2025-03-11');
  searchToDate: Date = new Date('2026-05-10');

  // ── Purchase Lines ─────────────────────────────────────────────
  purchaseLines: PurchaseLine[] = [];
  selectedLine: PurchaseLine | null = null;

  // ── Purchase Orders ────────────────────────────────────────────
  purchaseOrders: PurchaseOrder[] = [];
  selectedOrder: PurchaseOrder | null = null;

  // ── Totals ─────────────────────────────────────────────────────
  get totalQuantity(): number { return this.purchaseLines.reduce((s, l) => s + l.quantity, 0); }
  get taxAmount(): number     { return this.purchaseLines.reduce((s, l) => s + l.gst, 0); }
  get subTotal(): number      { return this.purchaseLines.reduce((s, l) => s + l.amount, 0); }
  get netAmount(): number     { return this.subTotal; }

  // ── Search Product Dialog ──────────────────────────────────────
  displaySearchProduct: boolean = false;
  searchDescription: string = '';
  searchTamilName: string = '';
  date: Date = new Date();
  searchProductResults: SearchProduct[] = [];
  allProducts: SearchProduct[] = [];
  selectedSearchProduct: SearchProduct | null = null;

  ngOnInit(): void {
    this.purchaseLines = [
      { rowNo:1,  product:'1லி பிரியம் கோல்டு',       unit:'BOX',    quantity:2519, price:1.00, gst:0.00, amount:2519.00 },
      { rowNo:2,  product:'1லி கோல்டுவின்னர்',          unit:'BOX',    quantity:2193, price:1.00, gst:0.00, amount:2193.00 },
      { rowNo:3,  product:'1லி திரும் ஆயில்',          unit:'PIEACE', quantity:1130, price:1.00, gst:0.00, amount:1130.00 },
      { rowNo:4,  product:'1லி மார்சல்',                unit:'BOX',    quantity:861,  price:1.00, gst:0.00, amount:861.00  },
      { rowNo:5,  product:'1.2லி திரும் ஆயில்',        unit:'PIEACE', quantity:812,  price:1.00, gst:0.00, amount:812.00  },
      { rowNo:6,  product:'1.2லி பிரியம் கோல்டு',      unit:'BOX',    quantity:696,  price:1.00, gst:0.00, amount:696.00  },
      { rowNo:7,  product:'',                            unit:'BOX',    quantity:639,  price:1.00, gst:0.00, amount:639.00  },
      { rowNo:8,  product:'1லி மிஸ்டர் கோல்டு',        unit:'BOX',    quantity:560,  price:1.00, gst:0.00, amount:560.00  },
      { rowNo:9,  product:'1லி பாமாயில்',               unit:'BOX',    quantity:505,  price:1.00, gst:0.00, amount:505.00  },
      { rowNo:10, product:'50கி சர்க்கரை',              unit:'BAG',    quantity:457,  price:1.00, gst:0.00, amount:457.00  },
      { rowNo:11, product:'1லி கார்டியா க.எண்ணைய்',    unit:'PIEACE', quantity:439,  price:1.00, gst:0.00, amount:439.00  },
      { rowNo:12, product:'50கி சாவி மைதா',             unit:'BAG',    quantity:389,  price:1.00, gst:0.00, amount:389.00  },
      { rowNo:13, product:'5லி கோல்டுவின்னர் கேன்',    unit:'CAN',    quantity:329,  price:1.00, gst:0.00, amount:329.00  },
      { rowNo:14, product:'50மி பெருங்காயம்',           unit:'PIEACE', quantity:322,  price:1.00, gst:0.00, amount:322.00  },
    ];

    this.purchaseOrders = [
      { id:1, code:'PUR03298', date:'5/13/2025 4:4...', orderNo:'1', supplier:'VIMAL TRADERS', totQuantity:20,    totAmount:82745.00 },
      { id:2, code:'PUR03297', date:'4/1/2025 1:23...', orderNo:'1', supplier:'SHOP',          totQuantity:11851, totAmount:11851.00 },
    ];

    this.allProducts = [
      { id:1, name:'1லி ஜெம்',  description:'1L GEM GOLD', quantity:-6, gst:0, unit:'BOX' },
      { id:2, name:'1லி கிரீன்', description:'1L GREEN GOLD', quantity:10, gst:5, unit:'BOX' },
      { id:3, name:'5லி கேன்',   description:'5L CAN OIL',    quantity:20, gst:0, unit:'CAN' },
    ];
    this.searchProductResults = [...this.allProducts];
  }

  // ── Purchase Line actions ──────────────────────────────────────
  addLine(): void {
    const next = this.purchaseLines.length + 1;
    this.purchaseLines = [...this.purchaseLines, { rowNo:next, product:'', unit:'BOX', quantity:0, price:0, gst:0, amount:0 }];
  }

  deleteLine(): void {
    if (this.selectedLine) {
      this.purchaseLines = this.purchaseLines.filter(l => l.rowNo !== this.selectedLine!.rowNo);
      this.selectedLine = null;
    }
  }

  openSearchProduct(): void {
    this.displaySearchProduct = true;
    this.searchDescription = '';
    this.searchTamilName = '';
    this.searchProductResults = [...this.allProducts];
  }

  onSearchProduct(): void {
    this.searchProductResults = this.allProducts.filter(p =>
      p.description.toLowerCase().includes(this.searchDescription.toLowerCase()) ||
      p.name.includes(this.searchTamilName)
    );
  }

  selectSearchProduct(product: SearchProduct): void {
    this.selectedSearchProduct = product;
  }

  confirmProductSelection(): void {
    if (this.selectedSearchProduct && this.selectedLine) {
      const idx = this.purchaseLines.findIndex(l => l.rowNo === this.selectedLine!.rowNo);
      if (idx !== -1) {
        this.purchaseLines[idx].product = this.selectedSearchProduct.name;
        this.purchaseLines[idx].unit = this.selectedSearchProduct.unit;
      }
    }
    this.displaySearchProduct = false;
  }

  // ── Purchase Order actions ─────────────────────────────────────
  onViewPurchaseOrder(): void {
    if (this.selectedOrder) {
      alert(`Viewing Purchase Order: ${this.selectedOrder.code}`);
    }
  }

  // ── Bottom actions ─────────────────────────────────────────────
  onSave():   void { alert('Saved!'); }
  onDelete(): void { this.deleteLine(); }
  onExcel():  void { alert('Exporting to Excel...'); }

  formatCurrency(val: number): string {
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }
}
