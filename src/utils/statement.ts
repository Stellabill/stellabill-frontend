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

export interface ReceiptMoney {
  amount: number;
  currency: string;
}

export interface ReceiptLineItem {
  id?: string;
  description: string;
  quantity?: number;
  unitPrice?: ReceiptMoney;
  lineTotal?: ReceiptMoney;
}

export interface ReceiptTax {
  label: string;
  amount: ReceiptMoney;
}

export interface ReceiptDocument {
  receiptId: string;
  issueDate: string;
  merchantName: string;
  merchantBrand?: string;
  merchantAddress?: string;
  merchantEmail?: string;
  merchantPhone?: string;
  merchantTaxId?: string;
  clientName: string;
  clientAddress?: string;
  clientEmail?: string;
  clientTaxId?: string;
  currency: string;
  lineItems: ReceiptLineItem[];
  subtotal?: ReceiptMoney;
  taxes?: ReceiptTax[];
  total?: ReceiptMoney;
  paymentMethod: string;
  transactionKey: string;
  reference: string;
  terms?: string;
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

export function resolveReceiptTotals(receipt: ReceiptDocument): {
  subtotal: ReceiptMoney;
  taxes: ReceiptTax[];
  total: ReceiptMoney;
} {
  const currency = receipt.currency;
  const taxes = receipt.taxes ?? [];

  const derivedSubtotalAmount = receipt.lineItems.reduce((acc, item) => {
    if (item.lineTotal && item.lineTotal.currency === currency) {
      return acc + (Number.isFinite(item.lineTotal.amount) ? item.lineTotal.amount : 0);
    }
    if (item.unitPrice && item.quantity != null && item.unitPrice.currency === currency) {
      const quantity = Number(item.quantity);
      const unitPrice = item.unitPrice.amount;
      return acc + quantity * (Number.isFinite(unitPrice) ? unitPrice : 0);
    }
    return acc;
  }, 0);

  const subtotal = receipt.subtotal ?? { amount: derivedSubtotalAmount, currency };
  const derivedTaxesAmount = taxes.reduce((acc, tax) => {
    if (tax.amount.currency !== currency) return acc;
    return acc + (Number.isFinite(tax.amount.amount) ? tax.amount.amount : 0);
  }, 0);
  const total = receipt.total ?? {
    amount: subtotal.amount + derivedTaxesAmount,
    currency,
  };

  return { subtotal, taxes, total };
}

export function getReceiptDownloadFileName(
  receipt: Pick<ReceiptDocument, 'receiptId'>,
): string {
  const safeId = receipt.receiptId
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `receipt-${safeId || 'unknown'}.csv`;
}

function escapeCsvValue(value: string | number | undefined | null): string {
  const raw = value == null ? '' : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function formatReceiptMoney(money: ReceiptMoney | undefined): string {
  if (!money) return '';
  return `${money.amount} ${money.currency}`;
}

export function buildReceiptCsv(receipt: ReceiptDocument): string {
  const { subtotal, taxes, total } = resolveReceiptTotals(receipt);
  const merchantName = receipt.merchantBrand
    ? `${receipt.merchantBrand} — ${receipt.merchantName}`
    : receipt.merchantName;

  const metadata: Array<[string, string | undefined]> = [
    ['Receipt', receipt.receiptId],
    ['Issue Date', receipt.issueDate],
    ['Merchant', merchantName],
    ['Merchant Address', receipt.merchantAddress],
    ['Merchant Email', receipt.merchantEmail],
    ['Merchant Phone', receipt.merchantPhone],
    ['Merchant Tax ID', receipt.merchantTaxId],
    ['Bill To', receipt.clientName],
    ['Client Address', receipt.clientAddress],
    ['Client Email', receipt.clientEmail],
    ['Client Tax ID', receipt.clientTaxId],
    ['Currency', receipt.currency],
    ['Reference', receipt.reference],
    ['Payment Method', receipt.paymentMethod],
    ['Transaction Key', receipt.transactionKey],
    ['Terms', receipt.terms ?? 'Standard billing terms apply.'],
  ];

  const lines: string[] = metadata.map(([label, value]) =>
    [escapeCsvValue(label), escapeCsvValue(value)].join(','),
  );

  lines.push('');
  lines.push(
    ['Description', 'Quantity', 'Unit Price', 'Line Total'].map(escapeCsvValue).join(','),
  );

  for (const item of receipt.lineItems) {
    lines.push(
      [
        escapeCsvValue(item.description),
        escapeCsvValue(item.quantity),
        escapeCsvValue(formatReceiptMoney(item.unitPrice)),
        escapeCsvValue(formatReceiptMoney(item.lineTotal)),
      ].join(','),
    );
  }

  lines.push('');
  lines.push([escapeCsvValue('Subtotal'), escapeCsvValue(formatReceiptMoney(subtotal))].join(','));

  for (const tax of taxes) {
    lines.push(
      [escapeCsvValue(tax.label), escapeCsvValue(formatReceiptMoney(tax.amount))].join(','),
    );
  }

  lines.push([escapeCsvValue('Total'), escapeCsvValue(formatReceiptMoney(total))].join(','));
  lines.push('');

  return lines.join('\n');
}
