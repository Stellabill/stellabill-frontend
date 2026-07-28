import type { Meta, StoryObj } from '@storybook/react';
import RevenueChart, { SeriesData } from '../components/RevenueChart';

const meta: Meta<typeof RevenueChart> = {
  title: 'Components/RevenueChart',
  component: RevenueChart,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Accessible multi-series line chart component with interactive legend, focus rings, roving tabIndex navigation, stable tooltip positioning, screen reader support, and aria-live announcements.',
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

// Sample series data for stories
const sampleSeries: SeriesData[] = [
  {
    id: 'revenue',
    name: 'Total Revenue',
    color: 'var(--chart-series-1)',
    visible: true,
    data: [
      { date: 'Nov 1', revenue: 1200 },
      { date: 'Nov 2', revenue: 1450 },
      { date: 'Nov 3', revenue: 980 },
      { date: 'Nov 4', revenue: 2100 },
      { date: 'Nov 5', revenue: 1850 },
      { date: 'Nov 6', revenue: 2400 },
      { date: 'Nov 7', revenue: 3100 },
    ]
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    color: 'var(--chart-series-2)',
    visible: true,
    data: [
      { date: 'Nov 1', revenue: 800 },
      { date: 'Nov 2', revenue: 950 },
      { date: 'Nov 3', revenue: 650 },
      { date: 'Nov 4', revenue: 1400 },
      { date: 'Nov 5', revenue: 1200 },
      { date: 'Nov 6', revenue: 1600 },
      { date: 'Nov 7', revenue: 2000 },
    ]
  },
  {
    id: 'oneTime',
    name: 'One-time Payments',
    color: 'var(--chart-series-3)',
    visible: true,
    data: [
      { date: 'Nov 1', revenue: 400 },
      { date: 'Nov 2', revenue: 500 },
      { date: 'Nov 3', revenue: 330 },
      { date: 'Nov 4', revenue: 700 },
      { date: 'Nov 5', revenue: 650 },
      { date: 'Nov 6', revenue: 800 },
      { date: 'Nov 7', revenue: 1100 },
    ]
  }
];

const complexSeries: SeriesData[] = [
  {
    id: 'total',
    name: 'Total Revenue',
    color: 'var(--chart-series-1)',
    visible: true,
    data: [
      { date: 'Q1', revenue: 12000 },
      { date: 'Q2', revenue: 15000 },
      { date: 'Q3', revenue: 18000 },
      { date: 'Q4', revenue: 22000 },
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    color: 'var(--chart-series-2)',
    visible: true,
    data: [
      { date: 'Q1', revenue: 8000 },
      { date: 'Q2', revenue: 10000 },
      { date: 'Q3', revenue: 12000 },
      { date: 'Q4', revenue: 15000 },
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    color: 'var(--chart-series-3)',
    visible: true,
    data: [
      { date: 'Q1', revenue: 3000 },
      { date: 'Q2', revenue: 4000 },
      { date: 'Q3', revenue: 4500 },
      { date: 'Q4', revenue: 5000 },
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    color: 'var(--chart-series-4)',
    visible: true,
    data: [
      { date: 'Q1', revenue: 1000 },
      { date: 'Q2', revenue: 1000 },
      { date: 'Q3', revenue: 1500 },
      { date: 'Q4', revenue: 2000 },
    ]
  }
];

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

export const InteractiveMultiSeries: Story = {
  name: 'Interactive Multi-Series Legend',
  args: {
    series: sampleSeries,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multi-series chart with interactive legend. Click legend chips to show/hide series. Use keyboard navigation (Tab + Arrow keys) and Space/Enter to toggle.',
      },
    },
  },
};

export const ComplexMultiSeries: Story = {
  name: 'Complex Multi-Series (4 Series)',
  args: {
    series: complexSeries,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with 4 different series showing quarterly revenue breakdown. Demonstrates legend keyboard navigation and accessibility features.',
      },
    },
  },
};

export const SingleSeriesLegend: Story = {
  name: 'Single Series (Legend Disabled)',
  args: {
    series: [sampleSeries[0]],
  },
  parameters: {
    docs: {
      description: {
        story: 'When only one series is present, the legend chip is disabled to prevent hiding all data.',
      },
    },
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
  name: 'RTL Layout Support',
  render: (args) => (
    <div dir="rtl">
      <RevenueChart {...args} />
    </div>
  ),
  args: {
    series: sampleSeries,
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart and legend with RTL (right-to-left) text direction support. Arrow key navigation is automatically reversed.',
      },
    },
  },
};

export const AccessibilityDemo: Story = {
  name: 'Accessibility Features',
  args: {
    series: sampleSeries,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates full accessibility features: screen reader announcements, keyboard navigation, focus management, and ARIA attributes. Try using only keyboard navigation.',
      },
    },
  },
};
