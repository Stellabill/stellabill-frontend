import type { Meta, StoryObj } from '@storybook/react';
import {
  Check,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { IconButton } from './IconButton';

const iconMap = {
  Plus: <Plus aria-hidden="true" />,
  Trash2: <Trash2 aria-hidden="true" />,
  Settings: <Settings aria-hidden="true" />,
  X: <X aria-hidden="true" />,
  Check: <Check aria-hidden="true" />,
  MoreHorizontal: <MoreHorizontal aria-hidden="true" />,
} as const;

const meta: Meta<typeof IconButton> = {
  title: 'Components/Common/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    icon: {
      control: { type: 'select' },
      options: Object.keys(iconMap),
      mapping: iconMap,
      description:
        'Decorative icon rendered inside the button. The accessible name comes from aria-label.',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'elevated', 'inverse'],
      description: 'The visual style of the icon button',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the icon button',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows a spinner, sets aria-busy, and disables the button',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible name announced by assistive technology (required)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
  },
  args: {
    icon: 'Plus',
    'aria-label': 'Add item',
    variant: 'secondary',
    size: 'md',
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

export const Primary: Story = {
  args: {
    icon: 'Check',
    variant: 'primary',
    'aria-label': 'Confirm selection',
  },
};

export const Secondary: Story = {
  args: {
    icon: 'Settings',
    variant: 'secondary',
    'aria-label': 'Open settings',
  },
};

export const Ghost: Story = {
  args: {
    icon: 'MoreHorizontal',
    variant: 'ghost',
    'aria-label': 'More options',
  },
};

export const Outline: Story = {
  args: {
    icon: 'Plus',
    variant: 'outline',
    'aria-label': 'Add item',
  },
};

export const Elevated: Story = {
  args: {
    icon: 'Settings',
    variant: 'elevated',
    'aria-label': 'Open settings',
  },
};

export const Inverse: Story = {
  args: {
    icon: 'X',
    variant: 'inverse',
    'aria-label': 'Close dialog',
  },
};

export const Small: Story = {
  args: {
    icon: 'Plus',
    size: 'sm',
    'aria-label': 'Add item',
  },
};

export const Medium: Story = {
  args: {
    icon: 'Plus',
    size: 'md',
    'aria-label': 'Add item',
  },
};

export const Large: Story = {
  args: {
    icon: 'Plus',
    size: 'lg',
    'aria-label': 'Add item',
  },
};

export const Loading: Story = {
  args: {
    icon: 'Plus',
    isLoading: true,
    'aria-label': 'Saving changes',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4 items-center">
        <IconButton variant="primary" aria-label="Confirm selection">
          <Check aria-hidden="true" />
        </IconButton>
        <IconButton variant="secondary" aria-label="Open settings">
          <Settings aria-hidden="true" />
        </IconButton>
        <IconButton variant="ghost" aria-label="More options">
          <MoreHorizontal aria-hidden="true" />
        </IconButton>
        <IconButton variant="outline" aria-label="Add item">
          <Plus aria-hidden="true" />
        </IconButton>
        <IconButton variant="elevated" aria-label="Open settings">
          <Settings aria-hidden="true" />
        </IconButton>
        <IconButton variant="inverse" aria-label="Close dialog">
          <X aria-hidden="true" />
        </IconButton>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <IconButton size="sm" aria-label="Add item">
          <Plus aria-hidden="true" />
        </IconButton>
        <IconButton size="md" aria-label="Add item">
          <Plus aria-hidden="true" />
        </IconButton>
        <IconButton size="lg" aria-label="Add item">
          <Plus aria-hidden="true" />
        </IconButton>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <IconButton isLoading aria-label="Saving changes">
          <Plus aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  ),
};
