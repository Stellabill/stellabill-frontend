import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DangerZone, { DangerZoneItem } from './DangerZone';
import ConfirmDialog from './ConfirmDialog';

const meta: Meta<typeof DangerZone> = {
  title: 'Components/Common/DangerZone',
  component: DangerZone,
  tags: ['autodocs'],
  parameters: {
    a11y: { disable: false },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Heading displayed in the danger zone header.',
    },
    description: {
      control: 'text',
      description: 'Optional introductory text shown below the header.',
    },
    className: {
      control: 'text',
      description: 'Extra CSS class forwarded to the root element.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DangerZone>;

// ---------------------------------------------------------------------------
// Default – single action item, no confirmation dialog required
// ---------------------------------------------------------------------------

/**
 * The default state shows `DangerZone` with one `DangerZoneItem`. Clicking
 * the action button fires `onAction` immediately with no extra confirmation
 * step. Use the Controls panel to edit `title`, `description`, `actionLabel`
 * and toggle `disabled`.
 */
export const Default: Story = {
  args: {
    title: 'Danger Zone',
    description: 'Actions here are irreversible. Proceed with caution.',
  },
  render: (args) => (
    <div className="max-w-2xl">
      <DangerZone {...args}>
        <DangerZoneItem
          title="Delete account"
          description="Permanently removes your account and all associated data. This cannot be undone."
          actionLabel="Delete account"
          actionIcon={<Trash2 size={14} aria-hidden="true" />}
          onAction={() => {
            /* intentionally left empty for story preview */
          }}
        />
      </DangerZone>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Confirm-Required – action guarded by a ConfirmDialog with a confirmPhrase
// ---------------------------------------------------------------------------

function ConfirmRequiredStory() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleConfirm() {
    setLoading(true);
    // Simulate async operation
    setTimeout(() => {
      setLoading(false);
      setDialogOpen(false);
    }, 1500);
  }

  return (
    <div className="max-w-2xl">
      <DangerZone
        title="Danger Zone"
        description="These actions are permanent. You will be asked to confirm before anything is deleted."
      >
        <DangerZoneItem
          title="Delete workspace"
          description="Deletes the workspace and all its data including invoices, customers, and settings."
          actionLabel="Delete workspace"
          actionIcon={<Trash2 size={14} aria-hidden="true" />}
          onAction={() => setDialogOpen(true)}
        />
      </DangerZone>

      <ConfirmDialog
        isOpen={dialogOpen}
        title="Delete workspace"
        description="This action cannot be undone. All workspace data will be permanently erased."
        consequences={[
          'All invoices and billing history will be deleted',
          'All customer records will be removed',
          'API keys and integrations will stop working',
        ]}
        confirmLabel="Delete workspace"
        loadingLabel="Deleting…"
        isLoading={loading}
        confirmPhrase="delete my workspace"
        onConfirm={handleConfirm}
        onClose={() => !loading && setDialogOpen(false)}
      />
    </div>
  );
}

/**
 * The confirm-required state demonstrates the typical production usage: the
 * `onAction` callback opens a `ConfirmDialog` that asks the user to type a
 * phrase before the destructive action is enabled. This is the recommended
 * pattern for irreversible operations.
 */
export const ConfirmRequired: Story = {
  name: 'Confirm Required',
  parameters: {
    a11y: { disable: false },
  },
  render: () => <ConfirmRequiredStory />,
};

// ---------------------------------------------------------------------------
// Disabled – action button is visually muted and not clickable
// ---------------------------------------------------------------------------

/**
 * When `disabled` is set on a `DangerZoneItem` the action button is
 * unclickable and visually muted. This state is useful when a precondition
 * (e.g. pending background job) prevents the destructive action.
 */
export const Disabled: Story = {
  render: () => (
    <div className="max-w-2xl">
      <DangerZone
        title="Danger Zone"
        description="Some actions are currently unavailable."
      >
        <DangerZoneItem
          title="Delete account"
          description="Account deletion is locked while an active subscription is attached."
          actionLabel="Delete account"
          actionIcon={<Trash2 size={14} aria-hidden="true" />}
          disabled
          onAction={() => {
            /* disabled – never fires */
          }}
        />
      </DangerZone>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Multiple Items – shows how several items stack inside a single DangerZone
// ---------------------------------------------------------------------------

/**
 * Multiple `DangerZoneItem` children stack inside one `DangerZone` with a
 * divider between each row. Each item is an independent accessible group.
 */
export const MultipleItems: Story = {
  name: 'Multiple Items',
  render: () => (
    <div className="max-w-2xl">
      <DangerZone
        title="Danger Zone"
        description="All actions below are irreversible."
      >
        <DangerZoneItem
          title="Archive project"
          description="Hides the project from all views. It can be restored later."
          actionLabel="Archive"
          onAction={() => {}}
        />
        <DangerZoneItem
          title="Transfer ownership"
          description="Transfers full ownership of this project to another team member."
          actionLabel="Transfer"
          onAction={() => {}}
        />
        <DangerZoneItem
          title="Delete project"
          description="Permanently deletes the project and all its contents. Cannot be undone."
          actionLabel="Delete project"
          actionIcon={<Trash2 size={14} aria-hidden="true" />}
          onAction={() => {}}
        />
      </DangerZone>
    </div>
  ),
};
