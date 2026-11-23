import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import ConfirmDialog from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/Common/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  args: {
    title: 'Confirm action',
    description: 'Describe the action this dialog confirms and what happens when you continue.',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    loadingLabel: 'Confirming...',
    isOpen: true,
    isLoading: false,
    onConfirm: action('onConfirm'),
    onClose: action('onClose'),
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the confirmation dialog is visible.',
    },
    title: {
      control: 'text',
      description: 'Headline shown at the top of the dialog.',
    },
    description: {
      control: 'text',
      description: 'Optional supporting text shown under the title.',
    },
    consequences: {
      control: 'object',
      description: 'List of consequences displayed as bullets.',
    },
    confirmLabel: {
      control: 'text',
      description: 'Label of the confirm button.',
    },
    cancelLabel: {
      control: 'text',
      description: 'Label of the cancel button.',
    },
    loadingLabel: {
      control: 'text',
      description: 'Label of the confirm button while the action is pending.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the dialog is in a pending/loading state.',
    },
    destructive: {
      control: 'boolean',
      description: 'Whether the dialog shows the destructive (warning) variant.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Default: Story = {
  args: {
    destructive: false,
    title: 'Confirm action',
    description: 'Describe the action this dialog confirms and what happens when you continue.',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    isOpen: true,
    isLoading: false,
  },
};

export const Destructive: Story = {
  args: {
    destructive: true,
    title: 'Delete account',
    description: 'Deleting your account is permanent.',
    consequences: [
      'All your data will be permanently deleted',
      'You will lose access to your billing history and invoices',
      'This action cannot be undone',
    ],
    confirmLabel: 'Delete account',
    cancelLabel: 'Keep account',
    isOpen: true,
    isLoading: false,
  },
};

export const Pending: Story = {
  args: {
    destructive: true,
    title: 'Delete account',
    description: 'Deleting your account is permanent.',
    loadingLabel: 'Deleting...',
    confirmLabel: 'Delete account',
    cancelLabel: 'Cancel',
    isOpen: true,
    isLoading: true,
  },
};
