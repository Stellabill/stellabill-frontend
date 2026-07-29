import type { Meta, StoryObj } from '@storybook/react'
import PhoneNumberInput from './PhoneNumberInput'

const meta: Meta<typeof PhoneNumberInput> = {
  title: 'Components/Common/PhoneNumberInput',
  component: PhoneNumberInput,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    required: { control: 'boolean' },
    showValidation: { control: 'boolean' },
  },
}

export default meta

type Story = StoryObj<typeof PhoneNumberInput>

export const Default: Story = {
  args: {
    label: 'Business phone number',
    required: true,
  },
}

export const WithInvalidNumber: Story = {
  args: {
    label: 'Business phone number',
    required: true,
    showValidation: true,
    externalError: 'Enter a 10-digit United States phone number.',
  },
}
