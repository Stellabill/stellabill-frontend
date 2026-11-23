import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UsageBilling from './UsageBilling';

vi.mock('../components/InvoiceList', () => ({
  default: () => <div data-testid="invoice-list" />,
}));

vi.mock('../components/PlanRecommendationBanner', () => ({
  default: () => <div data-testid="plan-recommendation-banner" />,
}));

vi.mock('../components/past-periods/ReceiptPreview', () => ({
  default: () => <div data-testid="receipt-preview" />,
}));

vi.mock('../components/past-periods/past-periods', () => ({
  PastPeriods: () => <div data-testid="past-periods" />,
}));

function renderPage(id: string) {
  return render(
    <MemoryRouter initialEntries={['/subscriptions/' + id + '/usage']}>
      <Routes>
        <Route path="/subscriptions/:id/usage" element={<UsageBilling />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function finishLoading() {
  await act(async () => {
    vi.advanceTimersByTime(300);
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('UsageBilling', () => {
  it('renders the usage skeleton while data is loading', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 6, 20));

    renderPage('sub-1');

    expect(screen.getByLabelText('Loading usage data')).toBeInTheDocument();
    expect(screen.queryByText('Usage & Billing')).not.toBeInTheDocument();
  });

  it('renders an error state when data loading fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 6, 20));

    renderPage('error');
    await finishLoading();

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load usage');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not load usage data for this subscription.',
    );
    expect(screen.queryByLabelText('Loading usage data')).not.toBeInTheDocument();
  });

  it('defaults the statement range to the current billing period', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2027, 6, 20));

    renderPage('sub-1');
    await finishLoading();

    expect(screen.getByLabelText('From')).toHaveValue('2027-07-15');
    expect(screen.getByLabelText('To')).toHaveValue('2027-08-15');
    expect(screen.getByText(/Current billing period: Jul 15 – Aug 15, 2027/)).toBeInTheDocument();
  });
});
