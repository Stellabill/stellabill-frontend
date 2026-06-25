import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const meta: Meta<typeof Modal> = {
  title: 'Components/Common/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Example Modal',
    description: 'This is a description of what this modal does.',
    children: (
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Modal content goes here. You can put any React components inside.
        </p>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost">Cancel</Button>
        <Button>Confirm</Button>
      </>
    ),
  },
};

export const Interactive: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Unsaved Changes"
          description="You have unsaved changes. Are you sure you want to leave?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Stay</Button>
              <Button variant="error" onClick={() => setIsOpen(false)}>Leave Page</Button>
            </>
          }
        >
          <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle className="text-red-400 shrink-0" size={20} />
            <p className="text-sm text-red-200">
              Any progress you've made will be lost forever. This action cannot be undone.
            </p>
          </div>
        </Modal>
      </>
    );
  },
};

export const Success: Story = {
  args: {
    isOpen: true,
    title: 'Payment Successful',
    children: (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle className="text-green-400" size={32} />
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-medium">Your plan has been created</p>
          <p className="text-sm text-slate-400">
            You can now start inviting customers to subscribe to this plan.
          </p>
        </div>
      </div>
    ),
    footer: (
      <Button className="w-full" onClick={() => {}}>Done</Button>
    ),
    maxWidth: 'sm',
  },
};
