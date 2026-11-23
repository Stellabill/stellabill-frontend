export type StatementEntryType = 'invoice' | 'payment' | 'credit';

export interface StatementEntry {
  id: string;
  date: string;
  description: string;
  type: StatementEntryType;
  amount: number;
  currency: string;
}

export interface StatementEntryWithBalance extends StatementEntry {
  change: number;
  balance: number;
}

export interface StatementViewOptions {
  dateStart?: string;
  dateEnd?: string;
  typeFilter?: StatementEntryType | 'all';
  sortAsc?: boolean;
}

export interface StatementView {
  entries: StatementEntryWithBalance[];
  openingBalance: number;
}

const DEFAULT_DECIMALS = 7;

function toMinorUnits(amount: number, scale: number): number {
  return Math.round(amount * scale);
}

function fromMinorUnits(amount: number, scale: number): number {
  return amount / scale;
}

export function computeStatementBalances(
  entries: StatementEntry[],
  decimals = DEFAULT_DECIMALS,
): StatementEntryWithBalance[] {
  const scale = 10 ** decimals;
  let runningMinor = 0;

  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const byDate = a.entry.date.localeCompare(b.entry.date);
      return byDate !== 0 ? byDate : a.index - b.index;
    })
    .map(({ entry }) => {
      const changeMinor = toMinorUnits(entry.amount, scale);
      runningMinor += changeMinor;
      return {
        ...entry,
        change: fromMinorUnits(changeMinor, scale),
        balance: fromMinorUnits(runningMinor, scale),
      };
    });
}

export function getStatementView(
  entries: StatementEntry[],
  { dateStart, dateEnd, typeFilter = 'all', sortAsc = true }: StatementViewOptions = {},
  decimals = DEFAULT_DECIMALS,
): StatementView {
  const balanced = computeStatementBalances(entries, decimals);

  let openingBalance = 0;
  let visible = balanced;

  if (dateStart) {
    let priorBalance = 0;
    for (const entry of balanced) {
      if (entry.date >= dateStart) break;
      priorBalance = entry.balance;
    }
    openingBalance = priorBalance;
    visible = visible.filter((entry) => entry.date >= dateStart);
  }

  if (dateEnd) {
    visible = visible.filter((entry) => entry.date <= dateEnd);
  }

  if (typeFilter !== 'all') {
    visible = visible.filter((entry) => entry.type === typeFilter);
  }

  return {
    entries: sortAsc ? visible : [...visible].reverse(),
    openingBalance,
  };
}

export interface InvoiceCsvLineItem {
  description: string;
  quantity?: number;
  unitPrice?: string;
  lineTotal: string;
}

export interface InvoiceCsvSummaryItem {
  label: string;
  amount: string;
}

export interface InvoiceCsvData {
  id: string;
  total: string;
  lineItems?: InvoiceCsvLineItem[];
  subtotal?: string;
  taxes?: InvoiceCsvSummaryItem[];
  credits?: InvoiceCsvSummaryItem[];
}

export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildInvoiceCsv(invoice: InvoiceCsvData): string {
  const header = 'Description,Quantity,Unit Price,Line Total';
  const rows = (invoice.lineItems ?? []).map((item) =>
    [
      escapeCsvCell(item.description),
      escapeCsvCell(item.quantity ?? ''),
      escapeCsvCell(item.unitPrice ?? ''),
      escapeCsvCell(item.lineTotal),
    ].join(','),
  );

  const summaryRows: string[] = [];
  if (invoice.subtotal) {
    summaryRows.push(`Subtotal,,,${escapeCsvCell(invoice.subtotal)}`);
  }
  if (invoice.taxes) {
    for (const tax of invoice.taxes) {
      summaryRows.push(`${escapeCsvCell(tax.label)},,,${escapeCsvCell(tax.amount)}`);
    }
  }
  if (invoice.credits) {
    for (const credit of invoice.credits) {
      summaryRows.push(`${escapeCsvCell(credit.label)},,,${escapeCsvCell(credit.amount)}`);
    }
  }
  summaryRows.push(`Total,,,${escapeCsvCell(invoice.total)}`);

  return `${header}\n${rows.join('\n')}\n\n${summaryRows.join('\n')}`;
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
