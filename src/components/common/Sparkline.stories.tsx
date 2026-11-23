import type { Meta, StoryObj } from '@storybook/react';
import Sparkline from './Sparkline';

const meta: Meta<typeof Sparkline> = {
  title: 'Components/Common/Sparkline',
  component: Sparkline,
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Numeric data series rendered by the sparkline',
    },
    width: {
      control: { type: 'number', min: 40, max: 600, step: 10 },
      description: 'SVG width in pixels',
    },
    height: {
      control: { type: 'number', min: 16, max: 200, step: 4 },
      description: 'SVG height in pixels',
    },
    color: {
      control: 'color',
      description: 'Stroke and area fill color',
    },
    strokeWidth: {
      control: { type: 'number', min: 1, max: 6, step: 0.5 },
      description: 'Line stroke width',
    },
    showArea: {
      control: 'boolean',
      description: 'Whether to render the translucent area fill under the line',
    },
    areaOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Opacity of the area fill',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label for the SVG chart',
    },
  },
  args: {
    width: 160,
    height: 48,
    strokeWidth: 2,
    showArea: true,
    areaOpacity: 0.15,
    className: '',
  },
};

export default meta;
type Story = StoryObj<typeof Sparkline>;

export const Rising: Story = {
  args: {
    data: [12, 18, 16, 24, 31, 39, 48],
    color: '#22c55e',
    'aria-label': 'Rising revenue sparkline',
  },
};

export const Falling: Story = {
  args: {
    data: [52, 46, 48, 37, 29, 21, 14],
    color: '#ef4444',
    'aria-label': 'Falling churn sparkline',
  },
};

export const Flat: Story = {
  args: {
    data: [25, 25, 25, 25, 25, 25],
    color: '#38bdf8',
    'aria-label': 'Flat usage sparkline',
  },
};

export const Empty: Story = {
  args: {
    data: [],
    'aria-label': 'Empty sparkline with no data',
  },
};
