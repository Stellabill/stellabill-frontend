import { render, screen } from '@testing-library/react';
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

    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText(/Payment failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix payment method/i)).toBeInTheDocument();
  });

  it('does not render when failedAttempts is 0', () => {
    const { container } = render(
      <PaymentFailedBanner subscriptionId="sub_123" failedAttempts={0} retrySchedule={[]} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
