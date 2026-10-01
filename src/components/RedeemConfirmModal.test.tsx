import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RedeemConfirmModal from './RedeemConfirmModal';

/**
 * Regression suite for `RedeemConfirmModal` (issue #820). The evidence branch is
 * the `if (!isOpen) return null;` guard; the surrounding failure paths are the
 * disabled-while-redeeming controls, the overlay ignore-while-in-flight rule and
 * the optional gifter/message fallbacks.
 */
const giftDetails = {
  planId: 'plan_premium',
  planName: 'Premium Access',
  merchant: 'Stellabill',
  duration: 3,
  gifterName: 'Ada Lovelace',
  message: 'Enjoy the subscription!',
  value: 30,
  currency: 'USDC',
  expiresOn: '2026-12-31T00:00:00.000Z',
};

const baseProps = (overrides: Record<string, unknown> = {}) => ({
  isOpen: true,
  onClose: vi.fn(),
  giftDetails,
  giftCode: 'GIFT-ABC-123',
  onRedemptionComplete: vi.fn(),
  ...overrides,
});

describe('RedeemConfirmModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders nothing while closed (the `!isOpen` guard)', () => {
    const { container } = render(<RedeemConfirmModal {...baseProps({ isOpen: false })} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container.querySelector('.redeem-confirm-overlay')).toBeNull();
  });

  it('renders the confirmation surface with title, gift details and code', () => {
    render(<RedeemConfirmModal {...baseProps()} />);

    expect(screen.getByRole('heading', { name: /confirm your gift subscription/i })).toBeInTheDocument();
    expect(screen.getByText('Premium Access')).toBeInTheDocument();
    expect(screen.getByText('Stellabill')).toBeInTheDocument();
    expect(screen.getByText('GIFT-ABC-123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activate subscription/i })).toBeEnabled();
  });

  it('pluralises the duration using the singular form for one month', () => {
    render(
      <RedeemConfirmModal
        {...baseProps({ giftDetails: { ...giftDetails, duration: 1 } })}
      />,
    );

    expect(screen.getByText('1 month')).toBeInTheDocument();
    expect(screen.queryByText('1 months')).not.toBeInTheDocument();
  });

  it('falls back to Anonymous when no gifter name is supplied', () => {
    const { gifterName, ...anonGift } = giftDetails;
    void gifterName;

    render(<RedeemConfirmModal {...baseProps({ giftDetails: anonGift })} />);

    expect(screen.getByText(/anonymous/i)).toBeInTheDocument();
  });

  it('hides the personal message block when the message is absent', () => {
    const { message, ...silentGift } = giftDetails;
    void message;

    render(<RedeemConfirmModal {...baseProps({ giftDetails: silentGift })} />);

    expect(screen.queryByText(/personal message/i)).not.toBeInTheDocument();
  });

  it('locks every dismissal control while the redemption is in flight', () => {
    render(<RedeemConfirmModal {...baseProps()} />);

    fireEvent.click(screen.getByRole('button', { name: /activate subscription/i }));

    expect(screen.getByText(/activating/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close modal/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /activating/i })).toBeDisabled();
  });

  it('ignores backdrop clicks while the redemption is in flight', () => {
    const onClose = vi.fn();
    render(<RedeemConfirmModal {...baseProps({ onClose })} />);

    fireEvent.click(screen.getByRole('button', { name: /activate subscription/i }));
    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('invokes onRedemptionComplete once the simulated request resolves', async () => {
    const onRedemptionComplete = vi.fn();
    render(<RedeemConfirmModal {...baseProps({ onRedemptionComplete })} />);

    fireEvent.click(screen.getByRole('button', { name: /activate subscription/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(onRedemptionComplete).toHaveBeenCalledTimes(1);
    // Controls become usable again after the request settles.
    expect(screen.getByRole('button', { name: /activate subscription/i })).toBeEnabled();
  });

  it('closes through the backdrop only when idle', () => {
    const onClose = vi.fn();
    render(<RedeemConfirmModal {...baseProps({ onClose })} />);

    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
