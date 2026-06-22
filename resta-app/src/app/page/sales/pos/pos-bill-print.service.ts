import { Injectable } from '@angular/core';

export interface PosBillLine {
  name: string;
  code: string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface PosBillPrintData {
  siteTitle: string;
  currency: string;
  referenceNo: string;
  customerName: string;
  customerPhone?: string;
  cashierName?: string;
  saleNote?: string;
  lines: PosBillLine[];
  itemCount: number;
  totalUnits: number;
  subtotal: number;
  orderDiscount: number;
  couponDiscount: number;
  lineTaxTotal: number;
  orderTax: number;
  totalTax: number;
  shippingCost: number;
  grandTotal: number;
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
    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const money = (value: number) => this.formatMoney(value, data.currency);

    const lineRows = data.lines.map(line => `
      <tr>
        <td class="item-name">${this.escapeHtml(line.name)}<span class="item-code">[${this.escapeHtml(line.code)}]</span></td>
        <td class="num">${line.qty}</td>
        <td class="num">${money(line.price)}</td>
        <td class="num">${money(line.subtotal)}</td>
      </tr>
    `).join('');

    const summaryRows: string[] = [];
    summaryRows.push(this.summaryRow('Subtotal', money(data.subtotal)));
    if (data.orderDiscount > 0) {
      summaryRows.push(this.summaryRow('Discount', `-${money(data.orderDiscount)}`));
    }
    if (data.couponDiscount > 0) {
      summaryRows.push(this.summaryRow('Coupon', `-${money(data.couponDiscount)}`));
    }
    if (data.lineTaxTotal > 0) {
      summaryRows.push(this.summaryRow('Line tax', money(data.lineTaxTotal)));
    }
    if (data.orderTax > 0) {
      summaryRows.push(this.summaryRow('Order tax', money(data.orderTax)));
    }
    if (data.shippingCost > 0) {
      summaryRows.push(this.summaryRow('Shipping', money(data.shippingCost)));
    }

    const customerPhone = data.customerPhone
      ? `<div class="meta-row"><span>Phone</span><span>${this.escapeHtml(data.customerPhone)}</span></div>`
      : '';
    const cashier = data.cashierName
      ? `<div class="meta-row"><span>Cashier</span><span>${this.escapeHtml(data.cashierName)}</span></div>`
      : '';
    const note = data.saleNote?.trim()
      ? `<div class="note"><strong>Note:</strong> ${this.escapeHtml(data.saleNote.trim())}</div>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${this.escapeHtml(data.referenceNo)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0 auto;
      padding: 12px;
      max-width: 320px;
      color: #111;
      font-size: 12px;
    }
    .center { text-align: center; }
    .store { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .bill-title { font-size: 13px; font-weight: 600; margin: 8px 0 12px; letter-spacing: 0.5px; }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }
    .divider {
      border: none;
      border-top: 1px dashed #999;
      margin: 10px 0;
    }
    table.items { width: 100%; border-collapse: collapse; }
    table.items th {
      text-align: left;
      font-size: 11px;
      border-bottom: 1px solid #333;
      padding: 4px 2px;
    }
    table.items th.num, table.items td.num { text-align: right; white-space: nowrap; }
    table.items td { padding: 5px 2px; vertical-align: top; border-bottom: 1px dotted #ddd; }
    .item-name { line-height: 1.3; }
    .item-code { display: block; color: #666; font-size: 10px; }
    .summary { margin-top: 8px; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .grand {
      font-size: 15px;
      font-weight: 700;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 2px solid #111;
    }
    .note {
      margin-top: 12px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 11px;
    }
    .footer {
      margin-top: 16px;
      text-align: center;
      color: #666;
      font-size: 11px;
    }
    @media print {
      body { margin: 0; padding: 8px; max-width: none; }
      @page { margin: 4mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center">
    <p class="store">${this.escapeHtml(data.siteTitle)}</p>
    <p class="bill-title">TAX INVOICE / BILL</p>
  </div>
  <div class="meta-row"><span>Bill No.</span><span>${this.escapeHtml(data.referenceNo)}</span></div>
  <div class="meta-row"><span>Date</span><span>${this.escapeHtml(now)}</span></div>
  <div class="meta-row"><span>Customer</span><span>${this.escapeHtml(data.customerName)}</span></div>
  ${customerPhone}
  ${cashier}
  <div class="meta-row"><span>Items</span><span>${data.itemCount} (${data.totalUnits})</span></div>
  <hr class="divider" />
  <table class="items">
    <thead>
      <tr>
        <th>Product</th>
        <th class="num">Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amt</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div class="summary">
    ${summaryRows.join('')}
    <div class="summary-row grand">
      <span>Grand Total</span>
      <span>${money(data.grandTotal)}</span>
    </div>
  </div>
  ${note}
  <p class="footer">Thank you for your business!</p>
</body>
</html>`;
  }

  private summaryRow(label: string, value: string): string {
    return `<div class="summary-row"><span>${this.escapeHtml(label)}</span><span>${value}</span></div>`;
  }

  private formatMoney(value: number, currency: string): string {
    const formatted = value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return currency ? `${currency} ${formatted}` : formatted;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
