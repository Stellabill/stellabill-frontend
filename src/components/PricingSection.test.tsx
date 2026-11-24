import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { useState } from 'react';
import PricingSection, { validatePricing } from './PricingSection';
import type { PlanInterval, PricingSectionProps, PricingSectionValue } from './PricingSection';

/*
 * AmountInput / PricingModeInput / FieldHelpPopover are replaced with deterministic
 * stubs so this suite can observe the exact props PricingSection forwards and the
 * exact PricingSectionValue payloads it emits, without depending on the internals of
 * those children. Everything PricingSection renders itself (heading, price-type
 * toggle, billing-interval select, interval error) is exercised through real DOM.
 */
vi.mock('./common/AmountInput', () => ({
  default: (props: any) => (
    <div data-testid="amount-input" data-currency={props.currency} data-error={props.error ?? ''}>
      <input
        id={props.id}
        value={props.value === null || props.value === undefined ? '' : String(props.value)}
        onChange={(event) =>
          props.onChange(event.target.value === '' ? null : Number(event.target.value))
        }
      />
      <button type="button" data-testid="amount-emit-number" onClick={() => props.onChange(42)}>
        emit-number
      </button>
      <button type="button" data-testid="amount-emit-null" onClick={() => props.onChange(null)}>
        emit-null
      </button>
      <button
        type="button"
        data-testid="amount-emit-currency"
        onClick={() => props.onCurrencyChange('EUR')}
      >
        emit-currency
      </button>
      <span data-testid="amount-helper">{props.helperText}</span>
    </div>
  ),
}));

vi.mock('./common/PricingModeInput', () => ({
  PricingModeInput: (props: any) => (
    <div data-testid="pricing-mode-input" data-mode={props.mode} data-error={props.error ?? ''}>
      <input id={props.id} value={props.value} onChange={props.onChange} />
      <span data-testid="pricing-mode-helper">{props.helperText}</span>
    </div>
  ),
}));

vi.mock('./common/FieldHelpPopover', () => ({
  FieldLabelWithHelp: (props: any) => (
    <div
      data-testid="field-label"
      data-help-title={props.helpTitle}
      data-required={String(Boolean(props.required))}
    >
      <label htmlFor={props.htmlFor}>{props.children}</label>
    </div>
  ),
}));

const PLAN_INTERVALS: PlanInterval[] = ['Monthly', 'Yearly'];

const baseValue: PricingSectionValue = {
  price: '10',
  interval: 'Monthly',
  priceType: 'currency',
};

interface ControlledProps {
  initial: PricingSectionValue;
  onChange?: PricingSectionProps['onChange'];
  priceError?: string;
  intervalError?: string;
}

/** Minimal controlled host so value/onChange round-trips are observable. */
function ControlledPricingSection({
  initial,
  onChange,
  priceError,
  intervalError,
}: ControlledProps) {
  const [value, setValue] = useState<PricingSectionValue>(initial);
  return (
    <PricingSection
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      priceError={priceError}
      intervalError={intervalError}
    />
  );
}

describe('PricingSection', () => {
  describe('rendering and PlanInterval coverage', () => {
    it('renders the Pricing heading and the price-type toggle group', () => {
      render(<ControlledPricingSection initial={baseValue} />);

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Pricing');
      const group = screen.getByRole('group', { name: 'Price type' });
      expect(group).toBeInTheDocument();
      const toggleButtons = within(group).getAllByRole('button');
      expect(toggleButtons).toHaveLength(2);
      expect(toggleButtons.map((button) => button.textContent)).toEqual(['Currency', 'Percent']);
      // The first mount in this file also pays React DOM + jsdom initialisation,
      // which is why this one test is given a larger budget than the 5s default.
    }, 30_000);

    it('renders every PlanInterval option with its exact value and label', () => {
      render(<ControlledPricingSection initial={baseValue} />);

      const select = screen.getByLabelText('Billing interval') as HTMLSelectElement;
      const options = Array.from(select.options).map((option) => ({
        value: option.value,
        label: option.text,
      }));

      expect(options).toEqual([
        { value: '', label: 'Select interval' },
        { value: 'Monthly', label: 'Monthly' },
        { value: 'Yearly', label: 'Yearly' },
      ]);
      for (const interval of PLAN_INTERVALS) {
        expect(options).toContainEqual({ value: interval, label: interval });
      }
    });

    it('reflects each PlanInterval in the controlled select value', () => {
      const cases: Array<'' | PlanInterval> = ['', 'Monthly', 'Yearly'];

      for (const interval of cases) {
        const { unmount } = render(
          <ControlledPricingSection initial={{ ...baseValue, interval }} />
        );
        expect(screen.getByLabelText('Billing interval')).toHaveValue(interval);
        unmount();
      }
    });

    it('labels the billing interval select through the help-popover label wrapper', () => {
      render(<ControlledPricingSection initial={baseValue} />);

      const label = screen.getByTestId('field-label');
      expect(label).toHaveAttribute('data-help-title', 'Billing interval');
      expect(label).toHaveAttribute('data-required', 'true');

      const select = screen.getByLabelText('Billing interval');
      expect(select).toHaveAttribute('id', 'pricing-interval');
      expect(select).toBeRequired();
      expect(select).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('PricingSectionValue and PricingSectionProps contract', () => {
    it('defaults the optional currency to USDC when it is omitted', () => {
      render(
        <ControlledPricingSection
          initial={{ price: '10', interval: 'Monthly', priceType: 'currency' }}
        />
      );

      expect(screen.getByTestId('amount-input')).toHaveAttribute('data-currency', 'USDC');
    });

    it('forwards an explicit currency code to the price input', () => {
      render(<ControlledPricingSection initial={{ ...baseValue, currency: 'XLM' }} />);

      expect(screen.getByTestId('amount-input')).toHaveAttribute('data-currency', 'XLM');
    });

    it('renders the currency input for priceType currency and the mode input for percent', () => {
      const currencyRender = render(
        <ControlledPricingSection initial={{ ...baseValue, priceType: 'currency' }} />
      );
      expect(screen.getByTestId('amount-input')).toBeInTheDocument();
      expect(screen.queryByTestId('pricing-mode-input')).toBeNull();
      currencyRender.unmount();

      render(<ControlledPricingSection initial={{ ...baseValue, priceType: 'percent' }} />);
      expect(screen.getByTestId('pricing-mode-input')).toBeInTheDocument();
      expect(screen.queryByTestId('amount-input')).toBeNull();
    });

    it('passes the price string to the mode input in percent mode', () => {
      render(
        <ControlledPricingSection
          initial={{ price: '25', interval: 'Monthly', priceType: 'percent' }}
        />
      );

      expect(screen.getByTestId('pricing-mode-input')).toHaveAttribute('data-mode', 'percent');
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });

    it('marks the active price-type button with aria-pressed for each priceType', () => {
      const currencyRender = render(
        <ControlledPricingSection initial={{ ...baseValue, priceType: 'currency' }} />
      );
      expect(screen.getByRole('button', { name: 'Currency' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: 'Percent' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      currencyRender.unmount();

      render(<ControlledPricingSection initial={{ ...baseValue, priceType: 'percent' }} />);
      expect(screen.getByRole('button', { name: 'Currency' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(screen.getByRole('button', { name: 'Percent' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('provides the currency helper text and the percent helper text', () => {
      const currencyRender = render(
        <ControlledPricingSection initial={{ ...baseValue, priceType: 'currency' }} />
      );
      expect(screen.getByTestId('amount-helper')).toHaveTextContent(
        'Enter the plan price. Use 0 for a free plan.'
      );
      currencyRender.unmount();

      render(
        <ControlledPricingSection
          initial={{ price: '25', interval: 'Monthly', priceType: 'percent' }}
        />
      );
      expect(screen.getByTestId('pricing-mode-helper')).toHaveTextContent(
        'Enter a discount percentage between 0% and 100%.'
      );
    });

    it('describes the zero-percent case distinctly from a non-zero percent price', () => {
      const zeroRender = render(
        <ControlledPricingSection
          initial={{ price: '0', interval: 'Monthly', priceType: 'percent' }}
        />
      );
      expect(screen.getByTestId('pricing-mode-helper')).toHaveTextContent(
        '0% keeps the plan price unchanged.'
      );
      zeroRender.unmount();

      render(
        <ControlledPricingSection
          initial={{ price: '1', interval: 'Monthly', priceType: 'percent' }}
        />
      );
      expect(screen.getByTestId('pricing-mode-helper')).toHaveTextContent(
        'Enter a discount percentage between 0% and 100%.'
      );
    });
  });

  describe('state transitions', () => {
    it('switches from currency to percent and back through the toggle', () => {
      render(<ControlledPricingSection initial={baseValue} />);

      fireEvent.click(screen.getByRole('button', { name: 'Percent' }));
      expect(screen.getByRole('button', { name: 'Percent' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByTestId('pricing-mode-input')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Currency' }));
      expect(screen.getByRole('button', { name: 'Currency' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByTestId('amount-input')).toBeInTheDocument();
    });

    it('emits the full PricingSectionValue when the price type changes', () => {
      const onChange = vi.fn();
      render(
        <PricingSection
          value={{ price: '10', interval: 'Yearly', priceType: 'currency', currency: 'XLM' }}
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Percent' }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({
        price: '10',
        interval: 'Yearly',
        priceType: 'percent',
        currency: 'XLM',
      });
    });

    it('updates the interval to each PlanInterval through the select', () => {
      const onChange = vi.fn();
      render(
        <ControlledPricingSection initial={{ ...baseValue, interval: '' }} onChange={onChange} />
      );
      const select = screen.getByLabelText('Billing interval');

      fireEvent.change(select, { target: { value: 'Monthly' } });
      expect(onChange).toHaveBeenLastCalledWith({ ...baseValue, interval: 'Monthly' });
      expect(select).toHaveValue('Monthly');

      fireEvent.change(select, { target: { value: 'Yearly' } });
      expect(onChange).toHaveBeenLastCalledWith({ ...baseValue, interval: 'Yearly' });
      expect(select).toHaveValue('Yearly');

      fireEvent.change(select, { target: { value: '' } });
      expect(onChange).toHaveBeenLastCalledWith({ ...baseValue, interval: '' });
      expect(select).toHaveValue('');
    });

    it('preserves unrelated PricingSectionValue fields when the interval changes', () => {
      const onChange = vi.fn();
      render(
        <PricingSection
          value={{ price: '3.5', interval: 'Monthly', priceType: 'percent', currency: 'XLM' }}
          onChange={onChange}
        />
      );

      fireEvent.change(screen.getByLabelText('Billing interval'), {
        target: { value: 'Yearly' },
      });

      expect(onChange).toHaveBeenCalledWith({
        price: '3.5',
        interval: 'Yearly',
        priceType: 'percent',
        currency: 'XLM',
      });
    });

    it('writes the numeric value emitted by the amount input back into the price string', () => {
      render(<ControlledPricingSection initial={baseValue} />);

      fireEvent.click(screen.getByTestId('amount-emit-number'));

      expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    });

    it('clears the price when the amount input emits null', () => {
      render(<ControlledPricingSection initial={baseValue} />);

      fireEvent.click(screen.getByTestId('amount-emit-null'));

      expect(screen.getByTestId('amount-input').querySelector('input')).toHaveValue('');
    });

    it('updates the currency code through onCurrencyChange', () => {
      render(<ControlledPricingSection initial={baseValue} />);

      fireEvent.click(screen.getByTestId('amount-emit-currency'));

      expect(screen.getByTestId('amount-input')).toHaveAttribute('data-currency', 'EUR');
    });

    it('accepts numeric price input in percent mode', () => {
      render(
        <ControlledPricingSection
          initial={{ price: '0', interval: 'Monthly', priceType: 'percent' }}
        />
      );

      fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '12.5' } });

      expect(screen.getByDisplayValue('12.5')).toBeInTheDocument();
    });

    it('rejects non-numeric price input in percent mode', () => {
      render(
        <ControlledPricingSection
          initial={{ price: '25', interval: 'Monthly', priceType: 'percent' }}
        />
      );
      const input = screen.getByDisplayValue('25');

      fireEvent.change(input, { target: { value: 'abc' } });

      expect(input).toHaveValue('25');
    });

    it('allows clearing the percent price back to an empty string', () => {
      render(
        <ControlledPricingSection
          initial={{ price: '25', interval: 'Monthly', priceType: 'percent' }}
        />
      );

      fireEvent.change(screen.getByDisplayValue('25'), { target: { value: '' } });

      expect(screen.getByTestId('pricing-mode-input').querySelector('input')).toHaveValue('');
    });
  });

  describe('error and boundary inputs', () => {
    it('renders the interval error paragraph with its deterministic id', () => {
      render(
        <ControlledPricingSection
          initial={{ ...baseValue, interval: '' }}
          intervalError="Billing interval is required"
        />
      );

      const error = screen.getByText('Billing interval is required');
      expect(error).toHaveAttribute('id', 'pricing-interval-error');

      const select = screen.getByLabelText('Billing interval');
      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(select).toHaveAttribute('aria-describedby', 'pricing-interval-error');
    });

    it('omits all interval error UI when intervalError is undefined', () => {
      render(<ControlledPricingSection initial={baseValue} />);

      expect(screen.queryByText('Billing interval is required')).toBeNull();
      const select = screen.getByLabelText('Billing interval');
      expect(select).toHaveAttribute('aria-invalid', 'false');
      expect(select).not.toHaveAttribute('aria-describedby');
    });

    it('forwards priceError to the active price input without showing an interval error', () => {
      render(
        <ControlledPricingSection
          initial={{ ...baseValue, priceType: 'currency' }}
          priceError="Price is required"
        />
      );

      expect(screen.getByTestId('amount-input')).toHaveAttribute('data-error', 'Price is required');
      expect(screen.queryByText('Billing interval is required')).toBeNull();
    });

    it('forwards priceError to the mode input in percent mode', () => {
      render(
        <ControlledPricingSection
          initial={{ ...baseValue, priceType: 'percent' }}
          priceError="Percent values cannot exceed 100%"
        />
      );

      expect(screen.getByTestId('pricing-mode-input')).toHaveAttribute(
        'data-error',
        'Percent values cannot exceed 100%'
      );
    });

    it('renders an out-of-range interval without throwing and falls back to the empty value', () => {
      expect(() =>
        render(
          <PricingSection
            value={{ ...baseValue, interval: 'Weekly' as unknown as PlanInterval }}
            onChange={vi.fn()}
          />
        )
      ).not.toThrow();

      const select = screen.getByLabelText('Billing interval') as HTMLSelectElement;
      expect(select.value).toBe('');
      expect(Array.from(select.options).some((option) => option.selected && option.value !== '')).toBe(
        false
      );
    });

    it('treats an unknown priceType as neither toggle active and renders the mode branch', () => {
      render(
        <PricingSection
          value={{ ...baseValue, priceType: 'bogus' as unknown as PricingSectionValue['priceType'] }}
          onChange={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: 'Currency' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(screen.getByRole('button', { name: 'Percent' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(screen.getByTestId('pricing-mode-input')).toBeInTheDocument();
    });

    it('renders an empty interval selection and a zero price without crashing', () => {
      render(
        <ControlledPricingSection
          initial={{ price: '0', interval: '', priceType: 'currency' }}
        />
      );

      expect(screen.getByLabelText('Billing interval')).toHaveValue('');
      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });

    it('renders a negative price as forwarded without throwing', () => {
      expect(() =>
        render(<ControlledPricingSection initial={{ ...baseValue, price: '-5' }} />)
      ).not.toThrow();

      expect(screen.getByDisplayValue('-5')).toBeInTheDocument();
    });
  });

  describe('validatePricing', () => {
    const valid: PricingSectionValue = {
      price: '10',
      interval: 'Monthly',
      priceType: 'currency',
    };

    it('accepts a fully populated value', () => {
      expect(validatePricing(valid)).toEqual({});
    });

    it('accepts a zero price as valid', () => {
      expect(validatePricing({ ...valid, price: '0' })).toEqual({});
    });

    it('accepts a positive decimal price as valid', () => {
      expect(validatePricing({ ...valid, price: '12.5' })).toEqual({});
    });

    it('flags an empty price as required', () => {
      expect(validatePricing({ ...valid, price: '' })).toEqual({
        priceError: 'Price is required',
      });
    });

    it('flags a whitespace-only price as required', () => {
      expect(validatePricing({ ...valid, price: '   ' })).toEqual({
        priceError: 'Price is required',
      });
    });

    it('rejects a non-numeric price', () => {
      expect(validatePricing({ ...valid, price: 'abc' })).toEqual({
        priceError: 'Price must be a valid number ≥ 0',
      });
    });

    it('rejects a negative price', () => {
      expect(validatePricing({ ...valid, price: '-1' })).toEqual({
        priceError: 'Price must be a valid number ≥ 0',
      });
    });

    it('rejects a percent price above 100', () => {
      expect(validatePricing({ ...valid, priceType: 'percent', price: '101' })).toEqual({
        priceError: 'Percent values cannot exceed 100%',
      });
    });

    it('accepts exactly 100 for percent mode', () => {
      expect(validatePricing({ ...valid, priceType: 'percent', price: '100' })).toEqual({});
    });

    it('does not apply the percent ceiling in currency mode', () => {
      expect(validatePricing({ ...valid, price: '500' })).toEqual({});
    });

    it('flags a missing interval', () => {
      expect(validatePricing({ ...valid, interval: '' })).toEqual({
        intervalError: 'Billing interval is required',
      });
    });

    it('reports price and interval errors together', () => {
      expect(validatePricing({ ...valid, price: '', interval: '' })).toEqual({
        priceError: 'Price is required',
        intervalError: 'Billing interval is required',
      });
    });

    it('parses a leading numeric prefix and ignores trailing characters', () => {
      expect(validatePricing({ ...valid, price: '12abc' })).toEqual({});
    });
  });
});
