import { fireEvent, render, screen } from '@testing-library/react';
import PaymentFailedBanner from './PaymentFailedBanner';

describe('PaymentFailedBanner', () => {
  it('renders when there are failed attempts and shows CTA', () => {
    render(
      <PaymentFailedBanner
        subscriptionId="sub_123"
        failedAttempts={1}
        retrySchedule={[{ id: 'r1', when: 'Today', status: 'past' }]}
      />
    );

    expect(screen.getByRole('region', { name: /Payment failed/i })).toBeInTheDocument();
    expect(screen.getByText(/Payment failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix payment method/i)).toBeInTheDocument();
  });

  it('does not render when failedAttempts is 0', () => {
    const { container } = render(
      <PaymentFailedBanner subscriptionId="sub_123" failedAttempts={0} retrySchedule={[]} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('uses the subscriptions fallback and renders nothing after dismissal', () => {
    const { container } = render(
      <PaymentFailedBanner subscriptionId={undefined} failedAttempts={1} retrySchedule={[]} />
    );

    expect(screen.getByRole('link', { name: /Fix payment method/i })).toHaveAttribute(
      'href',
      '/subscriptions'
    );

    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));

    expect(container).toBeEmptyDOMElement();
  });
});
