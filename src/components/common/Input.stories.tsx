import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Mail, Search, DollarSign, Lock } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'Components/Common/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    helperText: "We'll never share your email.",
  },
};

export const WithError: Story = {
  args: {
    label: 'Password',
    type: 'password',
    defaultValue: 'short',
    error: 'Password must be at least 8 characters long.',
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-sm">
      <Input 
        label="Search" 
        placeholder="Search projects..." 
        leftAddon={<Search size={16} />} 
      />
      <Input 
        label="Amount" 
        placeholder="0.00" 
        leftAddon={<DollarSign size={16} />} 
        rightAddon={<span className="text-xs font-bold">USDC</span>}
      />
      <Input 
        label="Organization ID" 
        defaultValue="org_12345" 
        rightAddon={<Lock size={16} />}
        disabled 
      />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-sm">
      <Input label="Default" placeholder="Placeholder..." />
      <Input label="Disabled" placeholder="Disabled..." disabled />
      <Input label="Required" placeholder="Required..." required />
      <Input label="Error State" defaultValue="Invalid value" error="Something went wrong" />
    </div>
  ),
};
