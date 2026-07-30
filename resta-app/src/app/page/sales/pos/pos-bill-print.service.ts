import { Injectable } from '@angular/core';

export interface PosBillLine {
  name: string;
  code: string;
  qty: number;
  price: number;
  subtotal: number;
  taxRate?: number;
}

export interface PosBillPrintData {
  siteTitle: string;
  storeSubtitle?: string;
  storeAddress?: string;
  storePhone?: string;
  gstin?: string;
  billerName?: string;
  currency: string;
  referenceNo: string;
  orderNo?: string;
  customerName: string;
  customerPhone?: string;
  cashierName?: string;
  saleNote?: string;
  paxCount?: number;
  paymentMethod?: string;
  tenderAmount?: number;
  lines: PosBillLine[];
  itemCount: number;
  totalUnits: number;
  subtotal: number;
  orderDiscount: number;
  couponDiscount: number;
  lineTaxTotal: number;
  orderTax: number;
  orderTaxPercent?: number;
  taxMode?: 'Inclusive' | 'Exclusive';
  totalTax: number;
  shippingCost: number;
  grandTotal: number;
}

interface GstSplitRow {
  halfRate: number;
  cgst: number;
  sgst: number;
}

@Injectable({ providedIn: 'root' })
export class PosBillPrintService {
  private printFrame: HTMLIFrameElement | null = null;

  print(data: PosBillPrintData): void {
    const html = this.buildReceiptHtml(data);
    const frame = this.getPrintFrame();
    const win = frame.contentWindow;
    const doc = win?.document;

    if (!win || !doc) {
      throw new Error('Could not prepare print document.');
    }

    doc.open();
    doc.write(html);
    doc.close();

    const triggerPrint = () => {
      win.focus();
      win.print();
    };

    if (doc.readyState === 'complete') {
      setTimeout(triggerPrint, 100);
    } else {
      frame.onload = () => setTimeout(triggerPrint, 100);
    }
  }

  private getPrintFrame(): HTMLIFrameElement {
    if (this.printFrame?.isConnected) {
      return this.printFrame;
    }

    const frame = document.createElement('iframe');
    frame.setAttribute('title', 'Print bill');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(frame);
    this.printFrame = frame;
    return frame;
  }

  private buildReceiptHtml(data: PosBillPrintData): string {
    const now = new Date();
    const timeStr = now.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const dateStr = now
      .toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/ /g, '-');
    const printedAt = `${timeStr} ${dateStr}`;
    const money = (value: number) => this.formatMoney(value);

    const lineRows = data.lines.map(line => `
      <tr>
        <td class="col-product">${this.escapeHtml(line.name)}</td>
        <td class="col-qty">${this.formatQty(line.qty)}</td>
        <td class="col-rate">${money(line.price)}</td>
        <td class="col-amt">${money(line.subtotal)}</td>
      </tr>
    `).join('');

    const gstRows = this.buildGstRows(data);
    const displayTotal = Math.round(data.grandTotal);
    const roundOff = this.round(displayTotal - data.grandTotal);
    const tender = data.tenderAmount ?? displayTotal;
    const payMode = this.formatPayMode(data.paymentMethod, tender);
    const orderNo = data.orderNo || data.referenceNo;
    const userLabel = this.shortUser(data.cashierName);
    const pax = data.paxCount ?? 1;

    const subtitle = data.storeSubtitle
      ? `<div class="store-line">${this.escapeHtml(data.storeSubtitle)}</div>`
      : '';
    const address = data.storeAddress
      ? `<div class="store-line">${this.escapeHtml(data.storeAddress)}</div>`
      : '';
    const phone = data.storePhone
      ? `<div class="store-line">Ph : ${this.escapeHtml(data.storePhone)}</div>`
      : '';
    const gstin = data.gstin
      ? `<div class="store-line">GSTIN NO:${this.escapeHtml(data.gstin)}</div>`
      : '';
    const biller = data.billerName
      ? `<div class="store-line">Biller: ${this.escapeHtml(data.billerName)}</div>`
      : '';
    const note = data.saleNote?.trim()
      ? `<div class="note">${this.escapeHtml(data.saleNote.trim())}</div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${this.escapeHtml(data.referenceNo)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 80mm;
      margin: 0 auto;
      padding: 4mm 3mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .store-name {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }
    .store-line { text-align: center; font-size: 11px; }
    .bill-label {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      margin: 6px 0 4px;
    }
    .dash {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      gap: 4px;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .order-no {
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      margin: 4px 0;
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 11px;
    }
    table.items th {
      font-weight: 700;
      padding: 2px 0;
      border-bottom: 1px dashed #000;
    }
    table.items td {
      padding: 3px 0;
      vertical-align: top;
      word-break: break-word;
    }
    .col-product { width: 42%; text-align: left; padding-right: 2px; }
    .col-qty { width: 12%; text-align: right; }
    .col-rate { width: 23%; text-align: right; }
    .col-amt { width: 23%; text-align: right; }
    .totals { font-size: 11px; }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .total-row.indent { padding-left: 8px; }
    .grand-total {
      font-weight: 700;
      font-size: 12px;
      margin: 4px 0;
    }
    .amount-words {
      text-align: center;
      font-size: 10px;
      margin: 4px 0 6px;
    }
    .pay-row { margin-bottom: 2px; }
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: 11px;
    }
    .footer .thanks { margin-bottom: 8px; }
    .note {
      margin-top: 8px;
      font-size: 10px;
      text-align: center;
    }
    @media print {
      body { width: 80mm; margin: 0; padding: 2mm; }
      @page { size: 80mm auto; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="store-name">${this.escapeHtml(data.siteTitle)}</div>
    ${subtitle}
    ${address}
    ${phone}
    ${gstin}
    ${biller}
  </div>
  <div class="bill-label">Bill</div>
  <hr class="dash" />
  <div class="meta">
    <span>Memo# ${this.escapeHtml(data.referenceNo)}</span>
    <span>${this.escapeHtml(printedAt)}</span>
  </div>
  <div class="meta">
    <span>User: ${this.escapeHtml(userLabel)}</span>
    <span>Pax# ${pax}</span>
  </div>
  <div class="order-no">Order# ${this.escapeHtml(orderNo)}</div>
  <hr class="dash" />
  <table class="items">
    <thead>
      <tr>
        <th class="col-product">Product</th>
        <th class="col-qty">Qty</th>
        <th class="col-rate">Rate</th>
        <th class="col-amt">Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>
  <hr class="dash" />
  <div class="totals">
    <div class="total-row"><span>Sub Total</span><span>${money(data.subtotal)}</span></div>
    ${gstRows}
    ${data.orderDiscount > 0 ? `<div class="total-row indent"><span>Discount</span><span>-${money(data.orderDiscount)}</span></div>` : ''}
    ${data.couponDiscount > 0 ? `<div class="total-row indent"><span>Coupon</span><span>-${money(data.couponDiscount)}</span></div>` : ''}
    ${data.shippingCost > 0 ? `<div class="total-row indent"><span>Shipping</span><span>${money(data.shippingCost)}</span></div>` : ''}
    ${roundOff !== 0 ? `<div class="total-row indent"><span>Round Off</span><span>${money(roundOff)}</span></div>` : ''}
    <div class="total-row grand-total">
      <span>Total Qty: ${this.formatQty(data.totalUnits)} Amt:</span>
      <span>${money(displayTotal)}</span>
    </div>
  </div>
  <div class="amount-words">${this.escapeHtml(this.amountInWords(displayTotal))}</div>
  <div class="pay-row">Tender: ${money(tender)}</div>
  <div class="pay-row">Pay Mode: ${this.escapeHtml(payMode)}</div>
  ${note}
  <div class="footer">
    <div class="thanks">Thank you, please visit again</div>
    <div>E &amp; OE</div>
  </div>
</body>
</html>`;
  }

  private buildGstRows(data: PosBillPrintData): string {
    return this.computeGstSplits(data)
      .flatMap(row => [
        `<div class="total-row indent"><span>C Gst @ ${this.formatRate(row.halfRate)}%</span><span>${this.formatMoney(row.cgst)}</span></div>`,
        `<div class="total-row indent"><span>S Gst @ ${this.formatRate(row.halfRate)}%</span><span>${this.formatMoney(row.sgst)}</span></div>`,
      ])
      .join('');
  }

  private computeGstSplits(data: PosBillPrintData): GstSplitRow[] {
    const buckets = new Map<number, number>();
    const inclusive = data.taxMode !== 'Exclusive';

    for (const line of data.lines) {
      const rate = line.taxRate ?? 0;
      if (rate <= 0) continue;
      buckets.set(rate, (buckets.get(rate) ?? 0) + line.subtotal);
    }

    const rows: GstSplitRow[] = [];
    for (const [rate, base] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
      const tax = inclusive
        ? this.round(base * rate / (100 + rate))
        : this.round(base * rate / 100);
      rows.push({ halfRate: rate / 2, cgst: this.round(tax / 2), sgst: this.round(tax / 2) });
    }

    if (data.orderTax > 0) {
      const rate = data.orderTaxPercent && data.orderTaxPercent > 0
        ? data.orderTaxPercent
        : this.round((data.orderTax / Math.max(data.subtotal - data.orderDiscount - data.couponDiscount, 1)) * 100);
      rows.push({ halfRate: rate / 2, cgst: this.round(data.orderTax / 2), sgst: this.round(data.orderTax / 2) });
    }

    return rows;
  }

  private formatPayMode(method: string | undefined, amount: number): string {
    const label = this.paymentLabel(method);
    return `${label}: ${this.formatMoney(amount)}`;
  }

  private paymentLabel(method: string | undefined): string {
    switch ((method ?? 'cash').toLowerCase()) {
      case 'card': return 'Card';
      case 'razorpay': return 'Razorpay';
      case 'credit': return 'Credit';
      case 'multiple': return 'Multiple';
      case 'installment': return 'Installment';
      case 'deposit': return 'Deposit';
      case 'points': return 'Points';
      default: return 'Cash';
    }
  }

  private shortUser(name: string | undefined): string {
    if (!name?.trim()) return '—';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].length <= 4 ? parts[0] : parts[0].slice(0, 3);
    }
    return parts.map(p => p[0]).join('').slice(0, 4);
  }

  private formatMoney(value: number): string {
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatQty(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toLocaleString('en-IN', { maximumFractionDigits: 3 });
  }

  private formatRate(value: number): string {
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 2,
    });
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private amountInWords(amount: number): string {
    const n = Math.round(Math.abs(amount));
    if (n === 0) return '(Rupees Zero Only)';
    return `(Rupees ${this.convertToWords(n)} Only)`;
  }

  private convertToWords(num: number): string {
    if (num < 20) return this.ones[num];
    if (num < 100) {
      const rem = num % 10;
      return `${this.tens[Math.floor(num / 10)]}${rem ? ` ${this.ones[rem]}` : ''}`.trim();
    }
    if (num < 1000) {
      const rem = num % 100;
      return `${this.ones[Math.floor(num / 100)]} Hundred${rem ? ` ${this.convertToWords(rem)}` : ''}`.trim();
    }
    if (num < 100000) {
      const rem = num % 1000;
      return `${this.convertToWords(Math.floor(num / 1000))} Thousand${rem ? ` ${this.convertToWords(rem)}` : ''}`.trim();
    }
    if (num < 10000000) {
      const rem = num % 100000;
      return `${this.convertToWords(Math.floor(num / 100000))} Lakh${rem ? ` ${this.convertToWords(rem)}` : ''}`.trim();
    }
    const rem = num % 10000000;
    return `${this.convertToWords(Math.floor(num / 10000000))} Crore${rem ? ` ${this.convertToWords(rem)}` : ''}`.trim();
  }

  private readonly ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];

  private readonly tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
