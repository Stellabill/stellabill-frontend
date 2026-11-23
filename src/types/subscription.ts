export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled';

export interface Subscription {
  id: string;
  planName: string;
  merchantName: string;
  status: SubscriptionStatus;
  price: number;
  currency: string;
  interval: string;
  lastPayment: string;
  nextCharge: string;
  subscribedSince: string;
  icon?: string;
  /** Optional detail fields returned by GET /subscriptions/:id. */
  trialEndsAt?: string | null;
  cancelledAt?: string | null;
  failedAttempts?: number;
  amount?: number;
  billingDay?: number;
  usageBased?: boolean;
  usage?: {
    billingPeriod: string;
    usage: string;
    estimatedCharge: string;
  } | null;
}
