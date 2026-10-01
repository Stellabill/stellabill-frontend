import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PayoutStep from './PayoutStep';

const VALID_ADDRESS = 'G' + 'A'.repeat(55);

describe('PayoutStep', () => {
  it('renders the address field, helper text, and navigation buttons', () => {
    render(<PayoutStep />);

    expect(screen.getByLabelText(/stellar wallet address/i)).toBeInTheDocument();
    expect(screen.getByText(/this address will receive usdc/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it.each([
    ['an empty value', ''],
    ['whitespace only', '   '],
  ])('shows a required error for %s', (_description, address) => {
    render(<PayoutStep />);

    fireEvent.change(screen.getByLabelText(/stellar wallet address/i), {
      target: { value: address },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Stellar wallet address is required.');
    expect(screen.getByLabelText(/stellar wallet address/i)).toHaveAttribute(
      'aria-describedby',
      'stellar-error'
    );
  });

  it.each([
    ['too short', 'G' + 'A'.repeat(54)],
    ['too long', 'G' + 'A'.repeat(56)],
    ['wrong prefix', 'S' + 'A'.repeat(55)],
    ['lowercase characters', 'G' + 'a'.repeat(55)],
    ['a character outside Stellar base32', 'G' + 'A'.repeat(54) + '0'],
  ])('rejects an address that is %s', (_description, address) => {
    const onNext = vi.fn();
    render(<PayoutStep onNext={onNext} />);

    fireEvent.change(screen.getByLabelText(/stellar wallet address/i), {
      target: { value: address },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a valid Stellar address (starts with G, 56 characters).'
    );
    expect(onNext).not.toHaveBeenCalled();
  });

  it('clears the validation error when the address is edited', () => {
    render(<PayoutStep />);
    const addressInput = screen.getByLabelText(/stellar wallet address/i);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(addressInput, { target: { value: VALID_ADDRESS } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(addressInput).not.toHaveClass('onboarding-input--error');
    expect(addressInput).toHaveAttribute('aria-describedby', 'stellar-helper');
  });

  it('trims and submits a valid Stellar address', () => {
    const onNext = vi.fn();
    render(<PayoutStep onNext={onNext} />);

    fireEvent.change(screen.getByLabelText(/stellar wallet address/i), {
      target: { value: '  ' + VALID_ADDRESS + '  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(onNext).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledWith(VALID_ADDRESS);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls the optional Back callback', () => {
    const onBack = vi.fn();
    render(<PayoutStep onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});