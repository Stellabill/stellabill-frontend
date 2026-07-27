import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingShell from './Onboarding/OnboardingShell';
import './Onboarding/OnboardingShell.css';

export default function OnboardingReview() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const businessJson = sessionStorage.getItem('onboardingBusiness');
    if (businessJson) {
      try {
        const businessData = JSON.parse(businessJson) as {
          businessName?: string;
          website?: string;
          country?: string;
        };
        setBusinessName(businessData.businessName || '');
        setWebsite(businessData.website || '');
        setCountry(businessData.country || '');
      } catch {
        setBusinessName('');
        setWebsite('');
      }
    }

    const payout = sessionStorage.getItem('onboardingPayout');
    setPayoutAddress(payout || '');
  }, []);

  const onBack = () => {
    navigate('/onboarding/payout');
  };

  const handleComplete = async () => {
    if (!agreed) return;

    setLoading(true);
    await new Promise<void>((resolve) => {
      window.setTimeout(() => {
        resolve();
      }, 1000);
    });
    setLoading(false);
    navigate('/onboarding-success');
  };

  const truncateAddress = (address: string) => {
    if (!address) return 'No payout address provided';
    if (address.length <= 18) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const getCountryName = (code: string) => {
    try {
      return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) ?? code
    } catch {
      return code
    }
  }

  return (
    <OnboardingShell
      currentStep={3}
      completedSteps={[1, 2]}
      title="Review and confirm"
      subtitle="Verify your business and payout details before completing onboarding."
    >
      <div className="onboarding-field">
        <label className="onboarding-label">Business name</label>
        <div className="onboarding-readonly">{businessName || 'Not provided yet'}</div>
      </div>

      <div className="onboarding-field">
        <label className="onboarding-label">Website</label>
        <div className="onboarding-readonly">{website || 'No website provided'}</div>
      </div>

      <div className="onboarding-field">
        <label className="onboarding-label">Country</label>
        <div className="onboarding-readonly">{country ? getCountryName(country) : 'No country selected'}</div>
      </div>

      <div className="onboarding-field">
        <label className="onboarding-label">Payout address</label>
        <div className="onboarding-readonly">{truncateAddress(payoutAddress)}</div>
      </div>

      <div className="onboarding-checkbox-row">
        <input
          id="terms"
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <label htmlFor="terms" className="onboarding-checkbox-label">
          I agree to the{' '}
          <a href="/terms" target="_blank" rel="noreferrer" className="onboarding-link">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/merchant-agreement" target="_blank" rel="noreferrer" className="onboarding-link">
            Merchant Agreement
          </a>
        </label>
      </div>

      <div className="onboarding-actions">
        <button type="button" className="onboarding-btn onboarding-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="onboarding-btn onboarding-btn-primary"
          disabled={!agreed || loading}
          onClick={handleComplete}
        >
          {loading ? 'Completing...' : 'Complete setup'}
        </button>
      </div>
    </OnboardingShell>
  );
}
