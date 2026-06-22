export type GridReportAlign = 'left' | 'center' | 'right';

export interface GridReportColumn {
  header: string;
  field: string;
  width?: number | 'auto';
  align?: GridReportAlign;
  format?: (value: unknown, row: Record<string, unknown>, rowIndex: number) => string;
}

export interface GridReportConfig {
  title: string;
  subtitle?: string;
  fileName?: string;
  columns: GridReportColumn[];
  rows: Record<string, unknown>[];
  generatedAt?: Date;
  orientation?: 'portrait' | 'landscape';
}
