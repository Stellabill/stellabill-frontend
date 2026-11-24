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
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UsageBilling, { type UsageData } from './UsageBilling';
vi.mock('../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
vi.mock('../hooks/useScopedTheme', () => ({
  useScopedTheme: () => ({ current: null }),
  PastPeriods: () => <div>Past periods</div>,
  default: () => <div>Receipt preview</div>,
  default: () => <div>Invoices</div>,
  default: () => null,
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
    <MemoryRouter initialEntries={['/subscriptions/sub-123/usage']}>
        <Route
          path="/subscriptions/:id/usage"
          element={<UsageBilling usageData={data} />}
        />
  it('renders the empty usage state when usageCount is zero', () => {
    renderPage({ ...populatedData, usageCount: 0 });
    expect(screen.getByRole('heading', { name: 'No usage yet' })).toBeInTheDocument();
    expect(screen.getByText(/No API calls recorded/i)).toBeInTheDocument();
  it('renders entries with running balances and an opening balance', () => {
    renderPage();
    const statement = screen.getByRole('region', { name: 'Statement entries' });
    expect(within(statement).getByText('Opening balance')).toBeInTheDocument();
    expect(within(statement).getAllByText('0.00 USDC').length).toBeGreaterThan(0);
    expect(within(statement).getByText('Invoice INV-00123456785')).toBeInTheDocument();
    expect(within(statement).getByText('15.20 USDC')).toBeInTheDocument();
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
  it('toggles sort and reverses statement row order', async () => {
    const user = userEvent.setup();
    renderPage();
    const table = screen.getByRole('table');
    const dataRows = () => within(table).getAllByRole('row').slice(2);
    expect(dataRows()[0]).toHaveTextContent('2026-01-15');
    await user.click(screen.getByRole('button', { name: 'Sort descending' }));
    expect(screen.getByRole('button', { name: 'Sort ascending' })).toBeInTheDocument();
    expect(dataRows()[0]).toHaveTextContent('2026-04-15');
  it('renders zero and negative amounts with the currency', () => {
    renderPage();
    const statement = screen.getByRole('region', { name: 'Statement entries' });
    expect(within(statement).getAllByText('0.00 USDC').length).toBeGreaterThan(0);
    expect(within(statement).getByText('-15.20 USDC')).toBeInTheDocument();
  it('links back to the subscription detail route', () => {
    renderPage({ ...populatedData, usageCount: 0 });
    const backLink = screen.getByRole('link', { name: 'Back to subscription' });
    expect(backLink).toHaveAttribute('href', '/subscriptions/sub-123');
