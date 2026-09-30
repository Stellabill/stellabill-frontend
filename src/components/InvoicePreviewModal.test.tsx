import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import InvoicePreviewModal from './InvoicePreviewModal';

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

function renderModal(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  const props = { ...DEFAULT_PROPS, ...overrides, onClose: overrides.onClose ?? vi.fn() };
  return { ...render(<InvoicePreviewModal {...props} />), onClose: props.onClose };
}

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

  it('starts on page 1 of 5', () => {
    renderModal();
    expect(
      screen.getByText('Page 1 of 5', { selector: '.text-gray-500' })
    ).toBeInTheDocument();
  });

  it('renders the PdfThumbnailNavigator with 5 page tabs', () => {
    renderModal();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
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
// Page navigation
// ------------------------------------------------------------------
describe('InvoicePreviewModal — page navigation', () => {
  it('navigates to a different page when a thumbnail tab is clicked', () => {
    renderModal();

    const page3Btn = screen.getByRole('tab', { name: 'Page 3 of 5' });
    fireEvent.click(page3Btn);

    expect(
      screen.getByText('Page 3 of 5', { selector: '.text-gray-500' })
    ).toBeInTheDocument();
  });

  it('navigates to the last page (boundary)', () => {
    renderModal();

    const page5Btn = screen.getByRole('tab', { name: 'Page 5 of 5' });
    fireEvent.click(page5Btn);

    expect(
      screen.getByText('Page 5 of 5', { selector: '.text-gray-500' })
    ).toBeInTheDocument();
  });

  it('navigates back to page 1 after switching pages', () => {
    renderModal();

    fireEvent.click(screen.getByRole('tab', { name: 'Page 4 of 5' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Page 1 of 5' }));

    expect(
      screen.getByText('Page 1 of 5', { selector: '.text-gray-500' })
    ).toBeInTheDocument();
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
    renderModal();
    // PdfThumbnailNavigator produces aria-label="Page N of 5" on each tab
    const expectedLabels = [
      'Page 1 of 5',
      'Page 2 of 5',
      'Page 3 of 5',
      'Page 4 of 5',
      'Page 5 of 5',
    ];
    expectedLabels.forEach((label) => {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
    });
  });

  it('marks the current page tab as aria-selected', () => {
    renderModal();
    const page1Tab = screen.getByRole('tab', { name: 'Page 1 of 5' });
    expect(page1Tab).toHaveAttribute('aria-selected', 'true');
  });

  it('updates aria-selected when navigating pages', () => {
    renderModal();
    const page2Tab = screen.getByRole('tab', { name: 'Page 2 of 5' });
    fireEvent.click(page2Tab);

    expect(page2Tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Page 1 of 5' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });
});
