import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from './Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Common/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'glass'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">Default Card</h3>
        <p className="text-sm text-slate-400">
          This is a standard card used for grouping content.
        </p>
        <Button variant="secondary">Action</Button>
      </div>
    ),
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">Primary Feature</h3>
        <p className="text-sm text-slate-400">
          Used for highlighted content or primary actions.
        </p>
        <Button>Get Started</Button>
      </div>
    ),
  },
};

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">Glassmorphism</h3>
        <p className="text-sm text-slate-200">
          Translucent card with backdrop blur.
        </p>
      </div>
    ),
  },
  parameters: {
    backgrounds: { default: 'dark' }
  }
};

export const LongText: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-white">Card with extremely long content to test layout and wrapping behavior</h3>
        <p className="text-sm text-slate-400">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </p>
      </div>
    ),
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card variant="primary">
        <h4 className="font-bold text-white mb-2">Pro Plan</h4>
        <p className="text-2xl font-bold text-white mb-4">$29<span className="text-sm font-normal text-slate-400">/mo</span></p>
        <Button className="w-full">Upgrade</Button>
      </Card>
      <Card>
        <h4 className="font-bold text-white mb-2">Free Plan</h4>
        <p className="text-2xl font-bold text-white mb-4">$0<span className="text-sm font-normal text-slate-400">/mo</span></p>
        <Button variant="secondary" className="w-full">Current Plan</Button>
      </Card>
      <Card variant="secondary">
        <h4 className="font-bold text-white mb-2">Enterprise</h4>
        <p className="text-sm text-slate-400 mb-4">Custom solutions for large teams.</p>
        <Button variant="outline" className="w-full">Contact Sales</Button>
      </Card>
    </div>
  ),
};
