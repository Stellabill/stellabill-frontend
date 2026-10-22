import { describe, it, expect } from 'vitest';
import {
  computeStatementBalances,
  getStatementView,
  type StatementEntry,
} from './statement';

const ledger: StatementEntry[] = [
  { id: 'st-1', date: '2026-01-15', description: 'Invoice INV-00123456785', type: 'invoice', amount: 15.20, currency: 'USDC' },
  { id: 'st-2', date: '2026-01-31', description: 'Payment received', type: 'payment', amount: -15.20, currency: 'USDC' },
  { id: 'st-3', date: '2026-02-10', description: 'Prepaid top-up', type: 'credit', amount: -50.00, currency: 'USDC' },
  { id: 'st-4', date: '2026-02-28', description: 'Invoice INV-00123456790', type: 'invoice', amount: 12.10, currency: 'USDC' },
  { id: 'st-5', date: '2026-03-01', description: 'Payment received', type: 'payment', amount: -12.10, currency: 'USDC' },
  { id: 'st-6', date: '2026-03-31', description: 'Invoice INV-00123456789', type: 'invoice', amount: 16.23, currency: 'USDC' },
  { id: 'st-7', date: '2026-04-01', description: 'Payment received (pending)', type: 'payment', amount: -16.23, currency: 'USDC' },
  { id: 'st-8', date: '2026-04-15', description: 'Credit: referral bonus', type: 'credit', amount: -10.00, currency: 'USDC' },
];

const balanceById = (entries: ReturnType<typeof computeStatementBalances>) =>
  new Map(entries.map((entry) => [entry.id, entry.balance]));

describe('computeStatementBalances', () => {
  it('uses signed amounts without re-negating payments and credits', () => {
    const result = computeStatementBalances(ledger.slice(0, 2));

    expect(result.map((entry) => entry.change)).toEqual([15.2, -15.2]);
    expect(result[0].balance).toBe(15.2);
    expect(result[1].balance).toBe(0);
  });

  it('computes a negative balance for credits and payments', () => {
    const result = computeStatementBalances(ledger.slice(0, 3));

    expect(result[1].balance).toBe(0);
    expect(result[2].balance).toBe(-50);
  });

  it('matches the arithmetic sum of the full seed ledger', () => {
    const result = computeStatementBalances(ledger);
    const sum = ledger.reduce((total, entry) => total + entry.amount, 0);

    expect(result[1].balance).toBe(0);
    expect(result[result.length - 1].balance).toBe(-60);
    expect(result[result.length - 1].balance).toBe(sum);
  });

  it('avoids float drift when summing decimals', () => {
    const result = computeStatementBalances([
      { id: 'a', date: '2026-01-01', description: 'A', type: 'invoice', amount: 0.1, currency: 'USDC' },
      { id: 'b', date: '2026-01-02', description: 'B', type: 'invoice', amount: 0.2, currency: 'USDC' },
      { id: 'c', date: '2026-01-03', description: 'C', type: 'payment', amount: -0.3, currency: 'USDC' },
    ]);

    expect(result[1].balance).toBe(0.3);
    expect(result[2].balance).toBe(0);
  });

  it('sorts chronologically before accumulating', () => {
    const result = computeStatementBalances([...ledger].reverse());

    expect(result.map((entry) => entry.id)).toEqual(ledger.map((entry) => entry.id));
    expect(result[result.length - 1].balance).toBe(-60);
  });
});

describe('getStatementView', () => {
  it('keeps entry balances unchanged when filtering by type', () => {
    const base = balanceById(computeStatementBalances(ledger));
    const { entries } = getStatementView(ledger, { typeFilter: 'payment' });

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.balance).toBe(base.get(entry.id));
    }
    expect(entries.every((entry) => entry.type === 'payment')).toBe(true);
  });

  it('keeps entry balances unchanged when filtering by date', () => {
    const base = balanceById(computeStatementBalances(ledger));
    const { entries } = getStatementView(ledger, {
      dateStart: '2026-02-01',
      dateEnd: '2026-03-31',
    });

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.balance).toBe(base.get(entry.id));
    }
  });

  it('keeps entry balances unchanged when sorting newest first', () => {
    const asc = getStatementView(ledger, { sortAsc: true });
    const desc = getStatementView(ledger, { sortAsc: false });

    expect(desc.entries.map((entry) => entry.id)).toEqual(
      asc.entries.map((entry) => entry.id).reverse(),
    );
    expect(balanceById(desc.entries)).toEqual(balanceById(asc.entries));
  });

  it('returns the opening balance immediately before the date range', () => {
    const view = getStatementView(ledger, { dateStart: '2026-03-15' });

    expect(view.openingBalance).toBe(-50);
    expect(view.entries[0].id).toBe('st-6');
    expect(view.entries[0].balance).toBe(-33.77);
  });

  it('uses the full ledger for opening balance even when a type filter is active', () => {
    const view = getStatementView(ledger, {
      dateStart: '2026-03-15',
      typeFilter: 'payment',
    });

    expect(view.openingBalance).toBe(-50);
    expect(view.entries.every((entry) => entry.type === 'payment')).toBe(true);
  });

  it('returns a zero opening balance when the range starts at the first entry', () => {
    const view = getStatementView(ledger, { dateStart: '2026-01-01' });

    expect(view.openingBalance).toBe(0);
    expect(view.entries[0].balance).toBe(15.2);
  });
});
