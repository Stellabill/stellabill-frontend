import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SubscriptionDetailHeader from './SubscriptionDetailHeader';
import SubscriptionBillingSchedule from './SubscriptionBillingSchedule';
import SubscriptionDetailModals from './SubscriptionDetailModals';

describe('SubscriptionDetailHeader', () => {
    it('renders active subscription CTAs and invokes callbacks', () => {
        const onOpenDowngrade = vi.fn();
        const onOpenProration = vi.fn();

        render(
            <MemoryRouter>
                <SubscriptionDetailHeader
                    id="sub-99"
                    subscriptionStatus="active"
                    showReactivateCTA={false}
                    isWithinWindow={false}
                    reactivationError={null}
                    onOpenReactivation={vi.fn()}
                    onOpenDowngrade={onOpenDowngrade}
                    onOpenProration={onOpenProration}
                />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Subscription sub-99');
        fireEvent.click(screen.getByLabelText('Downgrade to a lower plan'));
        fireEvent.click(screen.getByLabelText('Preview proration for plan change'));

        expect(onOpenDowngrade).toHaveBeenCalledTimes(1);
        expect(onOpenProration).toHaveBeenCalledTimes(1);
    });

    it('renders reactivation error alert and expired window notice for cancelled subs', () => {
        render(
            <MemoryRouter>
                <SubscriptionDetailHeader
                    id="sub-99"
                    subscriptionStatus="cancelled"
                    showReactivateCTA={false}
                    isWithinWindow={false}
                    reactivationError={{ message: 'Payment method invalid', technicalDetails: 'err_card' }}
                    onOpenReactivation={vi.fn()}
                    onOpenDowngrade={vi.fn()}
                    onOpenProration={vi.fn()}
                />
            </MemoryRouter>,
        );

        expect(screen.getByRole('alert')).toHaveTextContent('Payment method invalid');
        expect(screen.getByRole('alert')).toHaveTextContent('err_card');
        expect(screen.getByRole('status')).toHaveTextContent('Reactivation window has expired');
    });
});

describe('SubscriptionBillingSchedule', () => {
    it('renders available intervals excluding currentInterval and toggles selection', () => {
        const onSelectInterval = vi.fn();
        render(
            <SubscriptionBillingSchedule
                subscription={{
                    currentInterval: 'monthly',
                    nextCharge: '2026-09-01',
                    amount: 50,
                    currency: 'USDC',
                    billingDay: 1,
                }}
                pendingInterval={null}
                onSelectInterval={onSelectInterval}
            />,
        );

        expect(screen.queryByRole('button', { name: 'Monthly' })).not.toBeInTheDocument();
        const yearlyBtn = screen.getByRole('button', { name: 'Yearly' });
        fireEvent.click(yearlyBtn);
        expect(onSelectInterval).toHaveBeenCalledTimes(1);
    });
});

describe('SubscriptionDetailModals', () => {
    it('renders without crashing when all modals are closed', () => {
        const { container } = render(
            <MemoryRouter>
                <SubscriptionDetailModals
                    isReactivationModalOpen={false}
                    onCloseReactivation={vi.fn()}
                    onConfirmReactivation={vi.fn()}
                    reactivationPlan={{ name: 'Pro', interval: 'Monthly', price: '50 USDC', deleted: false }}
                    isWithinWindow={true}
                    billingDay={1}
                    isReactivating={false}
                    isProrationModalOpen={false}
                    onCloseProration={vi.fn()}
                    onConfirmProration={vi.fn()}
                    isDowngradeModalOpen={false}
                    onCloseDowngrade={vi.fn()}
                    onConfirmDowngrade={vi.fn()}
                    isDowngrading={false}
                />
            </MemoryRouter>,
        );
        expect(container).toBeTruthy();
    });
});
