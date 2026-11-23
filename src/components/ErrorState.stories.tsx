import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import ErrorState from './ErrorState';

const meta: Meta<typeof ErrorState> = {
  title: 'Components/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <>
        <style>{'.details-toggle { color: #94a3b8; }'}</style>
        <Story />
      </>
    ),
  ],
  argTypes: {
    title: {
      control: 'text',
      description:
        'Heading shown above the message. Defaults to "Something went wrong" for the error variant.',
    },
    message: {
      control: 'text',
      description: 'Primary error message shown to the user.',
    },
    technicalDetails: {
      control: 'text',
      description:
        'Optional diagnostics revealed by the expandable "Technical Details" section.',
    },
    onRetry: {
      control: false,
      description:
        'Invoked when the user presses "Try Again". The button is hidden when omitted.',
      table: { category: 'Actions' },
    },
    isRetrying: {
      control: 'boolean',
      description:
        'Disables the retry button and shows the in-progress "Retrying..." state.',
    },
    type: {
      control: 'select',
      options: ['error', 'offline'],
      description:
        'Visual variant. "offline" renders the dedicated network/offline icon with fixed connectivity copy; "error" covers not-found and generic failures.',
      table: {
        defaultValue: { summary: 'error' },
      },
    },
  },
  args: {
    onRetry: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Network: Story = {
  args: {
    type: 'offline',
    title: 'No internet connection',
    message: 'Please check your network settings and try again.',
    technicalDetails:
      'TypeError: Failed to fetch\n    at fetchSubscriptions (src/api/subscriptions.ts:84:11)\n    at async Subscriptions (src/pages/Subscriptions.tsx:142:5)',
    isRetrying: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Network connectivity or timeout failure. The `offline` type renders the dedicated wifi-off icon and fixed connectivity copy, while retry and technical details remain available.',
      },
    },
  },
};

export const NotFound: Story = {
  args: {
    type: 'error',
    title: 'Not found',
    message:
      "We couldn't find the plan you're looking for. It may have been moved or deleted.",
    technicalDetails:
      'Request failed with status 404 Not Found\nGET /api/plans/plan_8f2c... -> 404',
    isRetrying: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The requested resource is missing (404). Retry lets the user re-request the resource after it has been restored or re-linked.',
      },
    },
  },
};

export const Generic: Story = {
  args: {
    type: 'error',
    title: 'Something went wrong',
    message:
      'An unexpected error occurred while loading this page. Please try again.',
    technicalDetails:
      'Error: Unexpected response shape\n    at normalizePlan (src/api/plans.ts:57:13)\n    at async fetchPlans (src/api/plans.ts:96:20)',
    isRetrying: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fallback for unexpected failures. Includes optional technical details and a retry affordance so the user can recover without leaving the page.',
      },
    },
  },
};
