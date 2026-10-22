import { useState } from 'react';
import { isValidEd25519PublicKey } from '../../../utils/stellarAddress';
import '../OnboardingShell.css';

interface PayoutStepProps {
  onBack?: () => void;
  onNext?: (walletAddress: string) => void;
}

export default function PayoutStep({ onBack, onNext }: PayoutStepProps) {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasBusinessData()) {
      navigate('/onboarding/business', {
        replace: true,
        state: { notice: 'Please complete the business step before adding payout details.' },
      });
    }
  }, [navigate]);

  const handleNext = () => {
    const normalized = walletAddress.trim().toUpperCase();
    if (!normalized) {
      setError('Stellar wallet address is required.');
      return;
    }
    if (normalized.startsWith('S')) {
      setError('Never paste your secret key. Enter your public Stellar address (starts with G).');
      return;
    }
    if (normalized.startsWith('M')) {
      setError('Muxed addresses (starting with M) are not supported. Enter your public Stellar address (starts with G).');
      return;
    }
    if (!isValidEd25519PublicKey(normalized)) {
      setError('Please enter a valid Stellar address (starts with G, 56 characters, valid checksum).');
      return;
    }
    setError('');
    onNext?.(normalized);
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
          aria-invalid={error ? 'true' : 'false'}
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
