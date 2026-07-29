import type { Meta, StoryObj } from '@storybook/react'
import { FieldHelpPopover, FieldLabelWithHelp } from './FieldHelpPopover'

const meta: Meta<typeof FieldHelpPopover> = {
  title: 'Components/Common/FieldHelpPopover',
  component: FieldHelpPopover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Inline field help pattern for secondary form guidance. Opens from an info icon, traps focus while open, and dismisses with Escape, outside click, or the close action.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof FieldHelpPopover>

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 360, padding: 24, background: '#00060f' }}>
      <FieldLabelWithHelp
        htmlFor="billing-cycle-story"
        helpTitle="Billing cycle"
        help={<p>Sets the default renewal cadence for this account.</p>}
        style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}
      >
        Billing Cycle
      </FieldLabelWithHelp>
      <select id="billing-cycle-story" style={{ width: '100%', padding: 12 }}>
        <option>Monthly</option>
        <option>Yearly</option>
      </select>
    </div>
  ),
}

export const ViewportEdge: Story = {
  render: () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', width: 360, padding: 24, background: '#00060f' }}>
      <FieldHelpPopover title="Tax ID" align="end">
        <p>Add a business tax identifier when it needs to appear on invoices.</p>
      </FieldHelpPopover>
    </div>
  ),
}

export const ErrorAdjacent: Story = {
  render: () => (
    <div style={{ maxWidth: 360, padding: 24, background: '#00060f' }}>
      <FieldLabelWithHelp
        htmlFor="plan-price-story"
        required
        helpTitle="Plan price"
        help={<p>Use 0 for a free plan. Percent plans accept values from 0 to 100.</p>}
        style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600, marginBottom: 8 }}
      >
        Price
      </FieldLabelWithHelp>
      <input
        id="plan-price-story"
        aria-invalid="true"
        aria-describedby="plan-price-story-error"
        defaultValue="-1"
        style={{ width: '100%', padding: 12 }}
      />
      <p id="plan-price-story-error" style={{ margin: '6px 0 0', color: '#f87171', fontSize: 12 }}>
        Price must be a valid number greater than or equal to 0.
      </p>
    </div>
  ),
}
