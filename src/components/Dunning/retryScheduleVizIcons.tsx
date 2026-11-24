/**
 * retryScheduleVizIcons
 * ---------------------
 * Tiny icon sub-components used by RetryScheduleViz chips.
 * Kept separate so they can be tested and replaced independently.
 */

import {
  BanknoteIcon,
  Check,
  Clock,
  CreditCard,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import type { AttemptStatus, PaymentMethodKind } from './retryScheduleVizHelpers';

/** Renders the icon that corresponds to a payment method kind. */
export function MethodIcon({ kind }: { kind: PaymentMethodKind }) {
  const size = 10;
  switch (kind) {
    case 'card':    return <CreditCard size={size} aria-hidden="true" />;
    case 'usdc':    return <Zap size={size} aria-hidden="true" />;
    case 'prepaid': return <Wallet size={size} aria-hidden="true" />;
    case 'bank':    return <BanknoteIcon size={size} aria-hidden="true" />;
    default:        return null;
  }
}

/** Renders the icon that corresponds to an attempt status. */
export function StatusIcon({ status }: { status: AttemptStatus }) {
  const size = 14;
  switch (status) {
    case 'succeeded': return <Check size={size} aria-hidden="true" />;
    case 'failed':    return <X size={size} aria-hidden="true" />;
    case 'upcoming':  return <Clock size={size} aria-hidden="true" />;
    default:          return <Check size={size} aria-hidden="true" />;
  }
}
