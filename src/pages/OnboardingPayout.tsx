import { useNavigate } from 'react-router-dom';
import OnboardingShell from '../components/Onboarding/OnboardingShell';
import PayoutStep from '../components/Onboarding/steps/PayoutStep';

export default function OnboardingPayout() {
  const navigate = useNavigate();

  const handleNext = (walletAddress: string) => {
    sessionStorage.setItem('onboardingPayout', walletAddress);
    navigate('/onboarding/review');
  };

  const handleBack = () => navigate('/onboarding/business');

  return (
    <OnboardingShell
      currentStep={2}
      completedSteps={[1]}
      title="Payout details"
      subtitle="Add a Stellar wallet to receive your subscription payouts."
    >
      <PayoutStep onBack={handleBack} onNext={handleNext} />
    </OnboardingShell>
  );
}
