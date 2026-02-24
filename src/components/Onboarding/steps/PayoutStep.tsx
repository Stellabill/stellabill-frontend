import { useState } from 'react';
import './PayoutStep.css';

interface PayoutStepProps {
  onBack?: () => void;
  onNext?: (walletAddress: string) => void;
}

const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

export default function PayoutStep({ onBack, onNext }: PayoutStepProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!walletAddress.trim()) {
      setError('Stellar wallet address is required.');
      return;
    }
    if (!STELLAR_ADDRESS_REGEX.test(walletAddress.trim())) {
      setError('Please enter a valid Stellar address (starts with G, 56 characters).');
      return;
    }
    setError('');
    onNext?.(walletAddress.trim());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
    if (error) setError('');
  };

  return (
    <div className="payout-wrapper">
      <div className="payout-step">
        <div className="payout-inner">
          <h1 className="payout-title">Where should we send your earnings?</h1>
          <p className="payout-subtitle">
            Configure your payout wallet to receive subscription payments
          </p>

          <div className="payout-field">
            <label htmlFor="stellar-address" className="payout-label">
              Stellar wallet address <span aria-hidden="true">*</span>
            </label>
            <input
              id="stellar-address"
              type="text"
              className={`payout-input${error ? ' payout-input--error' : ''}`}
              value={walletAddress}
              onChange={handleChange}
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              aria-required="true"
              aria-describedby={error ? 'stellar-error' : 'stellar-helper'}
              autoComplete="off"
              spellCheck={false}
            />
            {error ? (
              <p id="stellar-error" className="payout-error" role="alert">
                {error}
              </p>
            ) : (
              <p id="stellar-helper" className="payout-helper">
                This address will receive USDC from subscription charges.
              </p>
            )}
          </div>

          <div className="payout-important-box" role="note">
            <span className="payout-info-icon" aria-hidden="true">i</span>
            <div className="payout-important-text">
              <span className="payout-important-label">Important</span>
              <span className="payout-important-body">
                Make sure this is a valid Stellar address that you control. You cannot
                change this address later without contacting support.
              </span>
            </div>
          </div>

          <div className="payout-actions">
            <button type="button" className="payout-btn-back" onClick={onBack}>
              Back
            </button>
            <button type="button" className="payout-btn-next" onClick={handleNext}>
              Next →
            </button>
          </div>
        </div>
      </div>

      <footer className="payout-footer">
        Need help? Contact us at <a href="mailto:support@stellabill.com" className="payout-footer-link">support@stellabill.com</a>
      </footer>
    </div>
  );
}
