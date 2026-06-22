import { Component, Input } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AppModule } from '../../module/app.module';
import { GridReportConfig } from './grid-report.models';
import { GridReportService } from './grid-report.service';

@Component({
  selector: 'app-grid-report-toolbar',
  imports: [AppModule],
  templateUrl: './grid-report-toolbar.component.html',
  styleUrls: ['./grid-report-toolbar.component.scss']
})
export class GridReportToolbarComponent {
  @Input({ required: true }) config!: GridReportConfig;
  @Input() disabled = false;

  constructor(
    private gridReportService: GridReportService,
    private messageService: MessageService
  ) {}

  onPrint(): void {
    if (!this.canExport()) {
      return;
    }
    try {
      this.gridReportService.print(this.config);
    } catch (err) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Print',
        detail: err instanceof Error ? err.message : 'Could not open print window.'
      });
    }
  }

  onPdf(): void {
    if (!this.canExport()) {
      return;
    }
    try {
      this.gridReportService.downloadPdf(this.config);
      this.messageService.add({
        severity: 'success',
        summary: 'PDF',
        detail: 'Report downloaded.'
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'PDF',
        detail: 'Could not generate PDF report.'
      });
    }
  }

  private canExport(): boolean {
    if (this.disabled) {
      return false;
    }
    if (!this.config?.rows?.length) {
      this.messageService.add({
        severity: 'info',
        summary: 'Report',
        detail: 'No rows to export.'
      });
      return false;
    }
    return true;
  }
}
