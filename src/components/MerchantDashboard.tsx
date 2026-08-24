/**
 * MerchantDashboard
 *
 * Displays four KPI cards (Active Subscriptions, MRR, Pending Charges,
 * Available to Withdraw) each decorated with a StaleIndicator that shows
 * "Updated N min ago" and a click-to-refresh affordance.
 *
 * Each card tracks its own `updatedAt` timestamp independently so that a
 * partial refresh (e.g. only subscriptions) doesn't force a full-page reload.
 *
 * In production the `fetchCard` helpers should call the real API. The mock
 * implementations below simulate a 1-second async delay.
 */

import { useState, useCallback } from 'react';
import './MerchantDashboard.css';
import wallet from './assets/Icon (8).svg';
import clock from './assets/Icon (7).svg';
import dollar from './assets/Icon (6).svg';
import pumpArrow from './assets/Icon (5).svg';
import user from './assets/Icon (4).svg';
import RevenueSplitByPlanPanel from './Dashboard/RevenueSplitByPlanPanel';
import type { PlanRevenueSlice } from './Dashboard/revenueSplitUtils';
import StaleIndicator from './StaleIndicator';

const MOCK_PLAN_REVENUE: PlanRevenueSlice[] = [
  { planId: 'basic',      planName: 'Basic',      revenue: 320, previousRevenue: 290 },
  { planId: 'pro',        planName: 'Pro',         revenue: 720, previousRevenue: 680 },
  { planId: 'enterprise', planName: 'Enterprise',  revenue: 200, previousRevenue: 150 },
];

// ── Mock API helpers (replace with real calls) ───────────────────────────────
async function fetchActiveSubscriptions(): Promise<void> {
  await new Promise(r => setTimeout(r, 800));
}

async function fetchMRR(): Promise<void> {
  await new Promise(r => setTimeout(r, 800));
}

async function fetchPendingCharges(): Promise<void> {
  await new Promise(r => setTimeout(r, 800));
}

async function fetchWithdrawable(): Promise<void> {
  await new Promise(r => setTimeout(r, 800));
}

// ── Helper to build a per-card refresh callback ─────────────────────────────
function useCardRefresh(fetcher: () => Promise<void>) {
  const [updatedAt, setUpdatedAt] = useState<string>(() =>
    new Date().toISOString(),
  );

  const refresh = useCallback(async () => {
    await fetcher();
    setUpdatedAt(new Date().toISOString());
  }, [fetcher]);

  return { updatedAt, refresh };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MerchantDashboard() {
  const subs     = useCardRefresh(fetchActiveSubscriptions);
  const mrr      = useCardRefresh(fetchMRR);
  const pending  = useCardRefresh(fetchPendingCharges);
  const withdraw = useCardRefresh(fetchWithdrawable);

  return (
    <>
      <section className="dashboard" aria-label="Merchant overview">
        {/* ── Active Subscriptions ── */}
        <div className="card">
          <div className="flex">
            <div>
              <img src={user} alt="" aria-hidden="true" />
            </div>
            <span>
              <img src={pumpArrow} alt="" aria-hidden="true" /> +3
            </span>
          </div>
          <p>Active subscriptions</p>
          <h1>24</h1>
          <p className="stats">+3 this month</p>
          <StaleIndicator
            updatedAt={subs.updatedAt}
            cardLabel="Active Subscriptions"
            onRefresh={subs.refresh}
          />
        </div>

        {/* ── MRR ── */}
        <div className="card">
          <div className="flex">
            <div>
              <img src={dollar} alt="" aria-hidden="true" />
            </div>
            <span>
              <img src={pumpArrow} alt="" aria-hidden="true" /> +12%
            </span>
          </div>
          <p>MRR</p>
          <h1>
            1,240 <span>usdc</span>
          </h1>
          <p className="stats">Monthly recurring revenue</p>
          <StaleIndicator
            updatedAt={mrr.updatedAt}
            cardLabel="MRR"
            onRefresh={mrr.refresh}
          />
        </div>

        {/* ── Pending Charges ── */}
        <div className="card">
          <div className="flex">
            <div>
              <img src={clock} alt="" aria-hidden="true" />
            </div>
          </div>
          <p>Pending charges</p>
          <h1>5</h1>
          <p className="stats">150 USDC total</p>
          <StaleIndicator
            updatedAt={pending.updatedAt}
            cardLabel="Pending Charges"
            onRefresh={pending.refresh}
          />
        </div>

        {/* ── Available to Withdraw ── */}
        <div className="card">
          <div className="flex">
            <div>
              <img src={wallet} alt="" aria-hidden="true" />
            </div>
          </div>
          <p>Available to withdraw</p>
          <h1>
            800 <span>usdc</span>
          </h1>
          <StaleIndicator
            updatedAt={withdraw.updatedAt}
            cardLabel="Available to Withdraw"
            onRefresh={withdraw.refresh}
          />
          <button type="button">Withdraw</button>
        </div>
      </section>

      <div className="merchant-revenue-split">
        <RevenueSplitByPlanPanel
          plans={MOCK_PLAN_REVENUE}
          periodLabel="this month"
          previousPeriodLabel="vs last month"
        />
      </div>
    </>
  );
}
