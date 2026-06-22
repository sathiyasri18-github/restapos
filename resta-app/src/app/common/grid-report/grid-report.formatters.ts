export function formatCell(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  if (value instanceof Date) {
    return formatDate(value);
  }
  return String(value);
}

export function formatDate(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatMoney(value: unknown): string {
  if (value == null || value === '') {
    return '—';
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    return String(value);
  }
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatYesNo(value: unknown): string {
  if (value === true || value === 'true' || value === 1) {
    return 'Yes';
  }
  if (value === false || value === 'false' || value === 0) {
    return 'No';
  }
  return formatCell(value);
}
