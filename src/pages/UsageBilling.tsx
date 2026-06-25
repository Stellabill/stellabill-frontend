import { Link, useParams } from 'react-router-dom';
import { PastPeriods } from '../components/past-periods/past-periods';
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

            <PastPeriods />
        </div>
    );
}
