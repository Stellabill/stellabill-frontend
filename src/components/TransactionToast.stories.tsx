import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { TransactionToast, ToastContainer, type ToastOptions } from './TransactionToast';

const baseToast: ToastOptions = {
  id: 'toast-1',
  status: 'pending',
  title: 'Transaction submitted',
  message: 'Waiting for the Stellar network to confirm your payment.',
  autoClose: false,
};

const meta: Meta<typeof TransactionToast> = {
  title: 'Components/TransactionToast',
  component: TransactionToast,
  tags: ['autodocs'],
  args: {
    toast: baseToast,
    onClose: action('onClose'),
  },
  argTypes: {
    toast: {
      control: 'object',
      description:
        'Toast to render: `id`, `status`, `title`, optional `message`, `actionText`/`onAction` and `autoClose`.',
    },
    onClose: {
      control: false,
      action: 'onClose',
      description: 'Called with the toast id after the exit animation completes.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TransactionToast>;

export const Pending: Story = {
  args: {
    toast: {
      ...baseToast,
      status: 'pending',
      title: 'Transaction submitted',
      message: 'Waiting for the Stellar network to confirm your payment.',
    },
  },
};

export const Success: Story = {
  args: {
    toast: {
      ...baseToast,
      status: 'success',
      title: 'Payment successful',
      message: 'Your subscription has been renewed for another month.',
    },
  },
};

export const Error: Story = {
  args: {
    toast: {
      ...baseToast,
      status: 'error',
      title: 'Payment failed',
      message: 'Your card was declined. Update your payment method and try again.',
      actionText: 'Try again',
      onAction: action('onAction'),
    },
  },
};

const stackedToasts: ToastOptions[] = [
  {
    id: 'toast-pending',
    status: 'pending',
    title: 'Transaction submitted',
    message: 'Waiting for the Stellar network to confirm your payment.',
    autoClose: false,
  },
  {
    id: 'toast-success',
    status: 'success',
    title: 'Payment successful',
    message: 'Your subscription has been renewed for another month.',
    autoClose: false,
  },
  {
    id: 'toast-error',
    status: 'error',
    title: 'Payment failed',
    message: 'Your card was declined. Update your payment method and try again.',
    autoClose: false,
  },
];

function ToastContainerDemo() {
  const [toasts, setToasts] = useState<ToastOptions[]>(stackedToasts);

  const removeToast = (id: string) => {
    action('removeToast')(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
}

export const ContainerStack: Story = {
  name: 'ToastContainer stack',
  render: () => <ToastContainerDemo />,
  parameters: {
    controls: { disable: true },
  },
};
