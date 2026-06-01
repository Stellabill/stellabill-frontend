import { useNavigate } from 'react-router-dom';
import OnboardingShell from '../components/Onboarding/OnboardingShell';
import BusinessStep from '../components/Onboarding/steps/BusinessStep';

export default function OnboardingBusiness() {
  const navigate = useNavigate();

  const handleNext = (data: { businessName: string; website: string; logo: File | null }) => {
    sessionStorage.setItem(
      'onboardingBusiness',
      JSON.stringify({ businessName: data.businessName, website: data.website })
    );
    navigate('/onboarding/payout');
  };

  return (
    <OnboardingShell
      currentStep={1}
      completedSteps={[]}
      title="Tell us about your business"
      subtitle="Enter your company details so customers can recognize your brand."
    >
      <BusinessStep onNext={handleNext} />
    </OnboardingShell>
  );
}
