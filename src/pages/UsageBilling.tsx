import { Link, useParams } from 'react-router-dom';
import './UsageBilling.css';

export default function UsageBilling() {
    const { id } = useParams<{ id: string }>();

    // Mock data for the current period
    const planName = "Developer Pro";
    const billingPeriod = "Mar 1 – Mar 31, 2026";
    const usageCount = "32,450";
    const unit = "API calls";
    const amount = "16.23";
    const currency = "USDC";

    return (
        <div className="usage-billing-page">
            <nav className="breadcrumb" aria-label="Breadcrumb">
                <Link to="/subscriptions">Subscriptions</Link>
                <span className="separator">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </span>
                <Link to={`/subscriptions/${id}`}>{planName}</Link>
                <span className="separator">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
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
                        <svg className="period-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <h2>Current billing period: {billingPeriod}</h2>
                    </div>

                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-header">
                                <div className="icon-wrapper-usage">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                    </svg>
                                </div>
                                <span>Usage this period</span>
                            </div>
                            <div className="metric-value">{usageCount}</div>
                            <div className="metric-unit">{unit}</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <div className="icon-wrapper-amount">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                    </svg>
                                </div>
                                <span>Amount (estimated)</span>
                            </div>
                            <div className="metric-value">{amount}</div>
                            <div className="metric-unit">{currency}</div>
                        </div>
                    </div>

                    <div className="info-box">
                        <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <p>Charges are automatically deducted from your prepaid balance at the end of each billing period.</p>
                    </div>

                    <div className="calc-link-wrapper">
                        <svg className="calc-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <button className="calc-link">How usage is calculated</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
