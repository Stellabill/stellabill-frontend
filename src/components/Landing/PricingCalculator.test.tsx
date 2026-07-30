import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PricingCalculator from './PricingCalculator';

describe('PricingCalculator', () => {
  it('renders the initial estimate and recommended plan', () => {
    render(<PricingCalculator />);

    expect(screen.getByText('Estimated monthly total')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-calculator-total')).toHaveTextContent('$251');
    expect(screen.getByTestId('pricing-calculator-plan')).toHaveTextContent('Growth');
  });

  it('updates the estimate and plan when the value inputs change', async () => {
    const user = userEvent.setup();
    render(<PricingCalculator />);

    const seatsInput = screen.getByLabelText(/seats input/i);
    await user.clear(seatsInput);
    await user.type(seatsInput, '40');
    await user.tab();

    expect(screen.getByTestId('pricing-calculator-total')).toHaveTextContent('$515');
    expect(screen.getByTestId('pricing-calculator-plan')).toHaveTextContent('Scale');
  });
});
