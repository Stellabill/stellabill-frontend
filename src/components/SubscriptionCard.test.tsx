import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SubscriptionCard, { SubscriptionData } from './SubscriptionCard';

const mockSubscription: SubscriptionData = {
  id: 'sub_123',
  planName: 'Pro Plan',
  merchant: 'Acme Corp',
  status: 'active',
  price: 29.99,
  currency: 'USD',
  interval: 'month',
  prepaidBalance: 0,
  coverage: 0,
  nextChargeDate: '2026-08-01',
  icon: '🚀',
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('SubscriptionCard', () => {
  it('renders basic subscription information', () => {
    renderWithRouter(<SubscriptionCard subscription={mockSubscription} />);
    
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText(/29.99/)).toBeInTheDocument();
    expect(screen.getByText(/month/)).toBeInTheDocument();
    expect(screen.getByText(/sub_123/)).toBeInTheDocument();
  });

  it('renders quiet period badge when isQuietPeriod is true', () => {
    renderWithRouter(
      <SubscriptionCard
        subscription={{ ...mockSubscription, status: 'paused', isQuietPeriod: true }}
      />
    );
    
    const quietBadge = screen.getByRole('status', { name: /Quiet period until/i });
    expect(quietBadge).toBeInTheDocument();
    expect(quietBadge).toHaveAttribute('title', 'Quiet period: Subscription will pause and no charges will apply after 2026-08-01');
    expect(screen.getByText('Quiet period')).toBeInTheDocument();
  });

  it('does not render quiet period badge when isQuietPeriod is false', () => {
    renderWithRouter(
      <SubscriptionCard
        subscription={{ ...mockSubscription, status: 'active', isQuietPeriod: false }}
      />
    );
    
    expect(screen.queryByRole('status', { name: /Quiet period until/i })).not.toBeInTheDocument();
  });

  it('opens popover on click and recalculates position', async () => {
    // Mock window.matchMedia for hover capability check
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    renderWithRouter(<SubscriptionCard subscription={mockSubscription} />);
    
    const card = screen.getByRole('article');
    fireEvent.click(card);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Test Escape key closes popover
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
  
  it('opens popover with Enter key', async () => {
    renderWithRouter(<SubscriptionCard subscription={mockSubscription} />);
    
    const card = screen.getByRole('article');
    fireEvent.keyDown(card, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
