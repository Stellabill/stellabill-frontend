/**
 * Typography regression tests
 *
 * Verifies that page-level h1 elements do NOT carry inline fontSize or
 * fontWeight overrides that would break the fluid type scale defined in
 * src/styles/typography.css / tokens.css.
 */
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Plans from './Plans';
import SubscriptionDetail from './SubscriptionDetail';

// ── Mocks required by SubscriptionDetail ────────────────────────────────────

vi.mock('../components/RecentPayments', () => ({
  default: ({ subscriptionId }: { subscriptionId?: string }) => (
    <div data-testid="recent-payments">{subscriptionId}</div>
  ),
}));

vi.mock('../components/UsageThisPeriod', () => ({
  default: () => <div data-testid="usage-this-period" />,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function getH1(container: HTMLElement) {
  return container.querySelector('h1');
}

// ── Plans ────────────────────────────────────────────────────────────────────

describe('Plans page — typography', () => {
  it('renders an h1', () => {
    const { container } = render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );
    expect(getH1(container)).toBeInTheDocument();
  });

  it('h1 has no inline fontSize override', () => {
    const { container } = render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );
    const h1 = getH1(container)!;
    expect(h1.style.fontSize).toBe('');
  });

  it('h1 has no inline fontWeight override', () => {
    const { container } = render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );
    const h1 = getH1(container)!;
    expect(h1.style.fontWeight).toBe('');
  });
});

// ── SubscriptionDetail ───────────────────────────────────────────────────────

function renderSubscriptionDetail(id = 'sub-42') {
  return render(
    <MemoryRouter initialEntries={[`/subscriptions/${id}`]}>
      <Routes>
        <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SubscriptionDetail page — typography', () => {
  it('renders an h1 containing the subscription id', () => {
    const { container } = renderSubscriptionDetail('sub-42');
    const h1 = getH1(container);
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toContain('sub-42');
  });

  it('h1 has no inline fontSize override', () => {
    const { container } = renderSubscriptionDetail();
    expect(getH1(container)!.style.fontSize).toBe('');
  });

  it('h1 has no inline fontWeight override', () => {
    const { container } = renderSubscriptionDetail();
    expect(getH1(container)!.style.fontWeight).toBe('');
  });
});
