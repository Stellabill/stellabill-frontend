import { describe, it, expect } from 'vitest';
import {
    REACTIVATION_WINDOW_DAYS,
    INTERVAL_OPTIONS,
    extractErrorStatus,
    getErrorMessage,
    formatReactivationError,
    getDaysSinceCancellation,
    isWithinReactivationWindow,
    getAvailableIntervalOptions,
    togglePendingInterval,
    deriveSubscriptionViewModel,
} from './subscriptionDetailHelpers';
import type { Subscription } from '../types/subscription';

describe('subscriptionDetailHelpers', () => {
    describe('extractErrorStatus', () => {
        it('returns numeric status from error-like objects', () => {
            expect(extractErrorStatus({ status: 404 })).toBe(404);
            expect(extractErrorStatus({ status: 500, message: 'Server error' })).toBe(500);
        });

        it('returns undefined when status is missing or input is not an object', () => {
            expect(extractErrorStatus(null)).toBeUndefined();
            expect(extractErrorStatus(undefined)).toBeUndefined();
            expect(extractErrorStatus('error')).toBeUndefined();
            expect(extractErrorStatus(new Error('boom'))).toBeUndefined();
        });
    });

    describe('getErrorMessage', () => {
        it('returns message from Error instances', () => {
            expect(getErrorMessage(new Error('Network down'), 'Fallback')).toBe('Network down');
        });

        it('returns fallback for non-Error values', () => {
            expect(getErrorMessage({ status: 500 }, 'Fallback')).toBe('Fallback');
            expect(getErrorMessage('string error', 'Fallback')).toBe('Fallback');
        });
    });

    describe('formatReactivationError', () => {
        it('extracts message and technicalDetails from ApiError-like Error', () => {
            const err = Object.assign(new Error('Card declined'), {
                technicalDetails: 'code: insufficient_funds',
            });
            expect(formatReactivationError(err)).toEqual({
                message: 'Card declined',
                technicalDetails: 'code: insufficient_funds',
            });
        });

        it('uses default message when error is not an Error or has empty message', () => {
            expect(formatReactivationError({})).toEqual({
                message: 'Failed to reactivate subscription. Please try again.',
                technicalDetails: undefined,
            });
        });
    });

    describe('getDaysSinceCancellation & isWithinReactivationWindow', () => {
        const now = new Date('2026-08-31T12:00:00Z').getTime();

        it('returns 0 days and false for null cancelledAt', () => {
            expect(getDaysSinceCancellation(null, now)).toBe(0);
            expect(isWithinReactivationWindow(null, now)).toBe(false);
        });

        it('returns true when cancelled within REACTIVATION_WINDOW_DAYS', () => {
            const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000);
            expect(getDaysSinceCancellation(tenDaysAgo, now)).toBe(10);
            expect(isWithinReactivationWindow(tenDaysAgo, now)).toBe(true);
        });

        it('returns true on the exact boundary day', () => {
            const boundary = new Date(now - REACTIVATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
            expect(getDaysSinceCancellation(boundary, now)).toBe(REACTIVATION_WINDOW_DAYS);
            expect(isWithinReactivationWindow(boundary, now)).toBe(true);
        });

        it('returns false when cancelled beyond REACTIVATION_WINDOW_DAYS', () => {
            const expired = new Date(now - (REACTIVATION_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000);
            expect(getDaysSinceCancellation(expired, now)).toBe(REACTIVATION_WINDOW_DAYS + 1);
            expect(isWithinReactivationWindow(expired, now)).toBe(false);
        });
    });

    describe('getAvailableIntervalOptions', () => {
        it('excludes the current interval from INTERVAL_OPTIONS', () => {
            const options = getAvailableIntervalOptions('monthly');
            expect(options).toHaveLength(INTERVAL_OPTIONS.length - 1);
            expect(options.some((o) => o.value === 'monthly')).toBe(false);
        });
    });

    describe('togglePendingInterval', () => {
        it('selects interval when none or different is active', () => {
            expect(togglePendingInterval(null, 'yearly')).toBe('yearly');
            expect(togglePendingInterval('weekly', 'yearly')).toBe('yearly');
        });

        it('clears interval when clicking the already-selected interval', () => {
            expect(togglePendingInterval('yearly', 'yearly')).toBeNull();
        });
    });

    describe('deriveSubscriptionViewModel', () => {
        const now = new Date('2026-08-31T12:00:00Z').getTime();

        it('returns sensible defaults for null subscriptionData', () => {
            const vm = deriveSubscriptionViewModel(null, now);
            expect(vm.subscriptionStatus).toBe('active');
            expect(vm.isTrialSubscription).toBe(false);
            expect(vm.showDunningBanner).toBe(false);
            expect(vm.showReactivateCTA).toBe(false);
            expect(vm.subscription).toEqual({
                currentInterval: 'monthly',
                nextCharge: '',
                amount: 0,
                currency: 'USDC',
                billingDay: 1,
            });
            expect(vm.reactivationPlan).toEqual({
                name: 'Pro Monthly',
                interval: 'Monthly',
                price: '0 USDC',
                deleted: false,
            });
        });

        it('derives cancelled subscription within reactivation window', () => {
            const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
            const data = {
                id: 'sub-1',
                status: 'cancelled',
                cancelledAt: fiveDaysAgo,
                planName: 'Enterprise',
                interval: 'yearly',
                amount: 120,
                currency: 'USDC',
                billingDay: 15,
                failedAttempts: 2,
                usageBased: true,
            } as unknown as Subscription;

            const vm = deriveSubscriptionViewModel(data, now);
            expect(vm.subscriptionStatus).toBe('cancelled');
            expect(vm.isWithinWindow).toBe(true);
            expect(vm.showReactivateCTA).toBe(true);
            expect(vm.showDunningBanner).toBe(true);
            expect(vm.isUsageBased).toBe(true);
            expect(vm.reactivationPlan.name).toBe('Enterprise');
            expect(vm.reactivationPlan.price).toBe('120 USDC');
        });

        it('hides reactivate CTA when cancellation window has expired', () => {
            const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();
            const data = {
                id: 'sub-2',
                status: 'cancelled',
                cancelledAt: fortyDaysAgo,
            } as unknown as Subscription;

            const vm = deriveSubscriptionViewModel(data, now);
            expect(vm.subscriptionStatus).toBe('cancelled');
            expect(vm.isWithinWindow).toBe(false);
            expect(vm.showReactivateCTA).toBe(false);
        });
    });
});
