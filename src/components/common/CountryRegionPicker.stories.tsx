import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import CountryRegionPicker from './CountryRegionPicker'

const meta: Meta<typeof CountryRegionPicker> = {
  title: 'Components/Common/CountryRegionPicker',
  component: CountryRegionPicker,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'Selected ISO 3166-1 alpha-2 country code',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the picker interaction',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the picker is closed',
    },
  },
}

export default meta

type Story = StoryObj<typeof CountryRegionPicker>

function CountryRegionPickerStory({ disabled = false, placeholder = 'Select a country' }: { disabled?: boolean; placeholder?: string }) {
  const [value, setValue] = useState('US')

  return (
    <div className="max-w-md">
      <CountryRegionPicker
        value={value}
        onChange={setValue}
        disabled={disabled}
        placeholder={placeholder}
        helperText="Choose the country where your business is registered."
      />
      <p className="mt-4 text-sm text-slate-400">Selected country code: {value}</p>
    </div>
  )
}

export const Default: Story = {
  render: () => <CountryRegionPickerStory />,
}

export const Disabled: Story = {
  render: () => <CountryRegionPickerStory disabled />,
}
