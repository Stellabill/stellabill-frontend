import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import WalletPill from './WalletPill';

const meta: Meta<typeof WalletPill> = {
  title: 'Components/WalletPill',
  component: WalletPill,
  tags: ['autodocs'],
  args: {
    address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    onDisconnect: fn(),
    network: 'Testnet',
    expectedNetwork: 'Testnet',
  },
  argTypes: {
    address: {
      control: 'text',
      description: 'The full Stellar address held by the connected wallet.',
    },
    onDisconnect: {
      action: 'disconnected',
      description: 'Called when the user chooses Disconnect from the wallet dropdown.',
    },
    network: {
      control: 'select',
      options: ['Testnet', 'Mainnet'],
      description: 'The network the connected wallet is currently on.',
    },
    expectedNetwork: {
      control: 'select',
      options: ['Testnet', 'Mainnet'],
      description: 'The network the app expects; a mismatch renders the "Wrong network" badge.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof WalletPill>;

export const Connected: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A connected wallet on the expected network, with the address truncated to first-4 ... last-4.',
      },
    },
  },
};

export const LongAddressTruncation: Story = {
  args: {
    address: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890XYZ9',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A long Stellar address is truncated to its first four and last four characters (GABC...XYZ9) in the pill, while the dropdown shows the full address.',
      },
    },
  },
};

export const Disconnected: Story = {
  args: {
    address: '',
    network: 'Testnet',
    expectedNetwork: 'Testnet',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The disconnected pill: no wallet address is shown, only the network indicator and dropdown affordance.',
      },
    },
  },
};
