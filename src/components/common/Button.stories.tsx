import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Mail, ArrowRight, Save, Trash2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Components/Common/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'error', 'ghost', 'outline'],
      description: 'The visual style of the button',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows a loading spinner and disables the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    children: {
      control: 'text',
      description: 'The text content of the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Delete Item',
    leftIcon: <Trash2 size={16} />,
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Processing...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button leftIcon={<Mail size={16} />}>Email Support</Button>
        <Button variant="secondary" rightIcon={<ArrowRight size={16} />}>Get Started</Button>
        <Button variant="outline" leftIcon={<Save size={16} />}>Save Changes</Button>
      </div>
    </div>
  ),
};

export const LongText: Story = {
  args: {
    children: 'This is a very long button text that might overflow on smaller screens or cause layout shifts',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4 items-center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="error">Error</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        <Button variant="primary" isLoading>Primary</Button>
        <Button variant="secondary" isLoading>Secondary</Button>
        <Button variant="error" isLoading>Error</Button>
        <Button variant="outline" isLoading>Outline</Button>
        <Button variant="ghost" isLoading>Ghost</Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Button variant="primary" disabled>Primary</Button>
        <Button variant="secondary" disabled>Secondary</Button>
        <Button variant="error" disabled>Error</Button>
        <Button variant="outline" disabled>Outline</Button>
        <Button variant="ghost" disabled>Ghost</Button>
      </div>
    </div>
  ),
};
