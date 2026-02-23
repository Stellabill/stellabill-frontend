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
}
