import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Subscription } from '@/types/subscription';
import './Subscriptions.css';

interface SubscriptionWithIcon extends Omit<Subscription, 'icon'> {
  icon: React.ReactNode;
  prepaidBalance: string;
  coverage: string;
}

const DATA: SubscriptionWithIcon[] = [
  {
    id: 'SUB-001',
    planName: 'Premium Access',
    merchantName: 'Stellar News',
    status: 'Active',
    price: 10,
    currency: 'USDC',
    interval: 'month',
    prepaidBalance: '30 USDC',
    coverage: '~3 payments',
    nextCharge: 'Mar 15, 2026',
    lastPayment: 'Feb 15, 2026',
    subscribedSince: 'Dec 15, 2025',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8"/>
        <path d="M15 18h-5"/>
        <path d="M10 6h8v4h-8V6Z"/>
      </svg>
    )
  },
  {
    id: 'SUB-002',
    planName: 'Pro Plan',
    merchantName: 'CloudFlow',
    status: 'Active',
    price: 25,
    currency: 'USDC',
    interval: 'month',
    prepaidBalance: '75 USDC',
    coverage: '~3 payments',
    nextCharge: 'Mar 20, 2026',
    lastPayment: 'Feb 20, 2026',
    subscribedSince: 'Feb 20, 2026',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M17.5 19c.7 0 1.3-.2 1.8-.7.5-.5.7-1.1.7-1.8 0-1.3-1-2.4-2.3-2.5-.2-2.1-1.9-3.5-4-3.5-1.5 0-2.8.7-3.6 1.8-.3-.1-.6-.1-.9-.1-1.4 0-2.5 1.1-2.5 2.5 0 .1 0 .2.1.3C5.5 15.6 4.5 16.7 4.5 18c0 1.4 1.1 2.5 2.5 2.5h10.5Z" />
      </svg>
    )
  },
  {
    id: 'SUB-003',
    planName: 'Basic Stream',
    merchantName: 'StreamIt',
    status: 'Paused',
    price: 5,
    currency: 'USDC',
    interval: 'month',
    prepaidBalance: '5 USDC',
    coverage: '~1 payment',
    nextCharge: 'Apr 01, 2026',
    lastPayment: 'Mar 01, 2026',
    subscribedSince: 'Jan 01, 2026',
    icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    )
  },
  {
    id: 'SUB-004',
    planName: 'Enterprise AI',
    merchantName: 'Cognitive',
    status: 'Cancelled',
    price: 50,
    currency: 'USDC',
    interval: 'month',
    prepaidBalance: '0 USDC',
    coverage: '0 payments',
    nextCharge: 'N/A',
    lastPayment: 'Feb 28, 2026',
    subscribedSince: 'Nov 15, 2025',
    icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
            <path d="M12 12L2.5 20.5"></path>
            <path d="M12 12V22"></path>
            <path d="M12 12L21.5 20.5"></path>
        </svg>
    )
  }
];

export default function Subscriptions() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (activeFilter === 'All') return DATA;
    return DATA.filter(sub => sub.status === activeFilter);
  }, [activeFilter]);

  const selectedSub = useMemo(() => {
    return DATA.find(sub => sub.id === selectedId);
  }, [selectedId]);

  const stats = {
    All: DATA.length,
    Active: DATA.filter(s => s.status === 'Active').length,
    Paused: DATA.filter(s => s.status === 'Paused').length,
    Cancelled: DATA.filter(s => s.status === 'Cancelled').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 8.5L5.5 5.5L8.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 3.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.5 3.5H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  if (selectedSub) {
    return (
      <div className="subscriptions-container">
        <nav className="breadcrumb">
          <Link to="/dashboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </Link>
          <span className="breadcrumb-separator">&gt;</span>
          <button onClick={() => setSelectedId(null)} className="breadcrumb-link-btn" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, fontSize: '0.875rem' }}>
            My subscriptions
          </button>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-current">{selectedSub.planName}</span>
        </nav>

        <button onClick={() => setSelectedId(null)} className="back-link">
          <span>&larr;</span> Back to all subscriptions
        </button>

        <div className="detail-view-card">
          <div className="detail-header">
            <div className="detail-header-left">
              <div className="detail-icon-box">{selectedSub.icon}</div>
              <div className="detail-title-section">
                <h1>{selectedSub.planName}</h1>
                <div className="detail-merchant">{selectedSub.merchantName}</div>
                <div className="detail-status-row">
                  <span className={`status-pill ${selectedSub.status.toLowerCase()}`}>
                    {getStatusIcon(selectedSub.status)}
                    {selectedSub.status}
                  </span>
                  <span className="sub-id-small">ID: {selectedSub.id}</span>
                </div>
              </div>
            </div>
            <div className="detail-price-section">
              <div className="detail-price-value">{selectedSub.price} {selectedSub.currency}</div>
              <div className="detail-price-interval">per {selectedSub.interval}</div>
            </div>
          </div>

          <div className="card-separator-small"></div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Last payment</span>
              <span className="detail-value">{selectedSub.lastPayment}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Next charge</span>
              <span className="detail-value">{selectedSub.nextCharge}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Subscribed since</span>
              <span className="detail-value">{selectedSub.subscribedSince}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscriptions-container">
      <nav className="breadcrumb">
        <Link to="/dashboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </Link>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">My subscriptions</span>
      </nav>

      <div className="header-row">
        <div className="page-title-section">
          <h1>My subscriptions</h1>
          <p className="page-description">Manage your active and past subscriptions</p>
        </div>
        <button className="browse-plans-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Browse plans
        </button>
      </div>

      <div className="filter-tabs">
        {(['All', 'Active', 'Paused', 'Cancelled'] as const).map(tab => (
          <button
            key={tab}
            className={`filter-tab ${activeFilter === tab ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab)}
          >
            {tab} <span>({stats[tab]})</span>
          </button>
        ))}
      </div>

      <div className="subscriptions-grid">
        {filteredData.map(sub => (
          <div key={sub.id} className="subscription-card">
            <div className="card-top">
              <div className="plan-main">
                <div className="icon-box">{sub.icon}</div>
                <div>
                  <h2 className="plan-name-small">{sub.planName}</h2>
                  <div className="merchant-name-small">{sub.merchantName}</div>
                </div>
              </div>
              <span className={`status-pill ${sub.status.toLowerCase()}`}>
                 {getStatusIcon(sub.status)}
                {sub.status}
              </span>
            </div>

            <div className="price-display">
              {sub.price} {sub.currency} <span>/ {sub.interval}</span>
            </div>
            <div className="sub-id-small">ID: {sub.id}</div>

            <div className="card-separator-small"></div>

            <div className="detail-rows">
              <div className="detail-row">
                <span className="row-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  Prepaid balance
                </span>
                <span className="row-value">{sub.prepaidBalance}</span>
              </div>
              <div className="detail-row">
                <span className="row-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                  Coverage
                </span>
                <span className="row-value">{sub.coverage}</span>
              </div>
              <div className="detail-row">
                <span className="row-label">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  next charge
                </span>
                <span className="row-value">{sub.nextCharge}</span>
              </div>
            </div>

            <div className="card-actions">
              <button 
                onClick={() => setSelectedId(sub.id)} 
                className="manage-btn"
              >
                Manage
              </button>
              <button className="external-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-info-card">
        <div className="info-icon-circle">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div className="info-content">
          <h3>About prepaid balances</h3>
          <p>Each subscription uses a prepaid vault model. Your USDC balance is held securely in a smart contract, and payments are automatically deducted on your billing cycle. You can top up anytime to extend coverage.</p>
        </div>
      </div>
    </div>
  );
}
