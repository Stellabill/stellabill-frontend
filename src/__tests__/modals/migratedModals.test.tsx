import { vi } from 'vitest';
import { describeModalAccessibility } from './modalA11yTestHelper';
import WalletConnectModal from '../../components/WalletConnectModal';
import CancelSubscriptionModal from '../../components/CancelSubscriptionModal';
import PauseSubscriptionModal from '../../components/PauseSubscriptionModal';
import DowngradeConfirmModal from '../../components/DowngradeConfirmModal';
import RedeemConfirmModal from '../../components/RedeemConfirmModal';
import ReactivationModal from '../../components/ReactivationModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

describeModalAccessibility({
  name: 'WalletConnectModal',
  renderModal: ({ isOpen, onClose }) => (
    <WalletConnectModal isOpen={isOpen} onClose={onClose} />
  ),
});

describeModalAccessibility({
  name: 'CancelSubscriptionModal',
  renderModal: ({ isOpen, onClose }) => (
    <CancelSubscriptionModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={vi.fn()}
      balance="25.00"
      endDate="May 1, 2026"
    />
  ),
});

describeModalAccessibility({
  name: 'PauseSubscriptionModal',
  renderModal: ({ isOpen, onClose }) => (
    <PauseSubscriptionModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={vi.fn()}
    />
  ),
});

describeModalAccessibility({
  name: 'DowngradeConfirmModal',
  renderModal: ({ isOpen, onClose }) => (
    <DowngradeConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={vi.fn()}
      currentPlanName="Pro"
      currentPlanPrice="50 USDC / mo"
      newPlanName="Basic"
      newPlanPrice="20 USDC / mo"
      lostFeatures={[{ id: 'f1', label: 'Priority support' }]}
    />
  ),
});

describeModalAccessibility({
  name: 'RedeemConfirmModal',
  renderModal: ({ isOpen, onClose }) => (
    <RedeemConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      giftCode="GIFT-1234"
      onRedemptionComplete={vi.fn()}
      giftDetails={{
        planName: 'Pro Monthly',
        merchant: 'StellarBill',
        duration: 3,
        value: '150',
        currency: 'USDC',
        expiresOn: '2027-01-01',
        gifterName: 'Alice',
      }}
    />
  ),
});

describeModalAccessibility({
  name: 'ReactivationModal',
  renderModal: ({ isOpen, onClose }) => (
    <ReactivationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={vi.fn()}
      plan={{ name: 'Pro Monthly', interval: 'Monthly', price: '50 USDC' }}
    />
  ),
});

describeModalAccessibility({
  name: 'ConfirmDialog',
  role: 'alertdialog',
  renderModal: ({ isOpen, onClose }) => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={vi.fn()}
      title="Delete item?"
      description="This action cannot be undone."
    />
  ),
});
