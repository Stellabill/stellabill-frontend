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
