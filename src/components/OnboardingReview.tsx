import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingShell from './Onboarding/OnboardingShell';
import { ReviewStep } from './common/ReviewStep';
import { openExternal } from '../utils/openExternal';
import { SUPPORT_URL } from '../config/links';
import './Onboarding/OnboardingShell.css';

export default function OnboardingReview() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const businessJson = sessionStorage.getItem('onboardingBusiness');
    let businessData: {
      businessName?: string;
      website?: string;
      country?: string;
    } | null = null;
    if (businessJson) {
      try {
        businessData = JSON.parse(businessJson);
      } catch {
        businessData = null;
      }
    }

    const businessValid = !!(
      businessData &&
      typeof businessData.businessName === 'string' &&
      businessData.businessName.trim() !== '' &&
      typeof businessData.country === 'string' &&
      businessData.country.trim() !== ''
    );

    if (!businessValid) {
      navigate('/onboarding/business', {
        replace: true,
        state: { notice: 'Please complete your business information before reviewing.', noticeType: 'info' },
      });
      return;
    }

    const payout = sessionStorage.getItem('onboardingPayout');
    if (!isValidPayoutAddress(payout)) {
      navigate('/onboarding/payout', {
        replace: true,
        state: { notice: 'Please add a valid payout address before reviewing.', noticeType: 'info' },
      });
      return;
    }

    setBusinessName(businessData!.businessName || '');
    setWebsite(businessData!.website || '');
    setCountry(businessData!.country || '');
    setPayoutAddress(payout || '');
    setReady(true);
  }, [navigate]);

  const displayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames('en', { type: 'region' });
    } catch {
      return undefined;
    }
  }, []);

  const countryLabel = useMemo(
    () => (country ? displayNames?.of(country) ?? country : 'No country selected'),
    [country, displayNames]
  );

  const truncateAddress = (address: string) => {
    if (!address) return 'No payout address provided';
    if (address.length <= 18) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const handleSectionEdit = (sectionId: string) => {
    if (sectionId === 'business') navigate('/onboarding/business');
    else if (sectionId === 'payout') navigate('/onboarding/payout');
  };

  const handleComplete = async () => {
    if (!ready || loading) return;
    setErrorMessage('');
    setLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          // Stubbed submit: fails only when explicitly simulated via sessionStorage.
          if (sessionStorage.getItem('onboardingSubmitFail') === '1') {
            reject(new Error('Submit failed'));
            return;
          }
          resolve();
        }, 1000);
      });
      sessionStorage.removeItem('onboardingBusiness');
      sessionStorage.removeItem('onboardingPayout');
      navigate('/onboarding-success');
    } catch {
      setErrorMessage('Something went wrong while completing setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'business', label: 'Business Information', value: `${businessName || 'Not provided'} — ${website || 'No website'} — ${countryLabel}`, editLink: '/onboarding/business' },
    { id: 'payout', label: 'Payout Address', value: truncateAddress(payoutAddress), editLink: '/onboarding/payout' },
  ];

  const canComplete = ready && !!loading ? false : ready;

  return (
    <OnboardingShell
      currentStep={3}
      completedSteps={[1, 2]}
      title="Review and confirm"
      subtitle="Verify your business and payout details before completing onboarding."
    >
      {errorMessage && (
        <p className="onboarding-error" role="alert">
          {errorMessage}
        </p>
      )}
      <ReviewStep
        title=""
        sections={sections}
        onSectionEdit={handleSectionEdit}
        primaryAction={
          {
            label: loading ? 'Completing...' : 'Complete setup',
            onClick: handleComplete,
            disabled: !canComplete || loading,
            loading,
          }
        }
        secondaryAction={{
          label: 'Back',
          onClick: () => navigate('/onboarding/payout'),
        }}
        footerHelp={{
          label: 'Questions? Contact support',
          onClick: () => openExternal(SUPPORT_URL),
        }}
      />
    </OnboardingShell>
  );
}
