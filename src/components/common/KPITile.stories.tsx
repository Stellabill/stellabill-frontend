import type { Meta, StoryObj } from '@storybook/react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import KPITile from './KPITile';

const meta: Meta<typeof KPITile> = {
  title: 'Components/Common/KPITile',
  component: KPITile,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed at the top of the KPI tile',
    },
    value: {
      control: 'text',
      description: 'Primary metric value (string or number)',
    },
    delta: {
      control: 'number',
      description: 'Absolute percentage delta compared to the previous period',
    },
    deltaDirection: {
      control: 'select',
      options: ['positive', 'negative', 'neutral'],
      description: 'Optional explicit direction override for the delta badge',
    },
    deltaLabel: {
      control: 'text',
      description: 'Comparison period label displayed below the metric',
    },
    sparklineData: {
      control: 'object',
      description: 'Array of numeric values rendered as a trend sparkline',
    },
    target: {
      control: 'text',
      description: 'Optional target or goal value',
    },
    targetLabel: {
      control: 'text',
      description: 'Label prefix for the target value',
    },
    loading: {
      control: 'boolean',
      description: 'Renders the loading skeleton state when true',
    },
    helpText: {
      control: 'text',
      description: 'Optional tooltip text shown next to the title',
    },
  },
};

export default meta;
type Story = StoryObj<typeof KPITile>;

export const Default: Story = {
  args: {
    title: 'Monthly Recurring Revenue',
    value: '$48,250',
    delta: 0,
    deltaDirection: 'neutral',
    deltaLabel: 'vs last 30 days',
    target: '$50,000',
    targetLabel: 'Goal',
    icon: <DollarSign size={18} aria-hidden="true" />,
  },
};

export const PositiveTrend: Story = {
  args: {
    title: 'Active Subscriptions',
    value: '1,284',
    delta: 12.5,
    deltaDirection: 'positive',
    deltaLabel: 'vs last 30 days',
    sparklineData: [920, 980, 1040, 1105, 1180, 1230, 1284],
    target: '1,500',
    targetLabel: 'Goal',
    helpText: 'Total paying subscribers with an active billing cycle.',
    icon: <TrendingUp size={18} aria-hidden="true" />,
  },
};

export const NegativeTrend: Story = {
  args: {
    title: 'Net Revenue Retention',
    value: '94.2%',
    delta: -3.8,
    deltaDirection: 'negative',
    deltaLabel: 'vs previous quarter',
    sparklineData: [102, 100.5, 99.1, 97.8, 96.4, 95.0, 94.2],
    target: '100%',
    targetLabel: 'Target',
    helpText: 'Percentage of recurring revenue retained from existing customers.',
    icon: <TrendingDown size={18} aria-hidden="true" />,
  },
};

export const Loading: Story = {
  args: {
    title: 'Monthly Recurring Revenue',
    value: '$48,250',
    loading: true,
  },
};
