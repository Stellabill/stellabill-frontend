import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InvoiceBreakdownCard from '../InvoiceBreakdownCard';
import type { InvoiceWithBreakdown } from '../InvoiceBreakdownCard';

const mockInvoice: InvoiceWithBreakdown = {
  id: "INV-00123456789",
  date: "Mar 31, 2026",
  status: "paid",
  total: "16.23",
  currency: "USDC",
  lineItems: [
    { description: "API usage for Mar 2026", quantity: 30460, unitPrice: "0.0005", lineTotal: "15.20" },
    { description: "Usage adjustment / rounding", quantity: 1, unitPrice: "1.03", lineTotal: "1.03" },
  ],
  subtotal: "16.23",
  taxes: [
    { label: "Network / protocol fee", amount: "0.00" },
  ],
};

const mockInvoiceWithCredits: InvoiceWithBreakdown = {
  ...mockInvoice,
  id: "INV-00123456790",
  credits: [
    { label: "Referral credit", amount: "2.00" },
  ],
};

const mockInvoiceSingleItem: InvoiceWithBreakdown = {
  ...mockInvoice,
  id: "INV-00123456791",
  lineItems: [
    { description: "Single service fee", quantity: 1, unitPrice: "10.00", lineTotal: "10.00" },
  ],
  total: "10.00",
  subtotal: "10.00",
  taxes: [],
};

describe('InvoiceBreakdownCard', () => {
  it('renders invoice id and total in collapsed state', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    expect(screen.getByText(mockInvoice.id)).toBeInTheDocument();
    expect(screen.getByText(`${mockInvoice.total} ${mockInvoice.currency}`)).toBeInTheDocument();
    expect(screen.getByText(mockInvoice.status)).toBeInTheDocument();
    expect(screen.getByText(mockInvoice.date)).toBeInTheDocument();
  });

  it('expands and shows line items when toggle is clicked', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456789/i });
    fireEvent.click(toggle);

    expect(screen.getByText(mockInvoice.lineItems[0].description)).toBeInTheDocument();
    expect(screen.getByText(mockInvoice.lineItems[1].description)).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getAllByText(`16.23 USDC`).length).toBeGreaterThanOrEqual(1);
  });

  it('collapses when toggle is clicked twice', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456789/i });
    fireEvent.click(toggle);
    expect(screen.getByText(mockInvoice.lineItems[0].description)).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText(mockInvoice.lineItems[0].description)).not.toBeInTheDocument();
  });

  it('has correct aria-expanded attribute', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456789/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders taxes when present', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456789/i });
    fireEvent.click(toggle);

    expect(screen.getByText("Network / protocol fee")).toBeInTheDocument();
  });

  it('renders credits when present', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoiceWithCredits} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456790/i });
    fireEvent.click(toggle);

    expect(screen.getByText("Referral credit")).toBeInTheDocument();
  });

  it('renders download button in expanded state', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456789/i });
    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: /download breakdown csv for invoice inv-00123456789/i })).toBeInTheDocument();
  });

  it('handles single line item gracefully', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoiceSingleItem} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456791/i });
    fireEvent.click(toggle);

    expect(screen.getByText("Single service fee")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
  });

  it('handles keyboard Enter to expand', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456789/i });
    fireEvent.keyDown(toggle, { key: 'Enter' });

    expect(screen.getByText(mockInvoice.lineItems[0].description)).toBeInTheDocument();
  });

  it('handles keyboard Space to expand', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456789/i });
    fireEvent.keyDown(toggle, { key: ' ' });

    expect(screen.getByText(mockInvoice.lineItems[0].description)).toBeInTheDocument();
  });

  it('displays line item quantities', () => {
    render(<InvoiceBreakdownCard invoice={mockInvoice} />);

    const toggle = screen.getByRole('button', { name: /toggle breakdown for invoice inv-00123456789/i });
    fireEvent.click(toggle);

    expect(screen.getByText("30460")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
