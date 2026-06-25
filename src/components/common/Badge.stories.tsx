import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Common/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'active', 'draft', 'recommended'],
      description: 'The visual style of the badge',
    },
    children: {
      control: 'text',
      description: 'The text content of the badge',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Default Badge',
  },
};

export const Active: Story = {
  args: {
    variant: 'active',
    children: 'Active',
  },
};

export const Draft: Story = {
  args: {
    variant: 'draft',
    children: 'Draft',
  },
};

export const Recommended: Story = {
  args: {
    variant: 'recommended',
    children: 'Recommended',
  },
  parameters: {
    backgrounds: { default: 'dark' }
  }
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4 items-center">
        <Badge variant="default">Default</Badge>
        <Badge variant="active">Active</Badge>
        <Badge variant="draft">Draft</Badge>
      </div>
      
      <div className="relative p-8 bg-slate-900 border border-slate-800 rounded-xl">
        <p className="text-slate-400 text-sm mb-4">Example in context (Recommended badge is often absolute):</p>
        <div className="h-20 w-48 bg-slate-800/50 rounded-lg relative">
          <Badge variant="recommended">Recommended</Badge>
        </div>
      </div>
    </div>
  ),
};
