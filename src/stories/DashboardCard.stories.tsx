import type { Meta, StoryObj } from '@storybook/react';
import { Users, TrendingUp } from 'lucide-react';
import DashboardCard from '../components/Dashboard/DashboardCard';

const meta: Meta<typeof DashboardCard> = {
  title: 'Dashboard/KPI Tile',
  component: DashboardCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Reusable KPI tile with four variants: value-only, value + delta, value + sparkline, and value + target. Deltas always pair an icon, an explicit +/- sign, and a color so direction is never conveyed by color alone. Sparklines use the chart-series tokens; targets show a goal value with optional progress.',
      },
    },
  },
  argTypes: {
    trend: {
      control: { type: 'select' },
      options: ['up', 'down', 'neutral'],
    },
    change: { control: { type: 'number' } },
    targetProgress: { control: { type: 'number' } },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardCard>;

export const ValueOnly: Story = {
  name: 'Value only',
  args: {
    title: 'Upcoming Renewals',
    value: '48',
    icon: <TrendingUp size={20} />,
  },
};

export const ValueWithDelta: Story = {
  name: 'Value + delta',
  args: {
    title: 'Failed Charges',
    value: '12',
    change: -4.1,
    trend: 'down',
    deltaLabel: 'vs last 30 days',
    icon: <TrendingUp size={20} />,
  },
};

export const ValueWithSparkline: Story = {
  name: 'Value + sparkline',
  args: {
    title: 'MRR',
    value: '$42,500',
    change: 8.2,
    trend: 'up',
    sparklineData: [10, 20, 15, 25, 30, 28, 40, 35, 45, 50],
    icon: <TrendingUp size={20} />,
  },
};

export const ValueWithTarget: Story = {
  name: 'Value + target',
  args: {
    title: 'Active Subscriptions',
    value: '1,284',
    change: 12.5,
    trend: 'up',
    sparklineData: [10, 20, 15, 25, 30, 28, 40, 35, 45, 50],
    target: 1500,
    targetLabel: 'Goal',
    targetProgress: 86,
    icon: <Users size={20} />,
  },
};

export const NegativeGoalProgress: Story = {
  name: 'Behind target (negative progress)',
  args: {
    title: 'MRR',
    value: '$30,000',
    change: -5,
    trend: 'down',
    target: 50000,
    targetLabel: 'Goal',
    targetProgress: -20,
    icon: <TrendingUp size={20} />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Negative progress keeps the bar empty, shows a -N% sign, and uses danger colouring.',
      },
    },
  },
};
