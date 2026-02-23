import { Link } from 'react-router-dom';
import './SubscriptionCard.css';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface SubscriptionData {
  id: string;
  planName: string;
  merchant: string;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  interval: string;
  prepaidBalance: number;
  coverage: number;
  nextChargeDate: string;
  icon?: string;
}

interface SubscriptionCardProps {
  subscription: SubscriptionData;
}

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const {
    id,
    planName,
    merchant,
    status,
    price,
    currency,
    interval,
    prepaidBalance,
    coverage,
    nextChargeDate,
    icon
  } = subscription;

  const statusConfig = {
    active: { label: 'Active', icon: '▲', className: 'active' },
    paused: { label: 'Paused', icon: '⏸', className: 'paused' },
    cancelled: { label: 'Cancelled', icon: '✕', className: 'cancelled' }
  };

  const currentStatus = statusConfig[status];

  return (
    <article className="subscription-card">
      <div className="subscription-card-header">
        <div className="subscription-card-info">
          <div className="subscription-icon" role="img" aria-label={`${planName} icon`}>
            {icon || '📄'}
          </div>
          <div className="subscription-title-group">
            <h3 className="subscription-plan-name">{planName}</h3>
            <p className="subscription-merchant">{merchant}</p>
          </div>
        </div>
        <span className={`subscription-status-badge ${currentStatus.className}`}>
          <span className="status-icon" aria-hidden="true">{currentStatus.icon}</span>
          {currentStatus.label}
        </span>
      </div>

      <div className="subscription-pricing">
        <span className="subscription-price">{price} {currency}</span>
        <span className="subscription-interval"> / {interval}</span>
        <p className="subscription-id">ID: {id}</p>
      </div>

      <div className="subscription-details">
        <div className="subscription-detail-row">
          <span className="detail-icon" aria-hidden="true">💵</span>
          <span className="detail-label">Prepaid balance</span>
          <span className="detail-value">
            <span className="balance-pill">{prepaidBalance} {currency}</span>
          </span>
        </div>

        <div className="subscription-detail-row">
          <span className="detail-icon" aria-hidden="true">📊</span>
          <span className="detail-label">Coverage</span>
          <span className="detail-value">~{coverage} payments</span>
        </div>

        <div className="subscription-detail-row">
          <span className="detail-icon" aria-hidden="true">📅</span>
          <span className="detail-label">Next charge</span>
          <span className="detail-value">{nextChargeDate}</span>
        </div>
      </div>

      <div className="subscription-actions">
        <Link to={`/subscriptions/${id}`}>
          <button className="manage-btn">
            Manage
          </button>
        </Link>
        <a
          href={`/subscriptions/${id}`}
          className="external-link-icon"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open subscription in new tab"
        >
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}
