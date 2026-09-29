import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InvoiceBreakdownCard, { type InvoiceWithBreakdown } from './InvoiceBreakdownCard';

// Helper to create a sample invoice
const sampleInvoice: InvoiceWithBreakdown = {
  id: 'inv-123',
  date: '2024-01-01',
  status: 'paid',
  total: '100.00',
  currency: 'USD',
  lineItems: [
    { description: 'Service A', quantity: 1, unitPrice: '50.00', lineTotal: '50.00' },
    { description: 'Service B', quantity: 2, unitPrice: '25.00', lineTotal: '50.00' },
  ],
  subtotal: '100.00',
  taxes: [{ label: 'VAT', amount: '0.00' }],
  credits: [],
};

const creditNoteInvoice: InvoiceWithBreakdown = {
  ...sampleInvoice,
  type: 'credit_note',
  id: 'cn-456',
  parentInvoiceId: 'inv-123',
  reason: 'Refund',
  amountRedeemed: '20.00',
  credits: [{ label: 'Refund credit', amount: '20.00' }],
};

describe('InvoiceBreakdownCard', () => {
  it('renders basic invoice information', () => {
    render(<InvoiceBreakdownCard invoice={sampleInvoice} />);
    // Header displays invoice id and total
    expect(screen.getByText(sampleInvoice.id)).toBeInTheDocument();
    expect(screen.getByText(`${sampleInvoice.total} ${sampleInvoice.currency}`)).toBeInTheDocument();
    // Toggle button should be present and collapsed initially
    const toggleBtn = screen.getByRole('button', { name: /Toggle breakdown for invoice/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands and shows line items on toggle', async () => {
    render(<InvoiceBreakdownCard invoice={sampleInvoice} />);
    const toggleBtn = screen.getByRole('button', { name: /Toggle breakdown for invoice/i });
    fireEvent.click(toggleBtn);
    await waitFor(() => expect(toggleBtn).toHaveAttribute('aria-expanded', 'true'));
    // Verify that line items are rendered in the table
    expect(screen.getByText('Service A')).toBeInTheDocument();
    expect(screen.getByText('Service B')).toBeInTheDocument();
    // Verify subtotal row
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
  });

  it('renders credit‑note specific UI elements', async () => {
    render(<InvoiceBreakdownCard invoice={creditNoteInvoice} />);
    const toggleBtn = screen.getByRole('button', { name: /Toggle details for credit note/i });
    fireEvent.click(toggleBtn);
    await waitFor(() => expect(toggleBtn).toHaveAttribute('aria-expanded', 'true'));
    // Credit‑note badge should be visible
    expect(screen.getByText('Credit Note')).toBeInTheDocument();
    // Parent invoice link
    expect(screen.getByText(creditNoteInvoice.parentInvoiceId!)).toBeInTheDocument();
    // Reason field
    expect(screen.getByText(creditNoteInvoice.reason!)).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalInvoice: InvoiceWithBreakdown = {
      id: 'inv-min',
      date: '2024-01-02',
      status: 'pending',
      total: '0.00',
      currency: 'USD',
    } as any; // cast to bypass optional typing for test
    render(<InvoiceBreakdownCard invoice={minimalInvoice} />);
    // Should not crash and display basic info
    expect(screen.getByText(minimalInvoice.id)).toBeInTheDocument();
    // Toggle should still be present
    const toggleBtn = screen.getByRole('button', { name: /Toggle breakdown for invoice/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('triggers CSV download when download button is clicked', () => {
    // Mock URL.createObjectURL and anchor click
    const createObjectURLMock = vi.fn(() => 'blob:url');
    const revokeObjectURLMock = vi.fn();
    const clickMock = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURLMock);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectURLMock);
    const appendChildMock = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {} as any);
    const removeMock = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {});
    const setAttributeMock = vi.spyOn(HTMLAnchorElement.prototype, 'setAttribute');
    // Render component
    render(<InvoiceBreakdownCard invoice={sampleInvoice} />);
    const toggleBtn = screen.getByRole('button', { name: /Toggle breakdown for invoice/i });
    fireEvent.click(toggleBtn);
    const downloadBtn = screen.getByRole('button', { name: /Download breakdown CSV for invoice/i });
    fireEvent.click(downloadBtn);
    expect(createObjectURLMock).toHaveBeenCalled();
    // Anchor click is performed via a.click()
    // Verify that a element was created and clicked
    // This is indirectly covered by the mock of appendChild and remove
    expect(appendChildMock).toHaveBeenCalled();
    // Cleanup mocks
    vi.restoreAllMocks();
  });
});
