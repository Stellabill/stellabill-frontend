import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import UsageBilling, { type UsageData } from './UsageBilling';

vi.mock('../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

vi.mock('../hooks/useScopedTheme', () => ({
  useScopedTheme: () => ({ current: null }),
}));

vi.mock('../components/past-periods/past-periods', () => ({
  PastPeriods: () => <div>Past periods</div>,
}));

vi.mock('../components/past-periods/ReceiptPreview', () => ({
  default: () => <div>Receipt preview</div>,
}));

vi.mock('../components/InvoiceList', () => ({
  default: () => <div>Invoices</div>,
}));

vi.mock('../components/PlanRecommendationBanner', () => ({
  default: () => null,
}));

const populatedData: UsageData = {
  planName: 'Developer Pro',
  billingPeriod: 'Mar 1 - Mar 31, 2026',
  usageCount: 32450,
  usageLimit: 50000,
  unit: 'API calls',
  amount: '16.23',
  currency: 'USDC',
};

function renderPage(data: UsageData | null = populatedData) {
  return render(
    <MemoryRouter initialEntries={['/subscriptions/sub-123/usage']}>
      <Routes>
        <Route
          path="/subscriptions/:id/usage"
          element={<UsageBilling usageData={data} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UsageBilling', () => {
  it('renders the empty usage state when usageCount is zero', () => {
    renderPage({ ...populatedData, usageCount: 0 });

    expect(screen.getByRole('heading', { name: 'No usage yet' })).toBeInTheDocument();
    expect(screen.getByText(/No API calls recorded/i)).toBeInTheDocument();
  });

  it('renders entries with running balances and an opening balance', () => {
    renderPage();

    const statement = screen.getByRole('region', { name: 'Statement entries' });
    expect(within(statement).getByText('Opening balance')).toBeInTheDocument();
    expect(within(statement).getAllByText('0.00 USDC').length).toBeGreaterThan(0);
    expect(within(statement).getByText('Invoice INV-00123456785')).toBeInTheDocument();
    expect(within(statement).getByText('15.20 USDC')).toBeInTheDocument();
  });

  it('filters statement rows and totals when the date range changes', async () => {
    const user = userEvent.setup();
    renderPage();

    const start = screen.getByLabelText('From');
    const end = screen.getByLabelText('To');
    await user.clear(start);
    await user.type(start, '2026-02-01');
    await user.clear(end);
    await user.type(end, '2026-02-28');

    const statement = screen.getByRole('region', { name: 'Statement entries' });
    expect(within(statement).queryByText('Invoice INV-00123456785')).not.toBeInTheDocument();
    expect(within(statement).getByText('Prepaid top-up')).toBeInTheDocument();
    expect(within(statement).getByText('Invoice INV-00123456790')).toBeInTheDocument();
    expect(within(statement).queryByText('Invoice INV-00123456789')).not.toBeInTheDocument();
    expect(within(statement).getAllByText('0.00 USDC').length).toBeGreaterThan(0);
    expect(within(statement).getAllByText(/-50\.00\s+USDC/).length).toBeGreaterThan(0);
  });

  it('toggles sort and reverses statement row order', async () => {
    const user = userEvent.setup();
    renderPage();

    const table = screen.getByRole('table');
    const dataRows = () => within(table).getAllByRole('row').slice(2);
    expect(dataRows()[0]).toHaveTextContent('2026-01-15');

    await user.click(screen.getByRole('button', { name: 'Sort descending' }));

    expect(screen.getByRole('button', { name: 'Sort ascending' })).toBeInTheDocument();
    expect(dataRows()[0]).toHaveTextContent('2026-04-15');
  });

  it('renders zero and negative amounts with the currency', () => {
    renderPage();

    const statement = screen.getByRole('region', { name: 'Statement entries' });
    expect(within(statement).getAllByText('0.00 USDC').length).toBeGreaterThan(0);
    expect(within(statement).getByText('-15.20 USDC')).toBeInTheDocument();
  });

  it('links back to the subscription detail route', () => {
    renderPage({ ...populatedData, usageCount: 0 });

    const backLink = screen.getByRole('link', { name: 'Back to subscription' });
    expect(backLink).toHaveAttribute('href', '/subscriptions/sub-123');
  });
});
