import { useState } from 'react';
import '../OnboardingShell.css';

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
    <>
      <div className="onboarding-field">
        <label htmlFor="stellar-address" className="onboarding-label">
          Stellar wallet address <span aria-hidden="true">*</span>
        </label>
        <input
          id="stellar-address"
          type="text"
          className={`onboarding-input${error ? ' onboarding-input--error' : ''}`}
          value={walletAddress}
          onChange={handleChange}
          placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          aria-required="true"
          aria-describedby={error ? 'stellar-error' : 'stellar-helper'}
          autoComplete="off"
          spellCheck={false}
        />
        {error ? (
          <p id="stellar-error" className="onboarding-error" role="alert">
            {error}
          </p>
        ) : (
          <p id="stellar-helper" className="onboarding-helper">
            This address will receive USDC from subscription charges.
          </p>
        )}
      </div>

      <div className="onboarding-field onboarding-note" role="note">
        <strong className="onboarding-label">Important</strong>
        <p className="onboarding-helper">
          Make sure this is a valid Stellar address that you control. You cannot change this address later without contacting support.
        </p>
      </div>

      <div className="onboarding-actions">
        <button type="button" className="onboarding-btn onboarding-btn-secondary" onClick={() => onBack?.()}>
          Back
        </button>
        <button type="button" className="onboarding-btn onboarding-btn-primary" onClick={handleNext}>
          Next →
        </button>
      </div>
    </>
  );
}
