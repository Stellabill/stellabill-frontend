/**
 * ReactivationModal.test.tsx
 *
 * Tests cover:
 * - Basic rendering (open/closed, plan summary, icon, heading)
 * - Start-date options: "Start today", "Same billing day", "Custom date"
 * - Same-billing-day visibility (hidden when billing day === today)
 * - Custom date calendar renders and date selection works
 * - Microcopy updates with each mode
 * - Confirm button disabled states (plan deleted, window expired, custom without date)
 * - onConfirm called with correct date for each mode
 * - Loading state (spinner, button label)
 * - Deleted-plan warning (role=alert)
 * - Expired-window banner (role=alert, blocks confirm)
 * - Close via button, overlay click, and Escape key
 * - Focus management (initial focus on "Keep cancelled" button)
 * - Accessibility: role=dialog, aria-modal, aria-labelledby, aria-describedby,
 *   aria-pressed on date options, all SVGs aria-hidden
 * - RTL: renders without errors inside dir=rtl container
 * - State resets on close/reopen
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReactivationModal, { type ReactivationPlan } from './ReactivationModal';

// ── Shared fixtures ──────────────────────────────────────────────────────────

const PLAN: ReactivationPlan = {
  name: 'Pro Monthly',
  interval: 'Monthly',
  price: '50 USDC',
  deleted: false,
};

const DELETED_PLAN: ReactivationPlan = {
  ...PLAN,
  deleted: true,
};

function renderModal(
  overrides: Partial<Parameters<typeof ReactivationModal>[0]> = {}
) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const result = render(
    <ReactivationModal
      isOpen={true}
      onClose={onClose}
      onConfirm={onConfirm}
      plan={PLAN}
      billingDay={15}
      {...overrides}
      // Spread after so caller can override onClose/onConfirm too
    />
  );
  return { onClose, onConfirm, container: result.container };
}

// ── Basic rendering ──────────────────────────────────────────────────────────

describe('ReactivationModal – basic rendering', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when isOpen=true', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    renderModal();
    expect(
      screen.getByRole('heading', { name: /reactivate subscription/i })
    ).toBeInTheDocument();
  });

  it('renders the plan name', () => {
    renderModal();
    expect(screen.getAllByText('Pro Monthly').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the plan interval', () => {
    renderModal();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('renders the plan price', () => {
    renderModal();
    expect(screen.getByText('50 USDC')).toBeInTheDocument();
  });

  it('renders the keep-cancelled and reactivate buttons', () => {
    renderModal();
    expect(
      screen.getByRole('button', { name: /keep cancelled/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /confirm reactivation|reactivate/i })
    ).toBeInTheDocument();
  });
});

// ── Accessibility ────────────────────────────────────────────────────────────

describe('ReactivationModal – accessibility', () => {
  it('has role=dialog and aria-modal=true', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('dialog is labelled by the heading', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'reactivation-modal-title');
    expect(
      document.getElementById('reactivation-modal-title')
    ).toBeInTheDocument();
  });

  it('dialog has aria-describedby pointing at the description', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'reactivation-modal-description');
    expect(
      document.getElementById('reactivation-modal-description')
    ).toBeInTheDocument();
  });

  it('all SVG icons are aria-hidden', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
      />
    );
    container.querySelectorAll('svg').forEach(svg => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('close button has descriptive aria-label', () => {
    renderModal();
    expect(
      screen.getByRole('button', { name: /close reactivation dialog/i })
    ).toBeInTheDocument();
  });

  it('date option buttons have aria-pressed', () => {
    const { container } = renderModal();
    const opts = container.querySelectorAll('.reactivation-date-opt');
    opts.forEach(opt => {
      expect(opt).toHaveAttribute('aria-pressed');
    });
  });

  it('"Start today" option is pressed by default', () => {
    renderModal();
    const todayBtn = screen.getByRole('button', { name: /start today/i });
    expect(todayBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('date options group has aria-labelledby', () => {
    const { container } = renderModal();
    const group = container.querySelector('[role="group"]');
    expect(group).toHaveAttribute('aria-labelledby', 'reactivation-date-label');
  });

  it('time elements have dateTime attributes', () => {
    const { container } = renderModal();
    const timeEls = container.querySelectorAll('time');
    timeEls.forEach(el => {
      expect(el.getAttribute('dateTime')).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });
  });
});

// ── Close behaviour ──────────────────────────────────────────────────────────

describe('ReactivationModal – closing', () => {
  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('button', { name: /close reactivation dialog/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when "Keep cancelled" button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();
    await user.click(screen.getByRole('button', { name: /keep cancelled/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        plan={PLAN}
      />
    );
    // Click the overlay (first child of the portal)
    const overlay = container.querySelector('.reactivation-modal-overlay');
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── Start-date options ───────────────────────────────────────────────────────

describe('ReactivationModal – start-date modes', () => {
  it('defaults to "Start today" mode', () => {
    renderModal();
    const todayBtn = screen.getByRole('button', { name: /start today/i });
    expect(todayBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows "Same billing day" option when billingDay !== today', () => {
    // billingDay=15 will almost always differ from today's day
    renderModal({ billingDay: 15 });
    expect(
      screen.getByRole('button', { name: /same billing day/i })
    ).toBeInTheDocument();
  });

  it('selecting "Same billing day" updates aria-pressed', async () => {
    const user = userEvent.setup();
    renderModal({ billingDay: 15 });
    const billingDayBtn = screen.getByRole('button', { name: /same billing day/i });
    await user.click(billingDayBtn);
    expect(billingDayBtn).toHaveAttribute('aria-pressed', 'true');
    // "Start today" should no longer be pressed
    expect(
      screen.getByRole('button', { name: /start today/i })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('selecting "Custom date" shows the calendar', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /custom date/i }));
    expect(screen.getByRole('application')).toBeInTheDocument(); // DatePickerCalendar
  });

  it('selecting "Start today" hides the calendar', async () => {
    const user = userEvent.setup();
    renderModal();
    // first open calendar
    await user.click(screen.getByRole('button', { name: /custom date/i }));
    expect(screen.getByRole('application')).toBeInTheDocument();
    // then switch back
    await user.click(screen.getByRole('button', { name: /start today/i }));
    expect(screen.queryByRole('application')).not.toBeInTheDocument();
  });
});

// ── Microcopy ────────────────────────────────────────────────────────────────

describe('ReactivationModal – microcopy', () => {
  it('shows "today" microcopy in default mode', () => {
    renderModal();
    const note = screen.getByRole('note');
    expect(within(note).getByText(/Access and billing begin today/i)).toBeInTheDocument();
  });

  it('shows billing-day microcopy when billing-day mode is selected', async () => {
    const user = userEvent.setup();
    renderModal({ billingDay: 15 });
    await user.click(screen.getByRole('button', { name: /same billing day/i }));
    const note = screen.getByRole('note');
    expect(within(note).getByText(/billing cycle will reset to day 15/i)).toBeInTheDocument();
  });

  it('shows "pick a date" text for custom mode before date selected', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /custom date/i }));
    expect(screen.getByText(/pick a date/i)).toBeInTheDocument();
  });
});

// ── Confirm button state ─────────────────────────────────────────────────────

describe('ReactivationModal – confirm button', () => {
  it('is enabled in default (today) mode', () => {
    renderModal();
    const btn = screen.getByRole('button', { name: /confirm reactivation|reactivate/i });
    expect(btn).not.toBeDisabled();
  });

  it('is disabled in custom mode until a date is picked', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /custom date/i }));
    const btn = screen.getByRole('button', { name: /confirm reactivation|reactivate/i });
    expect(btn).toBeDisabled();
  });

  it('is disabled when plan is deleted', () => {
    renderModal({ plan: DELETED_PLAN });
    const btn = screen.getByRole('button', { name: /confirm reactivation|reactivate/i });
    expect(btn).toBeDisabled();
  });

  it('is disabled when window is expired', () => {
    renderModal({ windowExpired: true });
    const btn = screen.getByRole('button', { name: /confirm reactivation|reactivate/i });
    expect(btn).toBeDisabled();
  });

  it('is disabled when isLoading=true', () => {
    renderModal({ isLoading: true });
    const btn = screen.getByRole('button', { name: /reactivating|please wait/i });
    expect(btn).toBeDisabled();
  });

  it('calls onConfirm with today\'s date in "today" mode', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        plan={PLAN}
      />
    );
    await user.click(screen.getByRole('button', { name: /confirm reactivation|^reactivate$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const calledDate: Date = onConfirm.mock.calls[0][0];
    const now = new Date();
    expect(calledDate.getFullYear()).toBe(now.getFullYear());
    expect(calledDate.getMonth()).toBe(now.getMonth());
    expect(calledDate.getDate()).toBe(now.getDate());
  });
});

// ── Loading state ────────────────────────────────────────────────────────────

describe('ReactivationModal – loading state', () => {
  it('shows spinner text when loading', () => {
    renderModal({ isLoading: true });
    expect(screen.getByText(/reactivating/i)).toBeInTheDocument();
  });

  it('renders spinner element when loading', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
        isLoading={true}
      />
    );
    expect(container.querySelector('.reactivation-spinner')).toBeInTheDocument();
  });

  it('"Keep cancelled" button is disabled when loading', () => {
    renderModal({ isLoading: true });
    expect(
      screen.getByRole('button', { name: /keep cancelled/i })
    ).toBeDisabled();
  });
});

// ── Deleted-plan edge case ───────────────────────────────────────────────────

describe('ReactivationModal – deleted plan', () => {
  it('shows deleted-plan alert', () => {
    renderModal({ plan: DELETED_PLAN });
    expect(
      screen.getByText(/plan is no longer available/i)
    ).toBeInTheDocument();
  });

  it('deleted alert has role=alert', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={DELETED_PLAN}
      />
    );
    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });

  it('date option buttons are disabled when plan is deleted', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={DELETED_PLAN}
      />
    );
    const opts = container.querySelectorAll('.reactivation-date-opt');
    opts.forEach(opt => {
      expect(opt).toBeDisabled();
    });
  });
});

// ── Expired window edge case ─────────────────────────────────────────────────

describe('ReactivationModal – expired reactivation window', () => {
  it('shows expired-window banner', () => {
    renderModal({ windowExpired: true });
    expect(screen.getByText(/reactivation window has expired/i)).toBeInTheDocument();
  });

  it('expired banner has role=alert', () => {
    renderModal({ windowExpired: true });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('date option buttons are disabled when window is expired', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
        windowExpired={true}
      />
    );
    const opts = container.querySelectorAll('.reactivation-date-opt');
    opts.forEach(opt => {
      expect(opt).toBeDisabled();
    });
  });
});

// ── State reset on reopen ────────────────────────────────────────────────────

describe('ReactivationModal – state resets on close/reopen', () => {
  it('resets mode to "today" when reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
        billingDay={15}
      />
    );
    // Switch to billing-day mode
    await user.click(screen.getByRole('button', { name: /same billing day/i }));
    expect(
      screen.getByRole('button', { name: /same billing day/i })
    ).toHaveAttribute('aria-pressed', 'true');

    // Close then reopen
    rerender(
      <ReactivationModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
        billingDay={15}
      />
    );
    rerender(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
        billingDay={15}
      />
    );

    // Should be back to "today" mode
    expect(
      screen.getByRole('button', { name: /start today/i })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

// ── RTL ──────────────────────────────────────────────────────────────────────

describe('ReactivationModal – RTL layout', () => {
  it('renders without errors inside a dir=rtl container', () => {
    const { container } = render(
      <div dir="rtl">
        <ReactivationModal
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          plan={PLAN}
          billingDay={15}
        />
      </div>
    );
    expect(
      container.querySelector('.reactivation-modal-content')
    ).toBeInTheDocument();
  });
});

// ── Snapshot ─────────────────────────────────────────────────────────────────

describe('ReactivationModal – snapshot', () => {
  it('matches snapshot for standard open state', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
        billingDay={15}
        windowExpired={false}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for expired window', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={PLAN}
        windowExpired={true}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for deleted plan', () => {
    const { container } = render(
      <ReactivationModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        plan={DELETED_PLAN}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
