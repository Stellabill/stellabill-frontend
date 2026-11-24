import type { Meta, StoryObj } from '@storybook/react';
import SessionTimeoutModal from './SessionTimeoutModal';

const meta: Meta<typeof SessionTimeoutModal> = {
  title: 'Components/SessionTimeoutModal',
  component: SessionTimeoutModal,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is visible',
    },
    remainingSeconds: {
      control: { type: 'number', min: 0, max: 120, step: 1 },
      description: 'Seconds remaining before the session expires (0–120)',
    },
    onStaySignedIn: {
      action: 'onStaySignedIn',
      description: 'Called when the user clicks "Stay signed in"',
    },
    onLogout: {
      action: 'onLogout',
      description: 'Called when the user clicks "Log out now" or presses Escape',
    },
  },
  args: {
    onStaySignedIn: () => {},
    onLogout: () => {},
  },
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof SessionTimeoutModal>;

/**
 * Active warning: 45 seconds remain on the countdown ring.
 * The progress arc, animated timer, and both action buttons are all visible.
 */
export const WarningCountdown: Story = {
  args: {
    isOpen: true,
    remainingSeconds: 45,
  },
  parameters: {
    a11y: { config: {} },
  },
};

/**
 * Expired state: remainingSeconds is 0.
 * The ring is fully depleted and the countdown reads "0 seconds".
 */
export const Expired: Story = {
  args: {
    isOpen: true,
    remainingSeconds: 0,
  },
  parameters: {
    a11y: { config: {} },
  },
};

/**
 * Modal is closed — renders nothing.
 * Verifies the component returns null when isOpen is false.
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    remainingSeconds: 60,
  },
};
