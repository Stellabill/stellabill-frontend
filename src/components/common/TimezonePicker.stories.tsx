import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import TimezonePicker from './TimezonePicker'

const meta: Meta<typeof TimezonePicker> = {
  title: 'Components/Common/TimezonePicker',
  component: TimezonePicker,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    helperText: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof TimezonePicker>

export const Default: Story = {
  render: (args) => {
    const [timezone, setTimezone] = useState('UTC')
    return <TimezonePicker {...args} value={timezone} onChange={setTimezone} />
  },
}

Default.args = {
  label: 'Organization timezone',
  helperText: 'Use the search field to find a timezone by city, abbreviation, or IANA name.',
  placeholder: 'Type a time zone name…',
}

export const Disabled: Story = {
  render: (args) => {
    const [timezone] = useState('America/New_York')
    return <TimezonePicker {...args} value={timezone} onChange={() => undefined} />
  },
}

Disabled.args = {
  label: 'Timezone',
  disabled: true,
}
