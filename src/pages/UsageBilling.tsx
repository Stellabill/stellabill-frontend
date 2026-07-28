import { useCallback, useId, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Download,
  FileText,
  Receipt,
} from 'lucide-react';
import { PastPeriods } from '../components/past-periods/past-periods';
import ReceiptPreview from '../components/past-periods/ReceiptPreview';
import type { ReceiptData } from '../components/past-periods/ReceiptPreview';
import './UsageBilling.css';
import InvoiceList from "../components/InvoiceList";


interface UsageData {
    planName: string;
    billingPeriod: string;
    usageCount: number;
    usageLimit: number;
    unit: string;
    amount: string;
    currency: string;
}

function UsageSkeleton() {
    return (
        <div className="usage-billing-page" aria-busy="true" aria-label="Loading usage data">
            <div className="skeleton skeleton-breadcrumb" />
            <div className="skeleton skeleton-heading" />
            <div className="skeleton skeleton-subheading" />
            <div className="main-card">
                <div className="main-card-inner">
                    <div className="skeleton skeleton-period-header" />
                    <div className="metrics-grid">
                        <div className="skeleton skeleton-metric-card" />
                        <div className="skeleton skeleton-metric-card" />
                    </div>
                    <div className="skeleton skeleton-progress" />
                </div>
            </div>
        </div>
    );
}

function EmptyUsageState({ planName, billingPeriod, id }: { planName: string; billingPeriod: string; id?: string }) {
    return (
        <div className="usage-billing-page">
            <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/subscriptions">Subscriptions</Link>
                <span className="separator">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </span>
                <Link to={`/subscriptions/${id}`}>{planName}</Link>
                <span className="separator">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </span>
                <span className="current">Usage</span>
            </nav>

            <header className="header">
                <h1>Usage & Billing</h1>
                <p>Usage-based charges for <span style={{ color: '#FFFFFF' }}>{planName}</span></p>
            </header>

            <div className="main-card">
                <div className="empty-state" role="status">
                    <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <h2>No usage yet</h2>
                    <p>No API calls recorded for <strong>{billingPeriod}</strong>.<br />Usage will appear here once your integration is active.</p>
                    <Link to={`/subscriptions/${id}`} className="empty-back-link">Back to subscription</Link>
                </div>
            </div>
        </div>
    );
}

export default function UsageBilling() {
    const { id } = useParams<{ id: string }>();

    const isLoading = false;

    const data: UsageData | null = {
        planName: "Developer Pro",
        billingPeriod: "Mar 1 – Mar 31, 2026",
        usageCount: 32450,
        usageLimit: 50000,
        unit: "API calls",
        amount: "16.23",
        currency: "USDC",
    };

    if (isLoading) return <UsageSkeleton />;
    if (!data || data.usageCount === 0) {
        return (
            <EmptyUsageState
                planName={data?.planName ?? "Your Plan"}
                billingPeriod={data?.billingPeriod ?? "current period"}
                id={id}
            />
        );
    }

    const { planName, billingPeriod, usageCount, usageLimit, unit, amount, currency } = data;
    const usagePct = Math.min(100, Math.round((usageCount / usageLimit) * 100));
    const progressColor = usagePct >= 90 ? '#ef4444' : usagePct >= 70 ? '#f59e0b' : '#6366f1';
    const usageCountFmt = usageCount.toLocaleString();
    const usageLimitFmt = usageLimit.toLocaleString();

    const invoicesData: {
        id: string;
        date: string;
        status: "paid" | "pending" | "failed";
        total: string;
        currency: string;
    }[] = [
    {
        id: "INV-00123456789",
        date: "Mar 31, 2026",
        status: "paid",
        total: "16.23",
        currency: "USDC",
    },
    {
        id: "INV-00123456790",
        date: "Feb 28, 2026",
        status: "pending",
        total: "12.10",
        currency: "USDC",
    },
    {
        id: "INV-00123456791",
        date: "Jan 31, 2026",
        status: "failed",
        total: "8.50",
        currency: "USDC",
    },
    ];

    // Receipt preview (placeholder until historic selection wiring exists)
    const receipt: ReceiptData | null = {
        receiptId: "RCPT-001234567",
        issueDate: "Mar 31, 2026",
        merchantName: "Stellabill",
        merchantBrand: "Stellabill Billing",
        merchantAddress: "123 Nebula Avenue, Suite 100",
        merchantEmail: "billing@stellabill.example",
        merchantTaxId: "TAX-EXAMPLE-001",

        clientName: planName,
        clientAddress: "Client billing address",
        clientEmail: "client@company.example",
        clientTaxId: "CLIENT-TAX-EXAMPLE",

        currency: currency,
        lineItems: [
            {
                id: "li-1",
                description: `API usage (${unit}) for ${billingPeriod}`,
                quantity: usageCount,
                unitPrice: { amount: 0.0005, currency },
                lineTotal: { amount: 15.20, currency },
            },
            {
                id: "li-2",
                description: "Usage adjustment / rounding",
                quantity: 1,
                unitPrice: { amount: 1.03, currency },
                lineTotal: { amount: 1.03, currency },
            },
        ],
        subtotal: { amount: 16.23, currency },
        taxes: [{ label: "Network / protocol fee", amount: { amount: 0, currency } }],
        total: { amount: 16.23, currency },

        paymentMethod: "Prepaid balance",
        transactionKey: "TX-8F2A9C0D3E",
        reference: `Billing period ${billingPeriod}`,
        terms: "Non-refundable services rendered in full.",
    };

    return (
        <div className="usage-billing-page">

            <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/subscriptions">Subscriptions</Link>
                <span className="separator">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </span>
                <Link to={`/subscriptions/${id}`}>{planName}</Link>
                <span className="separator">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </span>
                <span className="current">Usage</span>
            </nav>

            <header className="header">
                <h1>Usage & Billing</h1>
                <p>Usage-based charges for <span style={{ color: '#FFFFFF' }}>{planName}</span></p>
            </header>

            <div className="main-card">
                <div className="main-card-inner">
                    <div className="period-header">
                        <svg className="period-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <h2>Current billing period: {billingPeriod}</h2>
                    </div>

                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-header">
                                <div className="icon-wrapper-usage">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                </div>
                                <span>Usage this period</span>
                            </div>
                            <div className="metric-value">{usageCountFmt}</div>
                            <div className="metric-unit">{unit}</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <div className="icon-wrapper-amount">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <span>Amount (estimated)</span>
                            </div>
                            <div className="metric-value">{amount}</div>
                            <div className="metric-unit">{currency}</div>
                        </div>
                    </div>

                    {/* Usage vs limit progress */}
                    <div className="usage-progress-section" role="group" aria-label="Usage vs plan limit">
                        <div className="usage-progress-header">
                            <span className="usage-progress-label">
                                {usagePct}% of plan limit used
                            </span>
                            <span className="usage-progress-counts" aria-label={`${usageCountFmt} of ${usageLimitFmt} ${unit}`}>
                                {usageCountFmt} / {usageLimitFmt}
                            </span>
                        </div>
                        <div
                            className="usage-progress-track"
                            role="progressbar"
                            aria-valuenow={usagePct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Usage percentage"
                        >
                            <div
                                className="usage-progress-fill"
                                style={{ width: `${usagePct}%`, background: progressColor }}
                            />
                        </div>
                        {usagePct >= 80 && (
                            <p className="usage-progress-warning" role="alert">
                                {usagePct >= 90
                                    ? 'You are close to your plan limit. Consider upgrading to avoid service interruption.'
                                    : 'Approaching plan limit. Review your usage or upgrade your plan.'}
                            </p>
                        )}
                    </div>

                    <div className="info-box">
                        <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <p>Charges are automatically deducted from your prepaid balance at the end of each billing period.</p>
                    </div>

                    <div className="calc-link-wrapper">
                        <svg className="calc-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <button className="calc-link" type="button">How usage is calculated</button>
                    </div>
                </div>
            </div>

            <InvoiceList invoices={invoicesData} />

            <div style={{ marginTop: 24 }}>
                <ReceiptPreview receipt={receipt} />
            </div>

            <StatementOfAccount />

            <PastPeriods />
        </div>
    );
}

/* ───────────────────────────────────────────────────────────────────────────────
 * Statement of Account
 * ─────────────────────────────────────────────────────────────────────────────── */

type StatementEntryType = 'invoice' | 'payment' | 'credit';

interface StatementEntry {
  id: string;
  date: string;
  description: string;
  type: StatementEntryType;
  amount: number;
  currency: string;
}

const statementData: StatementEntry[] = [
  { id: 'st-1',  date: '2026-01-15', description: 'Invoice INV-00123456785',  type: 'invoice', amount: 15.20, currency: 'USDC' },
  { id: 'st-2',  date: '2026-01-31', description: 'Payment received',        type: 'payment', amount: -15.20, currency: 'USDC' },
  { id: 'st-3',  date: '2026-02-10', description: 'Prepaid top-up',           type: 'credit',  amount: -50.00, currency: 'USDC' },
  { id: 'st-4',  date: '2026-02-28', description: 'Invoice INV-00123456790',  type: 'invoice', amount: 12.10, currency: 'USDC' },
  { id: 'st-5',  date: '2026-03-01', description: 'Payment received',        type: 'payment', amount: -12.10, currency: 'USDC' },
  { id: 'st-6',  date: '2026-03-31', description: 'Invoice INV-00123456789',  type: 'invoice', amount: 16.23, currency: 'USDC' },
  { id: 'st-7',  date: '2026-04-01', description: 'Payment received (pending)', type: 'payment', amount: -16.23, currency: 'USDC' },
  { id: 'st-8',  date: '2026-04-15', description: 'Credit: referral bonus',  type: 'credit',  amount: -10.00, currency: 'USDC' },
];

const typeLabels: Record<StatementEntryType, string> = {
  invoice: 'Invoice',
  payment: 'Payment',
  credit: 'Credit',
};

const typeColors: Record<StatementEntryType, string> = {
  invoice: '#f59e0b',
  payment: '#22c55e',
  credit: '#3b82f6',
};

/** Format a number as a signed currency string. */
function fmtSigned(value: number, currency: string): string {
  const abs = Math.abs(value).toFixed(2);
  if (value === 0) return `0.00 ${currency}`;
  if (value < 0) return `-${abs} ${currency}`;
  return `+${abs} ${currency}`;
}

function StatementOfAccount() {
  const headingId = useId();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [dateStart, setDateStart] = useState('2026-01-01');
  const [dateEnd, setDateEnd] = useState('2026-12-31');
  const [typeFilter, setTypeFilter] = useState<StatementEntryType | 'all'>('all');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let items = statementData;
    if (dateStart) items = items.filter((e) => e.date >= dateStart);
    if (dateEnd) items = items.filter((e) => e.date <= dateEnd);
    if (typeFilter !== 'all') items = items.filter((e) => e.type === typeFilter);
    items = [...items].sort((a, b) => (sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
    return items;
  }, [dateStart, dateEnd, typeFilter, sortAsc]);

  // ── Running balance ──────────────────────────────────────────────────────
  const withBalance = useMemo(() => {
    let running = 0;
    return filtered.map((entry) => {
      // Invoices add to balance (amount owed), payments and credits subtract
      const change = entry.type === 'invoice' ? entry.amount : -entry.amount;
      running += change;
      return { ...entry, change, balance: running };
    });
  }, [filtered]);

  // ── Export CSV ───────────────────────────────────────────────────────────
  const exportCsv = useCallback(() => {
    const header = 'Date,Description,Type,Amount,Currency,Running Balance';
    const rows = withBalance.map(
      (e) => `${e.date},"${e.description}",${typeLabels[e.type]},${e.change.toFixed(2)},${e.currency},${e.balance.toFixed(2)}`,
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-of-account-${dateStart}-to-${dateEnd}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [withBalance, dateStart, dateEnd]);

  // ── Export PDF (print stylesheet) ────────────────────────────────────────
  const exportPdf = useCallback(() => {
    window.print();
  }, []);

  return (
    <section className="statement-section" aria-labelledby={headingId} style={{ marginTop: 32 }}>
      <div className="main-card">
        <div className="main-card-inner">
          <h2 id={headingId} className="statement-heading">Statement of Account</h2>

          {/* ── Filter bar ──────────────────────────────────────────────── */}
          <div className="statement-filters" role="search" aria-label="Filter statement entries">
            <div className="filter-group">
              <label className="filter-label" htmlFor="soa-date-start">From</label>
              <input
                id="soa-date-start"
                type="date"
                className="filter-input"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label" htmlFor="soa-date-end">To</label>
              <input
                id="soa-date-end"
                type="date"
                className="filter-input"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label" htmlFor="soa-type">Type</label>
              <select
                id="soa-type"
                className="filter-input"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as StatementEntryType | 'all')}
              >
                <option value="all">All</option>
                <option value="invoice">Invoice</option>
                <option value="payment">Payment</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <button
              type="button"
              className="filter-sort-btn"
              onClick={() => setSortAsc((p) => !p)}
              aria-label={`Sort ${sortAsc ? 'descending' : 'ascending'}`}
              title={`Sort ${sortAsc ? 'descending' : 'ascending'}`}
            >
              {sortAsc ? '↑ Oldest first' : '↓ Newest first'}
            </button>

            <div className="filter-actions">
              <button type="button" className="statement-export-btn" onClick={exportCsv}>
                <Download size={14} aria-hidden="true" />
                CSV
              </button>
              <button type="button" className="statement-export-btn" onClick={exportPdf}>
                <FileText size={14} aria-hidden="true" />
                PDF
              </button>
            </div>
          </div>

          {/* ── Desktop table ─────────────────────────────────────────────── */}
          <div className="statement-table-wrap hidden-mobile" role="region" aria-label="Statement entries">
            <table className="statement-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col">Type</th>
                  <th scope="col" className="col-amount">Amount</th>
                  <th scope="col" className="col-amount">Balance</th>
                </tr>
              </thead>
              <tbody>
                {withBalance.map((entry) => (
                  <tr key={entry.id}>
                    <td className="cell-date">{entry.date}</td>
                    <td className="cell-desc">{entry.description}</td>
                    <td>
                      <span
                        className="type-badge"
                        style={{
                          background: `${typeColors[entry.type]}20`,
                          color: typeColors[entry.type],
                          borderColor: `${typeColors[entry.type]}40`,
                        }}
                      >
                        {typeLabels[entry.type]}
                      </span>
                    </td>
                    <td className={`col-amount ${entry.change >= 0 ? 'amount-debit' : 'amount-credit'}`}>
                      {fmtSigned(entry.change, entry.currency)}
                    </td>
                    <td className="col-amount amount-balance">
                      {entry.balance.toFixed(2)} {entry.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {withBalance.length === 0 && (
              <div className="statement-empty" role="status">
                <Receipt size={32} aria-hidden="true" />
                <p>No entries match the current filters.</p>
              </div>
            )}
          </div>

          {/* ── Mobile cards ──────────────────────────────────────────────── */}
          <div className="statement-cards visible-mobile" role="list" aria-label="Statement entries">
            {withBalance.map((entry) => (
              <div key={entry.id} className="statement-card" role="listitem">
                <div className="statement-card-header">
                  <span className="cell-date">{entry.date}</span>
                  <span
                    className="type-badge"
                    style={{
                      background: `${typeColors[entry.type]}20`,
                      color: typeColors[entry.type],
                      borderColor: `${typeColors[entry.type]}40`,
                    }}
                  >
                    {typeLabels[entry.type]}
                  </span>
                </div>
                <p className="statement-card-desc">{entry.description}</p>
                <div className="statement-card-footer">
                  <span className={`statement-card-amount ${entry.change >= 0 ? 'amount-debit' : 'amount-credit'}`}>
                    {fmtSigned(entry.change, entry.currency)}
                  </span>
                  <span className="amount-balance">
                    Balance: {entry.balance.toFixed(2)} {entry.currency}
                  </span>
                </div>
              </div>
            ))}
            {withBalance.length === 0 && (
              <div className="statement-empty" role="status">
                <Receipt size={32} aria-hidden="true" />
                <p>No entries match the current filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

