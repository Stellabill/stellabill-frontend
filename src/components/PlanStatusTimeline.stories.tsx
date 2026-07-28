import type { Meta, StoryObj } from '@storybook/react';
import PlanStatusTimeline, { TimelineEvent } from './PlanStatusTimeline';

const meta: Meta<typeof PlanStatusTimeline> = {
  title: 'Components/PlanStatusTimeline',
  component: PlanStatusTimeline,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlanStatusTimeline>;

const events: TimelineEvent[] = [
  {
    id: '1',
    type: 'Created',
    status: 'Subscription created',
    actor: 'Chukwuemeka',
    timestamp: 'Feb 10, 2026, 10:30 AM'
  },
  {
    id: '2',
    type: 'Activated',
    status: 'Plan activated',
    actor: 'System',
    timestamp: 'Feb 10, 2026, 10:31 AM'
  },
  {
    id: '3',
    type: 'Payment',
    status: 'Payment successful',
    actor: 'System',
    timestamp: 'Feb 15, 2026, 09:00 AM',
    details: '10 USDC - Period: Feb 15 - Mar 15'
  },
  {
    id: '4',
    type: 'Paused',
    status: 'Subscription paused',
    actor: 'Chukwuemeka',
    timestamp: 'Mar 01, 2026, 02:45 PM',
    details: 'User requested pause due to travel'
  },
  {
    id: '5',
    type: 'Resumed',
    status: 'Subscription resumed',
    actor: 'Chukwuemeka',
    timestamp: 'Mar 10, 2026, 11:20 AM'
  },
  {
    id: '6',
    type: 'Payment',
    status: 'Payment successful',
    actor: 'System',
    timestamp: 'Mar 15, 2026, 09:00 AM',
    details: '10 USDC - Period: Mar 15 - Apr 15'
  },
  {
    id: '7',
    type: 'Cancelled',
    status: 'Subscription cancelled',
    actor: 'Chukwuemeka',
    timestamp: 'Mar 20, 2026, 04:15 PM',
    details: 'End of contract'
  }
];

export const Default: Story = {
  args: {
    events,
  },
};
