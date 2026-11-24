import type { Meta, StoryObj } from '@storybook/react-vite';
import StepIndicator from './StepIndicator';

const DEFAULT_STEPS = [
  { id: 1, label: 'Business' },
  { id: 2, label: 'Payout' },
  { id: 3, label: 'Review' },
];

const meta: Meta<typeof StepIndicator> = {
  title: 'Components/StepIndicator',
  component: StepIndicator,
  tags: ['autodocs'],
  argTypes: {
    currentStep: {
      control: { type: 'number', min: 1, max: 5 },
      description: 'The ID of the currently active step',
    },
    completedSteps: {
      control: 'object',
      description: 'Array of step IDs that have been completed',
    },
    steps: {
      control: 'object',
      description: 'Array of step definitions to display in the indicator',
    },
  },
  args: {
    steps: DEFAULT_STEPS,
  },
};

export default meta;
type Story = StoryObj<typeof StepIndicator>;

export const FirstStep: Story = {
  args: {
    currentStep: 1,
    completedSteps: [],
    steps: DEFAULT_STEPS,
  },
};

export const MiddleStep: Story = {
  args: {
    currentStep: 2,
    completedSteps: [1],
    steps: DEFAULT_STEPS,
  },
};

export const LastStep: Story = {
  args: {
    currentStep: 3,
    completedSteps: [1, 2],
    steps: DEFAULT_STEPS,
  },
};

export const Completed: Story = {
  args: {
    currentStep: 4,
    completedSteps: [1, 2, 3],
    steps: DEFAULT_STEPS,
  },
};
