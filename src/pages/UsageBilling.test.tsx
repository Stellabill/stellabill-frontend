import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UsageBilling, {
  buildUsageCsv,
  escapeCsvCell,
  USAGE_LINE_ITEMS,
  type UsageLineItem,
} from './UsageBilling';

function renderUsageBilling(initialPath = '/subscriptions/sub-123/usage') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/subscriptions/:id/usage" element={<UsageBilling />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CSV escaping helpers', () => {
  it('leaves plain values unquoted', () => {
    expect(escapeCsvCell('2026-03-01')).toBe('2026-03-01');
    expect(escapeCsvCell(1250)).toBe('1250');
  });

  it('wraps values containing commas in double quotes', () => {
    expect(escapeCsvCell('API calls, metered')).toBe('"API calls, metered"');
  });

  it('escapes internal double quotes by doubling them', () => {
    expect(escapeCsvCell('API "v2" calls')).toBe('"API ""v2"" calls"');
  });

  it('escapes values with both commas and quotes and newlines', () => {
    expect(escapeCsvCell('Line 1, "quoted"\nLine 2')).toBe('"Line 1, ""quoted""\nLine 2"');
  });

  it('builds a valid RFC 4180 CSV from usage line items', () => {
    const items: UsageLineItem[] = [
      {
        id: 'u-1',
        date: '2026-03-07',
        description: 'API calls — "v2/billing, metered" batch',
        quantity: 1200,
        unit: 'API calls',
        unitPrice: 0.0005,
        amount: 0.6,
        currency: 'USDC',
      },
    ];
    const csv = buildUsageCsv(items);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Date,Description,Quantity,Unit,Unit Price,Amount,Currency');
    expect(lines[1]).toBe(
      '2026-03-07,"API calls — ""v2/billing, metered"" batch",1200,API calls,0.0005,0.60,USDC',
    );
  });
});

describe('UsageBilling page', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('renders default 30D range with totals and usage-over-time chart', () => {
    renderUsageBilling();

    expect(screen.getByRole('heading', { name: /Usage & Billing/i })).toBeInTheDocument();
    expect(screen.getByText(/Current billing period: Mar 1 – Mar 31, 2026/i)).toBeInTheDocument();

    const btn30D = screen.getByRole('button', { name: '30D' });
    expect(btn30D).toHaveAttribute('aria-pressed', 'true');

    // Sparkline chart is rendered with accessible aria-label
    const chart = screen.getByRole('img', { name: /Usage over time chart for Mar 1 – Mar 31, 2026/i });
    expect(chart).toBeInTheDocument();
  });

  it('updates chart and totals when switching range presets (7D and 90D)', async () => {
    const user = userEvent.setup();
    renderUsageBilling();

    const items30D = USAGE_LINE_ITEMS.filter((i) => i.date >= '2026-03-01' && i.date <= '2026-03-31');
    const total30D = items30D.reduce((s, i) => s + i.quantity, 0).toLocaleString();
    expect(screen.getByText(total30D)).toBeInTheDocument();

    // Switch to 7D
    await user.click(screen.getByRole('button', { name: '7D' }));
    expect(screen.getByRole('button', { name: '7D' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Current billing period: Mar 25 – Mar 31, 2026/i)).toBeInTheDocument();

    const items7D = USAGE_LINE_ITEMS.filter((i) => i.date >= '2026-03-25' && i.date <= '2026-03-31');
    const total7D = items7D.reduce((s, i) => s + i.quantity, 0).toLocaleString();
    expect(screen.getByText(total7D)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Usage over time chart for Mar 25 – Mar 31, 2026/i }),
    ).toBeInTheDocument();

    // Switch to 90D
    await user.click(screen.getByRole('button', { name: '90D' }));
    expect(screen.getByRole('button', { name: '90D' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Current billing period: Jan 1 – Mar 31, 2026/i)).toBeInTheDocument();

    const items90D = USAGE_LINE_ITEMS;
    const total90D = items90D.reduce((s, i) => s + i.quantity, 0).toLocaleString();
    expect(screen.getByText(total90D)).toBeInTheDocument();
  });

  it('supports custom date range selection via DatePickerCalendar', async () => {
    const user = userEvent.setup();
    renderUsageBilling();

    await user.click(screen.getByRole('button', { name: /Custom/i }));
    const pickerRegion = screen.getByRole('region', { name: /Custom date range picker/i });
    expect(pickerRegion).toBeInTheDocument();

    // Select March 10, 2026 as start date
    const mar10Btn = within(pickerRegion).getByRole('button', { name: /March 10, 2026/i });
    await user.click(mar10Btn);

    // After selecting start date, calendar switches to End date; select March 15, 2026
    const mar15Btn = within(pickerRegion).getByRole('button', { name: /March 15, 2026/i });
    await user.click(mar15Btn);

    expect(screen.getByText(/Current billing period: Mar 10 – Mar 15, 2026/i)).toBeInTheDocument();
    const customItems = USAGE_LINE_ITEMS.filter((i) => i.date >= '2026-03-10' && i.date <= '2026-03-15');
    const customTotal = customItems.reduce((s, i) => s + i.quantity, 0).toLocaleString();
    expect(screen.getByText(customTotal)).toBeInTheDocument();
  });

  it('toggles between chart view and accessible table fallback', async () => {
    const user = userEvent.setup();
    renderUsageBilling();

    // Switch to 7D for a compact row count check
    await user.click(screen.getByRole('button', { name: '7D' }));
    await user.click(screen.getByRole('button', { name: /Table/i }));

    const tableRegion = screen.getByRole('region', { name: /Usage line items table/i });
    const table = within(tableRegion).getByRole('table');
    expect(table).toBeInTheDocument();

    const rows = within(table).getAllByRole('row');
    // 1 header row + 7 data rows
    expect(rows).toHaveLength(8);
    expect(within(table).getByText('2026-03-25')).toBeInTheDocument();
    expect(within(table).getByText('2026-03-31')).toBeInTheDocument();
  });

  it('exports filtered usage line items as RFC 4180 CSV with commas and quotes escaped', async () => {
    const user = userEvent.setup();
    let capturedBlob: Blob | null = null;
    URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
      capturedBlob = blob as Blob;
      return 'blob:mock-usage-csv';
    });
    URL.revokeObjectURL = vi.fn();

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderUsageBilling();
    await user.click(screen.getByRole('button', { name: /Export CSV/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-usage-csv');
    expect(capturedBlob).not.toBeNull();

    const csvText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(capturedBlob as Blob);
    });

    const lines = csvText.split('\n');
    expect(lines[0]).toBe('Date,Description,Quantity,Unit,Unit Price,Amount,Currency');
    // 1 header + 31 days in March
    expect(lines).toHaveLength(32);
    // March 7 has a description with quotes and a comma — verify RFC 4180 escaping
    const mar7Row = lines.find((line) => line.startsWith('2026-03-07,'));
    expect(mar7Row).toContain('"API calls — ""v2/billing, metered"" batch"');
  });
});
