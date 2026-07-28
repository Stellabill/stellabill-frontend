import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import WalletTransactionFilterPanel from '../components/WalletTransactionFilterPanel';
import { WalletTransaction } from '../types/walletTransaction';

const mockTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'charge_succeeded',
    details: 'Monthly Pro Plan - Stellar Cloud Services',
    counterparty: 'GB7B...K92L (Stellar Cloud)',
    timestamp: '2026-07-28T08:30:00Z',
    amount: 150,
  },
  {
    id: 'tx-2',
    type: 'new_subscription',
    details: 'Created subscription for News API Pro',
    counterparty: 'GC3X...M81P (News Corp)',
    timestamp: '2026-07-27T14:15:00Z',
    amount: 45,
  },
  {
    id: 'tx-3',
    type: 'subscription_paused',
    details: 'Paused Dev Infrastructure Subscription',
    counterparty: 'GD9A...P44Q (Dev Infra Inc)',
    timestamp: '2026-07-20T10:00:00Z',
    amount: 200,
  },
  {
    id: 'tx-4',
    type: 'subscription_resumed',
    details: 'Resumed Vault Backup Storage',
    counterparty: 'GA5C...W19K (Vault Storage)',
    timestamp: '2026-07-10T11:20:00Z',
    amount: 80,
  },
  {
    id: 'tx-5',
    type: 'subscription_cancelled',
    details: 'Cancelled Legacy Data Stream',
    counterparty: 'GE1Z...L55R (Data Feeds)',
    timestamp: '2026-06-30T09:00:00Z',
    amount: 120,
  },
];

const meta: Meta<typeof WalletTransactionFilterPanel> = {
  title: 'Components/WalletTransactionFilterPanel',
  component: WalletTransactionFilterPanel,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof WalletTransactionFilterPanel>;

export const Default: Story = {
  args: {
    transactions: mockTransactions,
  },
};

export const EmptyTransactions: Story = {
  args: {
    transactions: [],
  },
};
