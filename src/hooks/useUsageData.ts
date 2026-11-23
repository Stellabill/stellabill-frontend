import { useEffect, useState } from 'react';
import type { BillingInterval } from '../utils/billingDate';
import {
  formatBillingDate,
  getCurrentBillingPeriod,
  parseBillingDate,
} from '../utils/billingDate';

export interface UsageData {
  planName: string;
  billingPeriod: string;
  usageCount: number;
  usageLimit: number;
  unit: string;
  amount: string;
  currency: string;
  currentPeriod: {
    start: string;
    end: string;
  };
}

export interface UseUsageDataResult {
  data: UsageData | null;
  isLoading: boolean;
  error: Error | null;
}

interface UsageFixture {
  planName: string;
  periodAnchor: string;
  interval: BillingInterval;
  usageCount: number;
  usageLimit: number;
  unit: string;
  amount: string;
  currency: string;
}

const LOAD_DELAY_MS = 300;

const USAGE_FIXTURE: UsageFixture = {
  planName: 'Developer Pro',
  periodAnchor: '2026-01-15',
  interval: 'monthly',
  usageCount: 32450,
  usageLimit: 50000,
  unit: 'API calls',
  amount: '16.23',
  currency: 'USDC',
};

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const INITIAL_STATE: UseUsageDataResult = {
  data: null,
  isLoading: true,
  error: null,
};

function formatPeriodLabel(start: Date, end: Date): string {
  const startLabel = MONTH_LABELS[start.getMonth()] + ' ' + start.getDate();
  const endLabel = MONTH_LABELS[end.getMonth()] + ' ' + end.getDate() + ', ' + end.getFullYear();
  return startLabel + ' – ' + endLabel;
}

function buildUsageData(): UsageData {
  const { start, end } = getCurrentBillingPeriod(
    parseBillingDate(USAGE_FIXTURE.periodAnchor),
    USAGE_FIXTURE.interval,
  );

  return {
    planName: USAGE_FIXTURE.planName,
    billingPeriod: formatPeriodLabel(start, end),
    usageCount: USAGE_FIXTURE.usageCount,
    usageLimit: USAGE_FIXTURE.usageLimit,
    unit: USAGE_FIXTURE.unit,
    amount: USAGE_FIXTURE.amount,
    currency: USAGE_FIXTURE.currency,
    currentPeriod: {
      start: formatBillingDate(start),
      end: formatBillingDate(end),
    },
  };
}

function loadUsageData(id: string | undefined): Promise<UsageData> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!id) {
        reject(new Error('Missing subscription id.'));
        return;
      }
      if (id === 'error') {
        reject(new Error('We could not load usage data for this subscription.'));
        return;
      }
      resolve(buildUsageData());
    }, LOAD_DELAY_MS);
  });
}

export function useUsageData(id: string | undefined): UseUsageDataResult {
  const [state, setState] = useState<UseUsageDataResult>(INITIAL_STATE);

  useEffect(() => {
    let active = true;
    setState(INITIAL_STATE);

    loadUsageData(id)
      .then((data) => {
        if (active) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  return state;
}
