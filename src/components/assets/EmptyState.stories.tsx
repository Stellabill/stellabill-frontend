import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { Button } from '../common/Button';
import { EmptyState, EmptyStateType } from './EmptyState';

const VARIANTS: EmptyStateType[] = [
  'subscriptions',
  'plans',
  'invoices',
  'notifications',
  'search',
  'generic',
];

const meta: Meta<typeof EmptyState> = {
  title: 'Components/Assets/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: {
    type: 'generic',
    title: 'Nothing Here',
    description: 'This space is waiting for you to add something.',
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    type: {
      control: 'select',
      options: VARIANTS,
      description: 'Illustration variant rendered for this empty state.',
    },
    title: {
      control: 'text',
      description: 'Headline shown under the illustration.',
    },
    description: {
      control: 'text',
      description: 'Supporting text shown under the title.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Subscriptions: Story = {
  args: {
    type: 'subscriptions',
    title: 'No Subscriptions',
    description: 'You have no active subscriptions.',
  },
};

export const SubscriptionsWithAction: Story = {
  args: {
    type: 'subscriptions',
    title: 'No Subscriptions',
    description: 'You have no active subscriptions.',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4">
      <EmptyState {...args} />
      <Button variant="outline" onClick={action('subscriptionsAction')}>Subscribe</Button>
    </div>
  ),
};

export const Plans: Story = {
  args: {
    type: 'plans',
    title: 'No Plans',
    description: 'Add a plan to start billing.',
  },
};

export const PlansWithAction: Story = {
  args: {
    type: 'plans',
    title: 'No Plans',
    description: 'Add a plan to start billing.',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4">
      <EmptyState {...args} />
      <Button variant="outline" onClick={action('plansAction')}>Create Plan</Button>
    </div>
  ),
};

export const Invoices: Story = {
  args: {
    type: 'invoices',
    title: 'No Invoices',
    description: 'You have not issued any invoices yet.',
  },
};

export const InvoicesWithAction: Story = {
  args: {
    type: 'invoices',
    title: 'No Invoices',
    description: 'You have not issued any invoices yet.',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4">
      <EmptyState {...args} />
      <Button variant="outline" onClick={action('invoicesAction')}>Issue Invoice</Button>
    </div>
  ),
};

export const Notifications: Story = {
  args: {
    type: 'notifications',
    title: 'No Notifications',
    description: 'You have no new notifications.',
  },
};

export const NotificationsWithAction: Story = {
  args: {
    type: 'notifications',
    title: 'No Notifications',
    description: 'You have no new notifications.',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4">
      <EmptyState {...args} />
      <Button variant="outline" onClick={action('notificationsAction')}>Enable Notifications</Button>
    </div>
  ),
};

export const Search: Story = {
  args: {
    type: 'search',
    title: 'No Results',
    description: 'We could not find anything matching your search.',
  },
};

export const SearchWithAction: Story = {
  args: {
    type: 'search',
    title: 'No Results',
    description: 'We could not find anything matching your search.',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4">
      <EmptyState {...args} />
      <Button variant="outline" onClick={action('searchAction')}>Try Again</Button>
    </div>
  ),
};

export const Generic: Story = {
  args: {
    type: 'generic',
    title: 'Nothing Here',
    description: 'This space is waiting for you to add something.',
  },
};

export const GenericWithAction: Story = {
  args: {
    type: 'generic',
    title: 'Nothing Here',
    description: 'This space is waiting for you to add something.',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4">
      <EmptyState {...args} />
      <Button variant="outline" onClick={action('genericAction')}>Add Item</Button>
    </div>
  ),
};
