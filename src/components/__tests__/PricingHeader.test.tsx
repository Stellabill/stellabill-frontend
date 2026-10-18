import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PricingHeader from '../PricingHeader';

describe('PricingHeader component', () => {
  test('renders heading and subtext', () => {
    render(<PricingHeader />);
    expect(screen.getByRole('heading', { name: /simple, transparent pricing/i })).toBeInTheDocument();
    expect(screen.getByText(/USDC-based plans with no hidden fees/i)).toBeInTheDocument();
  });

  test('default selected segment is merchants', () => {
    render(<PricingHeader />);
    const merchantsBtn = screen.getByRole('button', { name: /for merchants/i });
    const subscribersBtn = screen.getByRole('button', { name: /for subscribers/i });
    expect(merchantsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(subscribersBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking subscribers toggles selection and calls onToggleChange', () => {
    const handleToggle = jest.fn();
    render(<PricingHeader onToggleChange={handleToggle} />);
    const subscribersBtn = screen.getByRole('button', { name: /for subscribers/i });
    fireEvent.click(subscribersBtn);
    expect(subscribersBtn).toHaveAttribute('aria-pressed', 'true');
    expect(handleToggle).toHaveBeenCalledWith('subscribers');
  });

  test('keyboard Enter key triggers toggle', () => {
    const handleToggle = jest.fn();
    render(<PricingHeader onToggleChange={handleToggle} />);
    const merchantsBtn = screen.getByRole('button', { name: /for merchants/i });
    fireEvent.keyDown(merchantsBtn, { key: 'Enter' });
    expect(handleToggle).toHaveBeenCalledWith('merchants');
  });

  test('keyboard Space key triggers toggle', () => {
    const handleToggle = jest.fn();
    render(<PricingHeader onToggleChange={handleToggle} />);
    const subscribersBtn = screen.getByRole('button', { name: /for subscribers/i });
    fireEvent.keyDown(subscribersBtn, { key: ' ' });
    expect(handleToggle).toHaveBeenCalledWith('subscribers');
  });
});
