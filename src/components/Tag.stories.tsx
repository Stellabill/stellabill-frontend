import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import Tag from './Tag';

const colors = [
  'blue',
  'green',
  'yellow',
  'red',
  'purple',
  'pink',
  'orange',
  'gray',
] as const;

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The text content of the tag',
    },
    color: {
      control: 'select',
      options: colors,
      description: 'The colour of the tag',
    },
    size: {
      control: 'select',
      options: ['small', 'medium'],
      description: 'The size of the tag',
    },
    removable: {
      control: 'boolean',
      description: 'Renders a remove button when an onRemove handler is provided',
    },
    onRemove: {
      action: 'onRemove',
      description: 'Called when the remove button is clicked',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes applied to the tag',
    },
  },
  args: {
    label: 'Tag',
    color: 'blue',
    size: 'medium',
    removable: false,
    onRemove: fn(),
    className: '',
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Blue: Story = {
  args: {
    label: 'Blue',
    color: 'blue',
  },
};

export const Green: Story = {
  args: {
    label: 'Green',
    color: 'green',
  },
};

export const Yellow: Story = {
  args: {
    label: 'Yellow',
    color: 'yellow',
  },
};

export const Red: Story = {
  args: {
    label: 'Red',
    color: 'red',
  },
};

export const Purple: Story = {
  args: {
    label: 'Purple',
    color: 'purple',
  },
};

export const Pink: Story = {
  args: {
    label: 'Pink',
    color: 'pink',
  },
};

export const Orange: Story = {
  args: {
    label: 'Orange',
    color: 'orange',
  },
};

export const Gray: Story = {
  args: {
    label: 'Gray',
    color: 'gray',
  },
};

export const Removable: Story = {
  args: {
    label: 'Removable',
    color: 'blue',
    removable: true,
    onRemove: fn(),
  },
};
