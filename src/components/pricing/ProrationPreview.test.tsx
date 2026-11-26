import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProrationPreview from './ProrationPreview';

describe('ProrationPreview', () => {
  describe('proration math — upgrade 10 → 20 over 30/15 days', () => {
    it('shows credit of -5.00 for unused time on current plan', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
          billingCycleDays={30}
          daysRemainingInCycle={15}
        />
      );
      // credit = (10 / 30) * 15 = 5.00 → displayed as -$5.00
      expect(screen.getByText('-$5.00')).toBeInTheDocument();
    });

    it('shows new plan cost of 10.00 for rest of cycle', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
          billingCycleDays={30}
          daysRemainingInCycle={15}
        />
      );
      // new cost = (20 / 30) * 15 = 10.00
      expect(screen.getByText('$10.00')).toBeInTheDocument();
    });

    it('shows "Amount due today" label and amount of 5.00', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
          billingCycleDays={30}
          daysRemainingInCycle={15}
        />
      );
      // amount due = 10.00 - 5.00 = 5.00
      expect(screen.getByText('Amount due today')).toBeInTheDocument();
      expect(screen.getByText('$5.00')).toBeInTheDocument();
    });
  });

  describe('downgrade — 20 → 10', () => {
    it('shows "Credit to your account" label for a downgrade', () => {
      render(
        <ProrationPreview
          oldPlanPrice={20}
          newPlanPrice={10}
          currency="USD"
          billingCycleDays={30}
          daysRemainingInCycle={15}
        />
      );
      // amount due = (10/30)*15 - (20/30)*15 = 5 - 10 = -5 → credit
      expect(screen.getByText('Credit to your account')).toBeInTheDocument();
    });

    it('does not show "Amount due today" for a downgrade', () => {
      render(
        <ProrationPreview
          oldPlanPrice={20}
          newPlanPrice={10}
          currency="USD"
          billingCycleDays={30}
          daysRemainingInCycle={15}
        />
      );
      expect(screen.queryByText('Amount due today')).not.toBeInTheDocument();
    });
  });

  describe('edge states — zero/negative cycle values', () => {
    it('renders "Not applicable…" when daysRemainingInCycle is 0', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
          billingCycleDays={30}
          daysRemainingInCycle={0}
        />
      );
      expect(
        screen.getByText('Not applicable for immediate change at end of cycle.')
      ).toBeInTheDocument();
    });

    it('renders "Not applicable…" when daysRemainingInCycle is negative', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
          billingCycleDays={30}
          daysRemainingInCycle={-1}
        />
      );
      expect(
        screen.getByText('Not applicable for immediate change at end of cycle.')
      ).toBeInTheDocument();
    });

    it('renders "Not applicable…" when billingCycleDays is 0', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
          billingCycleDays={0}
          daysRemainingInCycle={15}
        />
      );
      expect(
        screen.getByText('Not applicable for immediate change at end of cycle.')
      ).toBeInTheDocument();
    });

    it('renders "Not applicable…" when billingCycleDays is negative', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
          billingCycleDays={-5}
          daysRemainingInCycle={15}
        />
      );
      expect(
        screen.getByText('Not applicable for immediate change at end of cycle.')
      ).toBeInTheDocument();
    });

    it('does not render proration details when in edge state', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
          billingCycleDays={0}
          daysRemainingInCycle={0}
        />
      );
      expect(screen.queryByText('Proration Preview')).not.toBeInTheDocument();
      expect(screen.queryByText('Amount due today')).not.toBeInTheDocument();
    });
  });

  describe('currency formatting via Intl.NumberFormat', () => {
    it('formats amounts in EUR', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="EUR"
          billingCycleDays={30}
          daysRemainingInCycle={15}
        />
      );
      // Intl.NumberFormat en-US EUR formats as €5.00, €10.00
      const formatted = screen.getAllByText(/€/);
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('formats amounts in GBP', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="GBP"
          billingCycleDays={30}
          daysRemainingInCycle={15}
        />
      );
      const formatted = screen.getAllByText(/£/);
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('default prop values — billingCycleDays=30, daysRemainingInCycle=15', () => {
    it('computes correctly when billingCycleDays and daysRemainingInCycle are omitted', () => {
      render(
        <ProrationPreview
          oldPlanPrice={10}
          newPlanPrice={20}
          currency="USD"
        />
      );
      // defaults: 30 days cycle, 15 remaining → same as the upgrade test above
      expect(screen.getByText('Amount due today')).toBeInTheDocument();
      expect(screen.getByText('$5.00')).toBeInTheDocument();
      expect(screen.getByText('-$5.00')).toBeInTheDocument();
      expect(screen.getByText('$10.00')).toBeInTheDocument();
    });
  });
});
