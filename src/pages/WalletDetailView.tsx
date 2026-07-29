import React, { useState } from 'react';
import WalletTransactionFilterPanel from '../components/WalletTransactionFilterPanel';
import { WalletTransaction } from '../types/walletTransaction';
import { TYPE_CONFIG } from '../components/recentActivity';
import { ArrowUpRight } from 'lucide-react';
import './WalletDetailView.css';

const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'charge_succeeded',
    details: 'Monthly Pro Plan - Stellar Cloud Services',
    counterparty: 'GB7B...K92L (Stellar Cloud)',
    timestamp: '2026-07-28T08:30:00Z',
    amount: 150,
  },
  {
    id: 'tx-2',
    type: 'new_subscription',
    details: 'Created subscription for News API Pro',
    counterparty: 'GC3X...M81P (News Corp)',
    timestamp: '2026-07-27T14:15:00Z',
    amount: 45,
  },
  {
    id: 'tx-3',
    type: 'subscription_paused',
    details: 'Paused Dev Infrastructure Subscription',
    counterparty: 'GD9A...P44Q (Dev Infra Inc)',
    timestamp: '2026-07-20T10:00:00Z',
    amount: 200,
  },
  {
    id: 'tx-4',
    type: 'charge_succeeded',
    details: 'Quarterly Enterprise Support Fee',
    counterparty: 'GB7B...K92L (Stellar Cloud)',
    timestamp: '2026-07-15T16:45:00Z',
    amount: 850,
  },
  {
    id: 'tx-5',
    type: 'subscription_resumed',
    details: 'Resumed Storage Vault Service',
    counterparty: 'GA5C...W19K (Vault Storage)',
    timestamp: '2026-07-10T11:20:00Z',
    amount: 80,
  },
  {
    id: 'tx-6',
    type: 'subscription_cancelled',
    details: 'Cancelled Legacy Analytics Feed',
    counterparty: 'GE1Z...L55R (Data Feeds Ltd)',
    timestamp: '2026-06-30T09:00:00Z',
    amount: 120,
  },
];

export interface WalletDetailViewProps {
  address?: string;
  initialTransactions?: WalletTransaction[];
}

export const WalletDetailView: React.FC<WalletDetailViewProps> = ({
  address = 'GCFX...8923',
  initialTransactions = MOCK_TRANSACTIONS,
}) => {
  const [displayedTransactions, setDisplayedTransactions] = useState<WalletTransaction[]>(initialTransactions);

  return (
    <main className="wallet-detail-view" aria-labelledby="wallet-detail-title">
      <header className="wallet-detail-view__header">
        <div>
          <h1 id="wallet-detail-title" className="wallet-detail-view__title">
            Wallet Details & History
          </h1>
          <p className="wallet-detail-view__subtitle">
            Manage transactions, apply filters, and audit historical Stellar account activity for{' '}
            <code className="wallet-detail-view__address">{address}</code>.
          </p>
        </div>
      </header>

      {/* Filter Panel Component */}
      <WalletTransactionFilterPanel
        transactions={initialTransactions}
        onFilteredTransactionsChange={setDisplayedTransactions}
      />

      {/* Transactions List */}
      <section className="wallet-detail-view__history-section" aria-label="Filtered transaction list">
        <h2 className="sr-only">Transactions</h2>
        {displayedTransactions.length === 0 ? (
          <div className="wallet-detail-view__empty">
            <p className="wallet-detail-view__empty-title">No transactions match your filters</p>
            <p className="wallet-detail-view__empty-desc">
              Try adjusting your filter criteria, date range, or amount limits to see more results.
            </p>
          </div>
        ) : (
          <ul className="wallet-detail-view__tx-list">
            {displayedTransactions.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.charge_succeeded;
              const formattedDate = new Date(tx.timestamp).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <li key={tx.id} className="wallet-detail-view__tx-item">
                  <div className="wallet-detail-view__tx-icon" style={{ background: cfg.iconBg, borderColor: cfg.iconBorder }}>
                    {cfg.icon}
                  </div>
                  <div className="wallet-detail-view__tx-content">
                    <div className="wallet-detail-view__tx-main">
                      <span className="wallet-detail-view__tx-label">{cfg.label}</span>
                      <span className="wallet-detail-view__tx-amount">{tx.amount} XLM</span>
                    </div>
                    <div className="wallet-detail-view__tx-sub">
                      <span className="wallet-detail-view__tx-details">{tx.details}</span>
                      <span className="wallet-detail-view__tx-party">• {tx.counterparty}</span>
                    </div>
                    <div className="wallet-detail-view__tx-time">{formattedDate}</div>
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${tx.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="wallet-detail-view__tx-link"
                    title="View transaction on Explorer"
                  >
                    <ArrowUpRight size={16} />
                    <span className="sr-only">View {tx.id} on explorer</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
};

export default WalletDetailView;
