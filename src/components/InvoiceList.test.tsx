import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InvoiceList, { Invoice } from './InvoiceList';

const mockInvoices: Invoice[] = [
  {
    id: 'INV-123',
    type: 'invoice',
    date: 'Jan 1, 2026',
    status: 'paid',
    total: '100.00',
    currency: 'USD',
  },
  {
    id: 'CN-123',
    type: 'credit_note',
    date: 'Jan 2, 2026',
    status: 'adjusted',
    total: '50.00',
    currency: 'USD',
    parentInvoiceId: 'INV-123',
    reason: 'Overcharged',
    amountRedeemed: '25.00',
  },
  {
    id: 'CN-999',
    type: 'credit_note',
    date: 'Jan 3, 2026',
    status: 'refunded',
    total: '10.00',
    currency: 'USD',
  }
];

describe('InvoiceList', () => {
  it('renders invoices and credit notes correctly', () => {
    render(<InvoiceList invoices={mockInvoices} />);
    
    // Check that IDs are rendered
    expect(screen.getAllByText('INV-123').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CN-123').length).toBeGreaterThan(0);

    // Check that Credit Note badge is rendered (mobile and desktop)
    const badges = screen.getAllByText('Credit Note');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('can expand credit note details', () => {
    render(<InvoiceList invoices={mockInvoices} />);
    
    // By default, details are hidden
    expect(screen.queryByText('Overcharged')).toBeNull();

    // Find the toggle button for desktop (we might have multiple toggle buttons due to desktop/mobile views)
    const toggleButtons = screen.getAllByRole('button', { name: /Toggle details for credit note CN-123/i });
    if (toggleButtons.length > 0) {
      fireEvent.click(toggleButtons[0]);
    }
    
    // Now reason should be visible
    expect(screen.getAllByText('Overcharged').length).toBeGreaterThan(0);
    expect(screen.getAllByText('INV-123', { selector: 'a' }).length).toBeGreaterThan(0);
  });

  it('handles orphan credit notes', () => {
    render(<InvoiceList invoices={mockInvoices} />);
    
    const toggleButtons = screen.getAllByRole('button', { name: /Toggle details for credit note CN-999/i });
    if (toggleButtons.length > 0) {
      fireEvent.click(toggleButtons[0]);
    }

    expect(screen.getAllByText(/No parent invoice linked/i).length).toBeGreaterThan(0);
  });

  it('renders reissue button for credit notes', () => {
    render(<InvoiceList invoices={mockInvoices} />);
    
    const reissueButtons = screen.getAllByRole('button', { name: /Reissue credit note CN-123/i });
    expect(reissueButtons.length).toBeGreaterThan(0);
  });
});
