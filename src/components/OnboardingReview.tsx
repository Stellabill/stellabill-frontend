import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingShell from './Onboarding/OnboardingShell';
import { ReviewStep } from './common/ReviewStep';
import './Onboarding/OnboardingShell.css';

export default function OnboardingReview() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
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
        setCountry('');
      }
    }

    const payout = sessionStorage.getItem('onboardingPayout');
    setPayoutAddress(payout || '');
  }, []);

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
    setLoading(true);
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 1000);
    });
    setLoading(false);
    navigate('/onboarding-success');
  };

  const sections = [
    { id: 'business', label: 'Business Information', value: `${businessName || 'Not provided'} — ${website || 'No website'} — ${countryLabel}`, editLink: '/onboarding/business' },
    { id: 'payout', label: 'Payout Address', value: truncateAddress(payoutAddress), editLink: '/onboarding/payout' },
  ];

  return (
    <OnboardingShell
      currentStep={3}
      completedSteps={[1, 2]}
      title="Review and confirm"
      subtitle="Verify your business and payout details before completing onboarding."
    >
      <ReviewStep
        title=""
        sections={sections}
        onSectionEdit={handleSectionEdit}
        primaryAction={{
          label: loading ? 'Completing...' : 'Complete setup',
          onClick: handleComplete,
          disabled: loading,
          loading,
        }}
        secondaryAction={{
          label: 'Back',
          onClick: () => navigate('/onboarding/payout'),
        }}
        footerHelp={{
          label: 'Questions? Contact support',
          onClick: () => window.open('/support', '_blank'),
        }}
      />
    </OnboardingShell>
  );
}
