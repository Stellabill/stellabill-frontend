import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import PricingModeInput from './PricingModeInput'

const meta: Meta<typeof PricingModeInput> = {
  title: 'Components/Common/PricingModeInput',
  component: PricingModeInput,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
  },
}

export default meta

type Story = StoryObj<typeof PricingModeInput>

export const Currency: Story = {
  args: {
    label: 'Price',
    value: '19.99',
    mode: 'currency',
    helperText: 'Enter a fixed amount in USDC. Use 0 for a free plan.',
    onChange: () => {},
    onModeChange: () => {},
  },
}

export const Percent: Story = {
  args: {
    label: 'Discount',
    value: '25',
    mode: 'percent',
    helperText: 'Enter a discount percentage between 0% and 100%.',
    onChange: () => {},
    onModeChange: () => {},
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState('10')
    const [mode, setMode] = useState<'currency' | 'percent'>('currency')

    return (
      <div style={{ maxWidth: '480px' }}>
        <PricingModeInput
          {...args}
          value={value}
          mode={mode}
          onChange={setValue}
          onModeChange={setMode}
        />
      </div>
    )
  },
  args: {
    label: 'Price',
    helperText: 'Switch between currency and percent without losing your current input.',
  },
}
