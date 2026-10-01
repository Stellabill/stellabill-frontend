import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscriptionActions from './SubscriptionActions';

// ---------------------------------------------------------------------------
// Helpers for viewport width manipulation
// ---------------------------------------------------------------------------

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

const DESKTOP_WIDTH = 1024;
const MOBILE_WIDTH = 375;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SubscriptionActions', () => {
  // Restore viewport after every test so tests don't bleed into each other.
  afterEach(() => {
    setViewportWidth(DESKTOP_WIDTH);
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Default props / desktop layout
  // -------------------------------------------------------------------------

  describe('Desktop layout (width ≥ 720)', () => {
    beforeEach(() => {
      setViewportWidth(DESKTOP_WIDTH);
    });

    it('renders the inline actions panel', () => {
      render(<SubscriptionActions />);
      // Desktop: no trigger button, just the panel heading
      expect(screen.getByRole('heading', { name: /actions/i })).toBeInTheDocument();
    });

    it('renders View usage button when hasUsageBilling is true (default)', () => {
      render(<SubscriptionActions />);
      expect(
        screen.getByRole('button', { name: /view usage/i }),
      ).toBeInTheDocument();
    });

    it('hides View usage button when hasUsageBilling is false', () => {
      render(<SubscriptionActions hasUsageBilling={false} />);
      expect(
        screen.queryByRole('button', { name: /view usage/i }),
      ).not.toBeInTheDocument();
    });

    it('renders Pause subscription button', () => {
      render(<SubscriptionActions />);
      expect(
        screen.getByRole('button', { name: /pause subscription/i }),
      ).toBeInTheDocument();
    });

    it('renders Cancel subscription button', () => {
      render(<SubscriptionActions />);
      expect(
        screen.getByRole('button', { name: /cancel subscription/i }),
      ).toBeInTheDocument();
    });

    it('Pause button is enabled when isPaused is false (default)', () => {
      render(<SubscriptionActions />);
      const pauseBtn = screen.getByRole('button', { name: /pause subscription/i });
      expect(pauseBtn).not.toBeDisabled();
    });

    it('Pause button is disabled when isPaused is true', () => {
      render(<SubscriptionActions isPaused />);
      const pauseBtn = screen.getByRole('button', { name: /pause subscription/i });
      expect(pauseBtn).toBeDisabled();
    });

    it('Pause button carries aria-disabled when isPaused is true', () => {
      render(<SubscriptionActions isPaused />);
      const pauseBtn = screen.getByRole('button', { name: /pause subscription/i });
      expect(pauseBtn).toHaveAttribute('aria-disabled', 'true');
    });

    it('calls onViewUsage when View usage is clicked', async () => {
      const user = userEvent.setup();
      const onViewUsage = vi.fn();
      render(<SubscriptionActions onViewUsage={onViewUsage} />);
      await user.click(screen.getByRole('button', { name: /view usage/i }));
      expect(onViewUsage).toHaveBeenCalledOnce();
    });

    it('calls onPauseSubscription when Pause is clicked', async () => {
      const user = userEvent.setup();
      const onPauseSubscription = vi.fn();
      render(<SubscriptionActions onPauseSubscription={onPauseSubscription} />);
      await user.click(screen.getByRole('button', { name: /pause subscription/i }));
      expect(onPauseSubscription).toHaveBeenCalledOnce();
    });

    it('does NOT call onPauseSubscription when Pause is clicked while isPaused', async () => {
      const user = userEvent.setup();
      const onPauseSubscription = vi.fn();
      render(<SubscriptionActions isPaused onPauseSubscription={onPauseSubscription} />);
      // Disabled button should not fire
      await user.click(screen.getByRole('button', { name: /pause subscription/i }));
      expect(onPauseSubscription).not.toHaveBeenCalled();
    });

    it('calls onCancelSubscription when Cancel is clicked', async () => {
      const user = userEvent.setup();
      const onCancelSubscription = vi.fn();
      render(<SubscriptionActions onCancelSubscription={onCancelSubscription} />);
      await user.click(screen.getByRole('button', { name: /cancel subscription/i }));
      expect(onCancelSubscription).toHaveBeenCalledOnce();
    });

    it('does not throw when optional callbacks are not provided', async () => {
      const user = userEvent.setup();
      render(<SubscriptionActions />);
      // Clicking any action without callbacks should not throw
      await expect(
        user.click(screen.getByRole('button', { name: /view usage/i })),
      ).resolves.not.toThrow();
      await expect(
        user.click(screen.getByRole('button', { name: /cancel subscription/i })),
      ).resolves.not.toThrow();
    });

    it('all interactive buttons are keyboard accessible', () => {
      render(<SubscriptionActions />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn.tagName).toBe('BUTTON');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Mobile layout (width < 720) — BottomSheet trigger
  // -------------------------------------------------------------------------

  describe('Mobile layout (width < 720)', () => {
    beforeEach(() => {
      setViewportWidth(MOBILE_WIDTH);
    });

    it('renders the mobile "Actions" trigger button', () => {
      render(<SubscriptionActions />);
      expect(
        screen.getByRole('button', { name: /open subscription actions/i }),
      ).toBeInTheDocument();
    });

    it('does NOT render inline action buttons before opening the sheet', () => {
      render(<SubscriptionActions />);
      // Sheet is closed — action buttons should not be visible
      expect(screen.queryByRole('button', { name: /view usage/i })).not.toBeInTheDocument();
    });

    it('opens BottomSheet when trigger button is clicked', async () => {
      const user = userEvent.setup();
      render(<SubscriptionActions />);
      await user.click(screen.getByRole('button', { name: /open subscription actions/i }));
      // Sheet content should now be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders action buttons inside the open sheet', async () => {
      const user = userEvent.setup();
      render(<SubscriptionActions />);
      await user.click(screen.getByRole('button', { name: /open subscription actions/i }));
      expect(screen.getByRole('button', { name: /view usage/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause subscription/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel subscription/i })).toBeInTheDocument();
    });

    it('trigger button has aria-haspopup="dialog"', () => {
      render(<SubscriptionActions />);
      const trigger = screen.getByRole('button', { name: /open subscription actions/i });
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('trigger button sets aria-expanded when sheet is open', async () => {
      const user = userEvent.setup();
      render(<SubscriptionActions />);
      const trigger = screen.getByRole('button', { name: /open subscription actions/i });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await user.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('calls onViewUsage via sheet and closes it', async () => {
      const user = userEvent.setup();
      const onViewUsage = vi.fn();
      render(<SubscriptionActions onViewUsage={onViewUsage} />);
      await user.click(screen.getByRole('button', { name: /open subscription actions/i }));
      await user.click(screen.getByRole('button', { name: /view usage/i }));
      expect(onViewUsage).toHaveBeenCalledOnce();
      // Sheet should be closed after action
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onCancelSubscription via sheet', async () => {
      const user = userEvent.setup();
      const onCancelSubscription = vi.fn();
      render(<SubscriptionActions onCancelSubscription={onCancelSubscription} />);
      await user.click(screen.getByRole('button', { name: /open subscription actions/i }));
      await user.click(screen.getByRole('button', { name: /cancel subscription/i }));
      expect(onCancelSubscription).toHaveBeenCalledOnce();
    });

    it('hides View usage inside the sheet when hasUsageBilling is false', async () => {
      const user = userEvent.setup();
      render(<SubscriptionActions hasUsageBilling={false} />);
      await user.click(screen.getByRole('button', { name: /open subscription actions/i }));
      expect(screen.queryByRole('button', { name: /view usage/i })).not.toBeInTheDocument();
    });

    it('Pause button inside the sheet is disabled when isPaused is true', async () => {
      const user = userEvent.setup();
      render(<SubscriptionActions isPaused />);
      await user.click(screen.getByRole('button', { name: /open subscription actions/i }));
      expect(screen.getByRole('button', { name: /pause subscription/i })).toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Viewport transition — resize event
  // -------------------------------------------------------------------------

  describe('Responsive behavior on resize', () => {
    it('switches from desktop to mobile layout when viewport narrows below 720', () => {
      setViewportWidth(DESKTOP_WIDTH);
      render(<SubscriptionActions />);
      // Desktop: heading, no trigger button
      expect(screen.getByRole('heading', { name: /actions/i })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /open subscription actions/i }),
      ).not.toBeInTheDocument();

      // Simulate resize to mobile
      setViewportWidth(MOBILE_WIDTH);
      fireEvent(window, new Event('resize'));

      expect(
        screen.getByRole('button', { name: /open subscription actions/i }),
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Boundary / invalid inputs
  // -------------------------------------------------------------------------

  describe('Boundary and invalid inputs', () => {
    beforeEach(() => setViewportWidth(DESKTOP_WIDTH));

    it('renders without crashing when all optional props are omitted', () => {
      expect(() => render(<SubscriptionActions />)).not.toThrow();
    });

    it('renders correctly when both hasUsageBilling and isPaused are explicitly false', () => {
      render(<SubscriptionActions hasUsageBilling={false} isPaused={false} />);
      expect(
        screen.queryByRole('button', { name: /view usage/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /pause subscription/i }),
      ).not.toBeDisabled();
    });

    it('renders correctly when both hasUsageBilling and isPaused are true', () => {
      render(<SubscriptionActions hasUsageBilling isPaused />);
      expect(
        screen.getByRole('button', { name: /view usage/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /pause subscription/i }),
      ).toBeDisabled();
    });
  });
});
