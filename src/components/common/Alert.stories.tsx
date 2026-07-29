import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Common/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
      description: 'The semantic meaning and color of the alert',
    },
    title: {
      control: 'text',
      description: 'Optional bold heading above the message',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Heads up',
    children: 'This subscription renews in 3 days.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Payment received',
    children: 'Your invoice has been paid in full.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Card expiring soon',
    children: 'Update your payment method to avoid an interruption.',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'Payment failed',
    children: 'We could not charge your card. Please try again.',
  },
};

export const Dismissible: Story = {
  args: {
    variant: 'warning',
    title: 'Action needed',
    children: 'This alert can be dismissed.',
    onDismiss: () => {},
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert variant="info" title="Info">Informational message.</Alert>
      <Alert variant="success" title="Success">Everything worked.</Alert>
      <Alert variant="warning" title="Warning">Something needs attention.</Alert>
      <Alert variant="danger" title="Danger">Something went wrong.</Alert>
    </div>
  ),
};
