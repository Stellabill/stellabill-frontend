import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import InvoicePreviewModal, { paginateLineItems } from './InvoicePreviewModal';
import type { InvoiceWithBreakdown } from './InvoiceBreakdownCard';

// Mock Modal to expose the real ARIA attributes while isolating rendering complexity
vi.mock('./common/Modal', () => ({
  Modal: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div
        data-testid="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

// ------------------------------------------------------------------
// Shared defaults
// ------------------------------------------------------------------
const DEFAULT_PROPS = {
  isOpen: true,
  onClose: vi.fn(),
  invoiceId: 'INV-001',
} as const;

const SAMPLE_INVOICE: InvoiceWithBreakdown = {
  id: 'INV-001',
  date: '2026-04-01',
  status: 'paid',
  subtotal: '100.00',
  total: '110.00',
  currency: 'USDC',
  taxes: [{ label: 'VAT (10%)', amount: '10.00' }],
  lineItems: Array.from({ length: 10 }, (_, idx) => ({
    description: `Line item ${idx + 1}`,
    quantity: 1,
    unitPrice: '10.00',
    lineTotal: '10.00',
  })),
};

function renderModal(
  overrides: Partial<{
    isOpen: boolean;
    onClose: () => void;
    invoiceId: string | null;
    invoice?: InvoiceWithBreakdown | null;
    itemsPerPage?: number;
  }> = {},
) {
  const props = { ...DEFAULT_PROPS, ...overrides, onClose: overrides.onClose ?? vi.fn() };
  return { ...render(<InvoicePreviewModal {...props} />), onClose: props.onClose };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ------------------------------------------------------------------
// Failure / early-return paths (regression for #780)
// ------------------------------------------------------------------
describe('InvoicePreviewModal — failure / early-return paths', () => {
  it('returns null when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('returns null when invoiceId is null', () => {
    // TypeScript: cast to satisfy the prop type; we are testing the runtime guard
    renderModal({ invoiceId: null as unknown as string });
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('returns null when invoiceId is an empty string', () => {
    renderModal({ invoiceId: '' });
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('returns null when both isOpen is false and invoiceId is null', () => {
    renderModal({ isOpen: false, invoiceId: null as unknown as string });
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });
});

// ------------------------------------------------------------------
// Normal render path
// ------------------------------------------------------------------
describe('InvoicePreviewModal — normal render path', () => {
  it('renders the modal when isOpen is true and invoiceId is provided', () => {
    renderModal();
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('passes the correct title containing the invoiceId to Modal', () => {
    renderModal({ invoiceId: 'INV-42' });
    expect(screen.getByRole('heading', { name: /preview invoice INV-42/i })).toBeInTheDocument();
  });

  it('renders the invoice id inside the PDF preview area', () => {
    renderModal({ invoiceId: 'INV-001' });
    // The component renders "Invoice {invoiceId}" inside the mock page content
    expect(screen.getByText('Invoice INV-001')).toBeInTheDocument();
  });

  it('renders 1 page by default when no line items are provided', () => {
    renderModal();
    expect(
      screen.getByText('Page 1 of 1', { selector: '.text-gray-500' })
    ).toBeInTheDocument();
  });

  it('renders the PdfThumbnailNavigator with 1 page tab when there are no line items', () => {
    renderModal();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(1);
  });

  it('wraps the preview content in InvoicePrintRoot', () => {
    const { container } = renderModal({ invoice: SAMPLE_INVOICE });
    expect(container.querySelector('.invoice-print-root')).toBeInTheDocument();
  });
});

// ------------------------------------------------------------------
// Boundary inputs
// ------------------------------------------------------------------
describe('InvoicePreviewModal — boundary inputs', () => {
  it('renders correctly with a single-character invoiceId', () => {
    renderModal({ invoiceId: 'X' });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Invoice X')).toBeInTheDocument();
  });

  it('renders correctly with a long invoiceId string', () => {
    const longId = 'A'.repeat(128);
    renderModal({ invoiceId: longId });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Invoice ' + longId)).toBeInTheDocument();
  });

  it('renders correctly with special characters in invoiceId', () => {
    renderModal({ invoiceId: 'INV/2026-001 & <test>' });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('renders correctly with a numeric-looking invoiceId', () => {
    renderModal({ invoiceId: '0' }); // truthy: non-empty string
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Invoice 0')).toBeInTheDocument();
  });
});

// ------------------------------------------------------------------
// onClose callback contract
// ------------------------------------------------------------------
describe('InvoicePreviewModal — onClose contract', () => {
  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on initial render', () => {
    const { onClose } = renderModal();
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------
// Page navigation & content-based pagination
// ------------------------------------------------------------------
describe('InvoicePreviewModal — page navigation', () => {
  it('paginates line items by content instead of a fixed page count', () => {
    expect(paginateLineItems([], 4)).toHaveLength(1);
    expect(paginateLineItems(SAMPLE_INVOICE.lineItems, 4)).toHaveLength(3);
    expect(paginateLineItems(SAMPLE_INVOICE.lineItems, 8)).toHaveLength(2);
  });

  it('navigates to a different page when a thumbnail tab is clicked', () => {
    renderModal({ invoice: SAMPLE_INVOICE, itemsPerPage: 4 });

    const page2Btn = screen.getByRole('tab', { name: 'Page 2 of 3' });
    fireEvent.click(page2Btn);

    expect(
      screen.getByText('Page 2 of 3', { selector: '.text-gray-500' })
    ).toBeInTheDocument();
    expect(screen.getByText('Line item 5')).toBeVisible();
  });

  it('navigates to the last page (boundary) and displays totals', () => {
    renderModal({ invoice: SAMPLE_INVOICE, itemsPerPage: 4 });

    const page3Btn = screen.getByRole('tab', { name: 'Page 3 of 3' });
    fireEvent.click(page3Btn);

    expect(
      screen.getByText('Page 3 of 3', { selector: '.text-gray-500' })
    ).toBeInTheDocument();
    expect(screen.getByText('Line item 10')).toBeVisible();
    expect(screen.getByText('VAT (10%)')).toBeInTheDocument();
  });

  it('navigates back to page 1 after switching pages', () => {
    renderModal({ invoice: SAMPLE_INVOICE, itemsPerPage: 4 });

    fireEvent.click(screen.getByRole('tab', { name: 'Page 3 of 3' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Page 1 of 3' }));

    expect(
      screen.getByText('Page 1 of 3', { selector: '.text-gray-500' })
    ).toBeInTheDocument();
  });
});

// ------------------------------------------------------------------
// Print / PDF & CSV download handlers
// ------------------------------------------------------------------
describe('InvoicePreviewModal — download handlers', () => {
  it('calls window.print() when Download PDF / Print is clicked', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    renderModal({ invoice: SAMPLE_INVOICE });
    await user.click(screen.getByRole('button', { name: /Download PDF \/ Print/i }));

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('updates paper size class on InvoicePrintRoot when switching to Letter', async () => {
    const user = userEvent.setup();
    const { container } = renderModal({ invoice: SAMPLE_INVOICE });

    await user.selectOptions(screen.getByLabelText(/Paper:/i), 'letter');

    expect(container.querySelector('.invoice-print-root')).toHaveClass('invoice-print-letter');
  });

  it('exports invoice CSV via statement helpers when Download CSV is clicked', async () => {
    const user = userEvent.setup();
    const createObjectURLMock = vi.fn(() => 'blob:mock-csv');
    const revokeObjectURLMock = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURLMock,
    });

    renderModal({ invoice: SAMPLE_INVOICE });
    await user.click(screen.getByRole('button', { name: /Download CSV/i }));

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-csv');
  });
});

// ------------------------------------------------------------------
// Accessibility
// ------------------------------------------------------------------
describe('InvoicePreviewModal — accessibility', () => {
  it('renders a dialog with role="dialog"', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true" on the dialog', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('labels the dialog with the invoice title', () => {
    renderModal({ invoiceId: 'INV-007' });
    expect(
      screen.getByRole('dialog', { name: /preview invoice INV-007/i })
    ).toBeInTheDocument();
  });

  it('thumbnail tabs have descriptive aria-labels', () => {
    renderModal({ invoice: SAMPLE_INVOICE, itemsPerPage: 4 });
    const expectedLabels = [
      'Page 1 of 3',
      'Page 2 of 3',
      'Page 3 of 3',
    ];
    expectedLabels.forEach((label) => {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
    });
  });

  it('marks the current page tab as aria-selected', () => {
    renderModal({ invoice: SAMPLE_INVOICE, itemsPerPage: 4 });
    const page1Tab = screen.getByRole('tab', { name: 'Page 1 of 3' });
    expect(page1Tab).toHaveAttribute('aria-selected', 'true');
  });

  it('updates aria-selected when navigating pages', () => {
    renderModal({ invoice: SAMPLE_INVOICE, itemsPerPage: 4 });
    const page2Tab = screen.getByRole('tab', { name: 'Page 2 of 3' });
    fireEvent.click(page2Tab);

    expect(page2Tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Page 1 of 3' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });
});
