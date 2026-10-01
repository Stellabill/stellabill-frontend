import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InvoicePreviewModal from './InvoicePreviewModal';

// Mock Modal to simplify testing
vi.mock('./common/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean, children: React.ReactNode }) => isOpen ? <div data-testid="modal">{children}</div> : null,
}));

describe('InvoicePreviewModal', () => {
  it('does not render when isOpen is false', () => {
    render(<InvoicePreviewModal isOpen={false} onClose={vi.fn()} invoiceId="INV-001" />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders modal with content when isOpen is true', () => {
    render(<InvoicePreviewModal isOpen={true} onClose={vi.fn()} invoiceId="INV-001" />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Invoice INV-001')).toBeInTheDocument();
    
    // Check initial page
    expect(screen.getByText('Page 1 of 5', { selector: '.text-gray-500' })).toBeInTheDocument();
  });

  it('updates page when thumbnail is clicked', () => {
    render(<InvoicePreviewModal isOpen={true} onClose={vi.fn()} invoiceId="INV-001" />);
    
    // Find thumbnail for page 3 and click it
    const page3Btn = screen.getByRole('tab', { name: 'Page 3 of 5' });
    fireEvent.click(page3Btn);
    
    // Check if main preview updated
    expect(screen.getByText('Page 3 of 5', { selector: '.text-gray-500' })).toBeInTheDocument();
  });
});
