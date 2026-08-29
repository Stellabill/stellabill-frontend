import type { Meta, StoryObj } from '@storybook/react';
import HelpHint from '../components/help/HelpHint';
import { GLOSSARY } from '../components/help/glossary';

const meta: Meta<typeof HelpHint> = {
  title: 'Components/HelpHint',
  component: HelpHint,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Accessible contextual help trigger. A discreet `?` button opens a popover with a title, definition, optional worked example, and an optional "Learn more" link. Uses a polite ARIA pattern (`aria-describedby`), never steals focus, and supports hover, focus, keyboard (Escape), and outside-click dismissal.',
      },
    },
  },
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
    },
    termId: {
      control: { type: 'select' },
      options: GLOSSARY.map((t) => t.id),
    },
    openDelayMs: { control: { type: 'number' } },
    closeDelayMs: { control: { type: 'number' } },
  },
};

export default meta;
type Story = StoryObj<typeof HelpHint>;

export const Default: Story = {
  args: {
    termId: 'mrr',
  },
};

export const CustomContent: Story = {
  name: 'Custom content (no glossary)',
  args: {
    title: 'Revenue Growth',
    definition:
      'Total billed revenue per month across all active subscriptions.',
    example:
      'A spike in February often reflects annual renewals rather than new customer growth.',
    learnMoreUrl: 'https://docs.stellarbill.example/reports/revenue-growth',
  },
};

export const DefinitionOnly: Story = {
  name: 'Definition only',
  args: {
    title: 'Active Subscriptions',
    definition:
      'Total number of currently active paid subscriptions.',
  },
};

export const AllPlacements: Story = {
  name: 'Placements',
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '6rem',
        padding: '4rem 2rem',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <span>
          Bottom <HelpHint termId="proration" />
        </span>
        <span>
          Top <HelpHint termId="dunning" placement="top" />
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem' }}>
        <span>
          Right <HelpHint termId="churn" placement="right" />
        </span>
        <span>
          Left <HelpHint termId="seat" placement="left" />
        </span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Popover placement variants relative to the trigger.',
      },
    },
  },
};

export const Glossary: Story = {
  name: 'Starter glossary',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '30rem' }}>
      {GLOSSARY.map((term) => (
        <span key={term.id}>
          {term.term} <HelpHint termId={term.id} />
        </span>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The starter glossary with 12 common billing terms (MRR, proration, dunning, churn, and more).',
      },
    },
  },
};
