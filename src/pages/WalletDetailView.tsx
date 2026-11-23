import React, { useState, useEffect, useCallback, useRef } from 'react';
import WalletTransactionFilterPanel from '../components/WalletTransactionFilterPanel';
import ErrorState from '../components/ErrorState';
import {
  INITIAL_FILTER_STATE,
  type WalletTransaction,
  type WalletTransactionFilterState,
} from '../types/walletTransaction';
import {
  walletTransactions,
  DEFAULT_WALLET_TRANSACTIONS_LIMIT,
  WALLET_TRANSACTION_FIXTURES,
  extractCounterpartyAddress,
} from '../api/walletTransactions';
import type { ApiError } from '../api/client';
import {
  explorerAccountUrl,
  getExpectedNetwork,
  normalizeNetwork,
  type StellarNetwork,
} from '../config/network';
import { TYPE_CONFIG } from '../components/recentActivity';
import { ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import './WalletDetailView.css';

export interface WalletDetailViewProps {
  address?: string;
  network?: StellarNetwork | 'testnet' | 'mainnet' | 'public' | (string & {});
  initialTransactions?: WalletTransaction[];
  pageSize?: number;
}

function explorerTransactionUrl(network: StellarNetwork, tx: WalletTransaction): string {
  const segment = network === 'Mainnet' ? 'public' : 'testnet';
  const ref = tx.txHash || tx.id;
  return 'https://stellar.expert/explorer/' + segment + '/tx/' + ref;
}

const SKELETON_ROW_COUNT = 5;

export const WalletDetailView: React.FC<WalletDetailViewProps> = ({
  address = 'GCFX...8923',
  network,
  initialTransactions,
  pageSize = DEFAULT_WALLET_TRANSACTIONS_LIMIT,
}) => {
  const resolvedNetwork: StellarNetwork = network
    ? normalizeNetwork(network)
    : getExpectedNetwork();

  const [filters, setFilters] = useState<WalletTransactionFilterState>(INITIAL_FILTER_STATE);
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prevCursor, setPrevCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    (activeCursor: string | null, activeFilters: WalletTransactionFilterState) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      const fixtureData = initialTransactions ?? WALLET_TRANSACTION_FIXTURES;

      return walletTransactions
        .list(
          {
            address,
            cursor: activeCursor,
            limit: pageSize,
            filters: activeFilters,
          },
          { signal: controller.signal },
          fixtureData,
        )
        .then((page) => {
          if (controller.signal.aborted) return;
          setTransactions(page.transactions);
          setNextCursor(page.nextCursor);
          setPrevCursor(page.prevCursor);
          setTotalCount(page.totalCount);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          const apiErr = (err instanceof Error ? err : new Error(String(err))) as ApiError;
          if (apiErr.name === 'AbortError') return;
          setError(apiErr);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    },
    [address, initialTransactions, pageSize],
  );

  useEffect(() => {
    void fetchPage(cursor, filters);
    return () => {
      abortRef.current?.abort();
    };
  }, [cursor, filters, fetchPage]);

  const handleFiltersChange = useCallback((nextFilters: WalletTransactionFilterState) => {
    setFilters(nextFilters);
    setCursor(null);
    setPageNumber(1);
  }, []);

  const handleNextPage = () => {
    if (!nextCursor || loading) return;
    setCursor(nextCursor);
    setPageNumber((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (pageNumber <= 1 || loading) return;
    setCursor(prevCursor);
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const hasActiveFilters =
    filters.types.length > 0 ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    Boolean(filters.minAmount) ||
    Boolean(filters.maxAmount) ||
    Boolean(filters.counterparty.trim());

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const accountExplorerHref = explorerAccountUrl(resolvedNetwork, address);

  return (
    <main className="wallet-detail-view" aria-labelledby="wallet-detail-title">
      <header className="wallet-detail-view__header">
        <div className="wallet-detail-view__header-main">
          <div>
            <h1 id="wallet-detail-title" className="wallet-detail-view__title">
              Wallet Details & History
            </h1>
            <p className="wallet-detail-view__subtitle">
              Manage transactions, apply filters, and audit historical Stellar account activity for{' '}
              <code className="wallet-detail-view__address">{address}</code>.
            </p>
          </div>
          <a
            href={accountExplorerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="wallet-detail-view__account-explorer-link"
            aria-label={'View account ' + address + ' on Stellar Explorer'}
          >
            <span>View Account on Explorer</span>
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* Filter Panel Component */}
      <WalletTransactionFilterPanel
        transactions={transactions}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={totalCount}
      />

      {/* Transactions Section */}
      <section className="wallet-detail-view__history-section" aria-label="Filtered transaction list">
        <h2 className="sr-only">Transactions</h2>

        {error ? (
          <div className="wallet-detail-view__error">
            <ErrorState
              title="Transactions Unavailable"
              message={error.message}
              technicalDetails={error.technicalDetails}
              onRetry={() => void fetchPage(cursor, filters)}
              isRetrying={loading}
              type={error.isOffline ? 'offline' : 'error'}
            />
          </div>
        ) : loading ? (
          <div
            className="wallet-detail-view__loading"
            role="status"
            aria-busy="true"
            aria-label="Loading transactions"
          >
            <table className="wallet-detail-view__table" aria-label="Loading transactions">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Details</th>
                  <th scope="col">Counterparty</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="wallet-detail-view__col-numeric">
                    Amount
                  </th>
                  <th scope="col" className="wallet-detail-view__col-actions">
                    Explorer
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                  <tr key={index} className="wallet-detail-view__skeleton-row" aria-hidden="true">
                    <td>
                      <div className="wallet-detail-view__skeleton wallet-detail-view__skeleton--type" />
                    </td>
                    <td>
                      <div className="wallet-detail-view__skeleton wallet-detail-view__skeleton--details" />
                    </td>
                    <td>
                      <div className="wallet-detail-view__skeleton wallet-detail-view__skeleton--party" />
                    </td>
                    <td>
                      <div className="wallet-detail-view__skeleton wallet-detail-view__skeleton--date" />
                    </td>
                    <td>
                      <div className="wallet-detail-view__skeleton wallet-detail-view__skeleton--amount" />
                    </td>
                    <td>
                      <div className="wallet-detail-view__skeleton wallet-detail-view__skeleton--link" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : transactions.length === 0 ? (
          <div className="wallet-detail-view__empty" role="status">
            <p className="wallet-detail-view__empty-title">
              {hasActiveFilters
                ? 'No transactions match your filters'
                : 'No transactions recorded yet'}
            </p>
            <p className="wallet-detail-view__empty-desc">
              {hasActiveFilters
                ? 'Try adjusting your filter criteria, date range, or amount limits to see more results.'
                : 'Transactions for this wallet will appear here once activity is detected on the Stellar network.'}
            </p>
          </div>
        ) : (
          <>
            <div className="wallet-detail-view__table-wrapper">
              <table
                className="wallet-detail-view__table"
                aria-label="Wallet transactions"
                data-testid="wallet-transactions-table"
              >
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Details</th>
                    <th scope="col">Counterparty</th>
                    <th scope="col">Date</th>
                    <th scope="col" className="wallet-detail-view__col-numeric">
                      Amount
                    </th>
                    <th scope="col" className="wallet-detail-view__col-actions">
                      Explorer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const cfg = TYPE_CONFIG[tx.type] || TYPE_CONFIG.charge_succeeded;
                    const formattedDate = new Date(tx.timestamp).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    const counterpartyAddr = extractCounterpartyAddress(tx);
                    const counterpartyHref = explorerAccountUrl(resolvedNetwork, counterpartyAddr);
                    const txExplorerHref = explorerTransactionUrl(resolvedNetwork, tx);
                    const currency = tx.currency || 'XLM';

                    return (
                      <tr key={tx.id} className="wallet-detail-view__tx-item">
                        <td>
                          <div className="wallet-detail-view__type-cell">
                            <div
                              className="wallet-detail-view__tx-icon"
                              style={{ background: cfg.iconBg, borderColor: cfg.iconBorder }}
                            >
                              {cfg.icon}
                            </div>
                            <span className="wallet-detail-view__tx-label">{cfg.label}</span>
                          </div>
                        </td>
                        <td>
                          <span className="wallet-detail-view__tx-details">{tx.details}</span>
                        </td>
                        <td>
                          <a
                            href={counterpartyHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wallet-detail-view__party-link"
                            aria-label={'View counterparty ' + tx.counterparty + ' on explorer'}
                          >
                            <span className="wallet-detail-view__tx-party">{tx.counterparty}</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </td>
                        <td>
                          <span className="wallet-detail-view__tx-time">{formattedDate}</span>
                        </td>
                        <td className="wallet-detail-view__col-numeric">
                          <span className="wallet-detail-view__tx-amount">
                            {tx.amount} {currency}
                          </span>
                        </td>
                        <td className="wallet-detail-view__col-actions">
                          <a
                            href={txExplorerHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wallet-detail-view__tx-link"
                            title="View transaction on Explorer"
                            aria-label={'View ' + tx.id + ' on explorer'}
                          >
                            <ArrowUpRight size={16} />
                            <span className="sr-only">View {tx.id} on explorer</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <nav
              className="wallet-detail-view__pagination"
              aria-label="Transaction history pagination"
            >
              <div className="wallet-detail-view__pagination-info" aria-live="polite">
                Page <strong>{pageNumber}</strong> of <strong>{totalPages}</strong> ({totalCount}{' '}
                total)
              </div>
              <div className="wallet-detail-view__pagination-controls">
                <button
                  type="button"
                  className="wallet-detail-view__page-btn"
                  onClick={handlePrevPage}
                  disabled={pageNumber <= 1 || loading}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="wallet-detail-view__page-btn"
                  onClick={handleNextPage}
                  disabled={!nextCursor || loading}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>
    </main>
  );
};

export default WalletDetailView;
