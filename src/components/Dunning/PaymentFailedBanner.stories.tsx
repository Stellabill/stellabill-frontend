import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fireEvent, fn, waitFor, within } from 'storybook/test';
import PaymentFailedBanner from './PaymentFailedBanner';

type RetryAttempt = ComponentProps<typeof PaymentFailedBanner>['retrySchedule'][number];

const attempted: RetryAttempt = {
  id: 'r1',
  when: 'Nov 20 — Attempted',
  scheduledAt: '2026-11-20T09:00:00Z',
  status: 'past',
  method: 'card',
  successProbability: 0.72,
};

const firstRetry: RetryAttempt = {
  id: 'r2',
  when: 'Nov 24 — Next retry',
  scheduledAt: '2026-11-24T02:00:00Z',
  status: 'upcoming',
  method: 'card',
  successProbability: 0.61,
};

const finalRetry: RetryAttempt = {
  id: 'r3',
  when: 'Nov 28 — Final retry',
  scheduledAt: '2026-11-28T02:00:00Z',
  status: 'upcoming',
  method: 'usdc',
  successProbability: 0.48,
};

const meta: Meta<typeof PaymentFailedBanner> = {
  title: 'Components/Dunning/PaymentFailedBanner',
  component: PaymentFailedBanner,
  tags: ['autodocs'],
  args: {
    subscriptionId: 'sub_123',
    failedAttempts: 1,
    retrySchedule: [attempted, firstRetry, finalRetry],
    onFixPayment: fn(),
  },
  argTypes: {
    subscriptionId: {
      control: 'text',
      description: 'Subscription whose payment method should be fixed. Drives the CTA fallback href.',
    },
    failedAttempts: {
      control: { type: 'number', min: 0 },
      description: 'Number of failed payment attempts. 0 hides the banner; higher values escalate the dunning tier.',
    },
    retrySchedule: {
      control: 'object',
      description:
        'Retry attempts rendered in the timeline (id, when, status, optional scheduledAt/method/successProbability).',
    },
    onFixPayment: {
      action: 'fix payment method',
      description: 'Called when the user chooses "Fix payment method" instead of following the link.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentFailedBanner>;

async function openMethodPicker(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await fireEvent.click(canvas.getByRole('button', { name: /retry now/i }));
  return canvas;
}

export const FirstTier: Story = {
  parameters: {
    docs: {
      description: {
        story: 'First dunning tier: one failed attempt, with two automatic retries still upcoming.',
      },
    },
  },
};

export const SecondTier: Story = {
  args: {
    failedAttempts: 2,
    retrySchedule: [
      attempted,
      { ...firstRetry, when: 'Nov 24 — Failed', status: 'failed' },
      finalRetry,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Second dunning tier: a retry has also failed, leaving only the final retry scheduled.',
      },
    },
  },
};

export const FinalTier: Story = {
  args: {
    failedAttempts: 3,
    retrySchedule: [
      { ...attempted, status: 'failed' },
      { ...firstRetry, when: 'Nov 24 — Failed', status: 'failed' },
      { ...finalRetry, when: 'Nov 28 — Final retry failed', status: 'failed' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Final dunning tier: every retry has failed, so the timeline shows the "All retries exhausted" state.',
      },
    },
  },
};

export const Cooldown: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Cooldown state: a retry was rate-limited and the CTA counts down before another attempt is allowed. Reached by retrying with a forced failure.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await openMethodPicker(canvasElement);

    const originalRandom = Math.random;
    Math.random = () => 0; // force the simulated retry to fail
    try {
      await fireEvent.click(canvas.getByRole('button', { name: /credit card/i }));
    } finally {
      Math.random = originalRandom;
    }

    await waitFor(
      () => {
        expect(canvas.getByRole('button', { name: /retry in \d+s/i })).toBeDisabled();
      },
      { timeout: 5000 },
    );
  },
};

export const Retrying: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Retrying state: a retry is in flight and the CTA is disabled. Reached by choosing a payment method from the retry picker.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await openMethodPicker(canvasElement);

    // The component resolves the simulated retry after 2s; suppress that timer so
    // the story stays on the deterministic "Retrying…" state for the a11y panel.
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (() => 0) as unknown as typeof window.setTimeout;
    try {
      await fireEvent.click(canvas.getByRole('button', { name: /credit card/i }));
    } finally {
      window.setTimeout = originalSetTimeout;
    }

    await expect(canvas.getByRole('button', { name: /retrying/i })).toBeDisabled();
  },
};
