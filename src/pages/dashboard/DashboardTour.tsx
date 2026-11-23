import ProductTour from '../../components/ProductTour/ProductTour';
import TourCompletion from '../../components/ProductTour/TourCompletion';
import { dashboardTourSteps } from '../../components/ProductTour/tourSteps';
import { useProductTour } from '../../hooks/useProductTour';

/** Product tour and its completion celebration for the dashboard. */
export default function DashboardTour() {
  const {
    isOpen,
    showCompletion,
    closeTour,
    completeTour,
    dismissTour,
    closeCompletion,
  } = useProductTour();

  return (
    <>
      <ProductTour
        steps={dashboardTourSteps}
        isOpen={isOpen}
        onClose={closeTour}
        onComplete={completeTour}
        onDismiss={dismissTour}
      />

      <TourCompletion
        isOpen={showCompletion}
        onClose={closeCompletion}
        title="You're all set!"
        message="You've completed the tour. You're ready to start managing your subscriptions and growing your business."
        actionLabel="Get started"
      />
    </>
  );
}
