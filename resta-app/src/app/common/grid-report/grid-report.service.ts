import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCell } from './grid-report.formatters';
import { GridReportColumn, GridReportConfig } from './grid-report.models';

@Injectable({ providedIn: 'root' })
export class GridReportService {

  print(config: GridReportConfig): void {
    const html = this.buildPrintHtml(config);
    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!win) {
      throw new Error('Pop-up blocked. Allow pop-ups to print this report.');
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onload = () => {
      win.print();
      win.onafterprint = () => win.close();
    };
    setTimeout(() => {
      win.print();
      win.onafterprint = () => win.close();
    }, 400);
  }

  downloadPdf(config: GridReportConfig): void {
    const orientation = config.orientation ?? (config.columns.length > 6 ? 'landscape' : 'portrait');
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const margin = 14;
    let y = margin;

    doc.setFontSize(16);
    doc.text(config.title, margin, y);
    y += 8;

    if (config.subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(config.subtitle, margin, y);
      y += 6;
      doc.setTextColor(0);
    }

    const generatedAt = config.generatedAt ?? new Date();
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${this.formatGeneratedAt(generatedAt)}`, margin, y);
    y += 8;
    doc.setTextColor(0);

    const head = [config.columns.map(c => c.header)];
    const body = config.rows.map((row, rowIndex) =>
      config.columns.map(col => this.getCellText(col, row, rowIndex))
    );

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 98, 255], textColor: 255 },
      columnStyles: this.buildColumnStyles(config.columns),
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }
    });

    const fileName = this.sanitizeFileName(config.fileName ?? config.title);
    doc.save(`${fileName}.pdf`);
  }

  private getCellText(col: GridReportColumn, row: Record<string, unknown>, rowIndex: number): string {
    if (col.field === '_index') {
      return String(rowIndex + 1);
    }
    const raw = row[col.field];
    if (col.format) {
      return col.format(raw, row, rowIndex);
    }
    return formatCell(raw);
  }

  private buildColumnStyles(columns: GridReportColumn[]): Record<string, { halign?: 'left' | 'center' | 'right'; cellWidth?: number }> {
    const styles: Record<string, { halign?: 'left' | 'center' | 'right'; cellWidth?: number }> = {};
    columns.forEach((col, i) => {
      if (col.align || typeof col.width === 'number') {
        styles[String(i)] = {
          ...(col.align ? { halign: col.align } : {}),
          ...(typeof col.width === 'number' ? { cellWidth: col.width } : {})
        };
      }
    });
    return styles;
  }

  private buildPrintHtml(config: GridReportConfig): string {
    const generatedAt = config.generatedAt ?? new Date();
    const headCells = config.columns.map(c => `<th>${this.escapeHtml(c.header)}</th>`).join('');
    const bodyRows = config.rows.map((row, rowIndex) => {
      const cells = config.columns
        .map(col => `<td>${this.escapeHtml(this.getCellText(col, row, rowIndex))}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const subtitle = config.subtitle
      ? `<p class="subtitle">${this.escapeHtml(config.subtitle)}</p>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${this.escapeHtml(config.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; color: #1a1a2e; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .subtitle { color: #555; margin: 0 0 4px; font-size: 13px; }
    .meta { color: #888; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #2962ff; color: #fff; }
    tr:nth-child(even) { background: #f5f7ff; }
    @media print {
      body { margin: 12px; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(config.title)}</h1>
  ${subtitle}
  <p class="meta">Generated: ${this.escapeHtml(this.formatGeneratedAt(generatedAt))}</p>
  <table>
    <thead><tr>${headCells}</tr></thead>
    <tbody>${bodyRows || '<tr><td colspan="' + config.columns.length + '">No data</td></tr>'}</tbody>
  </table>
</body>
</html>`;
  }

  private formatGeneratedAt(date: Date): string {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'report';
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
