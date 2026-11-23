import type { Meta, StoryObj } from '@storybook/react';
import Amount from './Amount';

const meta: Meta<typeof Amount> = {
  title: 'Components/Common/Amount',
  component: Amount,
  tags: ['autodocs'],
  args: {
    value: 1234.5,
    currency: 'USDC',
    showCode: true,
    placeholder: '—',
    'data-testid': 'amount',
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'The numeric input. null/undefined/NaN/non-numeric strings render as the placeholder.',
    },
    currency: {
      control: 'text',
      description: 'Currency code label (defaults to USDC).',
    },
    precision: {
      control: { type: 'number', min: 0, max: 12 },
      description: 'Maximum fraction digits.',
    },
    minPrecision: {
      control: { type: 'number', min: 0, max: 12 },
      description: 'Minimum fraction digits.',
    },
    rounding: {
      control: 'select',
      options: ['half-up', 'half-even', 'down', 'up'],
      description: 'Rounding strategy.',
    },
    compact: {
      control: 'boolean',
      description: 'Use compact notation (e.g. 1.2K, 3.4M).',
    },
    signDisplay: {
      control: 'select',
      options: ['auto', 'always', 'never', 'except-zero'],
      description: 'Sign-display rule.',
    },
    locale: {
      control: 'text',
      description: 'BCP-47 locale for grouping and decimal separator.',
    },
    showCode: {
      control: 'boolean',
      description: 'Show the trailing currency code.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder rendered when the value is missing.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Override the screen-reader label entirely.',
    },
    as: {
      control: 'select',
      options: ['span', 'strong', 'output', 'div'],
      description: 'Override the host element.',
    },
    className: {
      control: 'text',
      description: 'Optional className applied to the root element.',
    },
    numberClassName: {
      control: 'text',
      description: 'Optional className applied to the number portion.',
    },
    codeClassName: {
      control: 'text',
      description: 'Optional className applied to the currency code portion.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Amount>;

export const Default: Story = {
  args: {
    value: 1234.5,
  },
};

export const DifferentCurrencies: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div>
        <Amount value={1234.5} currency="USDC" data-testid="amount-usdc" />
      </div>
      <div>
        <Amount value={250.75} currency="XLM" data-testid="amount-xlm" />
      </div>
      <div>
        <Amount value={99.95} currency="EURC" data-testid="amount-eurc" />
      </div>
      <div>
        <Amount value={1234.5} showCode={false} data-testid="amount-no-code" />
      </div>
    </div>
  ),
};

export const Precision: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div>
        <Amount value={0.005} precision={2} data-testid="amount-half-up" />
      </div>
      <div>
        <Amount value={0.123456789} precision={6} currency="XLM" data-testid="amount-high-precision" />
      </div>
      <div>
        <Amount value={10} precision={2} minPrecision={0} data-testid="amount-trimmed" />
      </div>
      <div>
        <Amount value={1500000} compact precision={1} minPrecision={0} data-testid="amount-compact" />
      </div>
    </div>
  ),
};

export const NegativeValues: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div>
        <Amount value={-50} data-testid="amount-negative" />
      </div>
      <div>
        <Amount value={-50} signDisplay="always" data-testid="amount-negative-always" />
      </div>
      <div>
        <Amount value={50} signDisplay="always" data-testid="amount-positive-always" />
      </div>
      <div>
        <Amount value={-0.5} precision={0} rounding="half-up" data-testid="amount-negative-rounded" />
      </div>
    </div>
  ),
};

export const MissingValue: Story = {
  args: {
    value: null,
    placeholder: '—',
  },
};
