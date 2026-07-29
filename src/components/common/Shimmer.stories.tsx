import type { Meta, StoryObj } from '@storybook/react';
import Shimmer from './Shimmer';

const meta: Meta<typeof Shimmer> = {
  title: 'Components/Common/Shimmer',
  component: Shimmer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Token-driven loading placeholder. Sweeps a `--skeleton-base` → `--skeleton-highlight` gradient using ' +
          '`--shimmer-duration` / `--shimmer-timing`. Direction follows the ancestor writing direction unless ' +
          'overridden, and the sweep is replaced by a slow opacity pulse under `prefers-reduced-motion: reduce`.',
      },
    },
  },
  argTypes: {
    shape: {
      control: 'select',
      options: ['block', 'circle', 'text'],
    },
    direction: {
      control: 'select',
      options: [undefined, 'ltr', 'rtl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Shimmer>;

export const Block: Story = {
  args: {
    width: '12rem',
    height: '2rem',
  },
};

export const TextLine: Story = {
  args: {
    shape: 'text',
    width: '16rem',
    height: '1rem',
  },
};

export const Circle: Story = {
  args: {
    shape: 'circle',
    width: '2.5rem',
    height: '2.5rem',
  },
};

export const CustomDuration: Story = {
  name: 'Custom speed',
  args: {
    width: '12rem',
    height: '2rem',
    duration: '0.7s',
  },
};

export const ForcedRtl: Story = {
  name: 'Direction override (RTL)',
  args: {
    width: '12rem',
    height: '2rem',
    direction: 'rtl',
  },
};

export const StaggeredGroup: Story = {
  name: 'Staggered group (card placeholder)',
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.5rem',
        maxWidth: '16rem',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        background: 'var(--color-surface-card)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Shimmer shape="text" width="6rem" height="1rem" />
        <Shimmer shape="block" width="2rem" height="2rem" radius="var(--radius-lg)" />
      </div>
      <Shimmer shape="text" width="8rem" height="2rem" delay="0.1s" />
      <Shimmer shape="text" width="5rem" height="1rem" delay="0.2s" />
    </div>
  ),
};

export const AnnouncedStandalone: Story = {
  name: 'Standalone with accessible label',
  args: {
    width: '100%',
    height: '20rem',
    'aria-label': 'Loading revenue chart',
  },
};
