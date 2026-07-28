import type { Meta, StoryObj } from '@storybook/react';
import RevenueChart from '../components/RevenueChart';

const meta: Meta<typeof RevenueChart> = {
  title: 'Components/RevenueChart',
  component: RevenueChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Accessible line chart component with focus rings, roving tabIndex arrow-key traversal, stable tooltip positioning, screen reader summary, and aria-live announcements.',
      },
    },
  },
  argTypes: {
    initialTimeRange: {
      control: { type: 'select' },
      options: ['7D', '30D', '90D'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RevenueChart>;

export const Default30D: Story = {
  args: {
    initialTimeRange: '30D',
  },
};

export const SparseData7D: Story = {
  args: {
    initialTimeRange: '7D',
  },
};

export const DenseData90D: Story = {
  args: {
    initialTimeRange: '90D',
  },
};

export const CustomDataset: Story = {
  args: {
    data: [
      { date: 'Nov 1', revenue: 1200 },
      { date: 'Nov 2', revenue: 1450 },
      { date: 'Nov 3', revenue: 980 },
      { date: 'Nov 4', revenue: 2100 },
      { date: 'Nov 5', revenue: 1850 },
      { date: 'Nov 6', revenue: 2400 },
      { date: 'Nov 7', revenue: 3100 },
    ],
  },
};

export const RTLPositioning: Story = {
  render: (args) => (
    <div dir="rtl">
      <RevenueChart {...args} />
    </div>
  ),
  args: {
    initialTimeRange: '7D',
  },
};
