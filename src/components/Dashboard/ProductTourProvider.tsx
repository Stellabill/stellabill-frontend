import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TourSpotlight from "./TourSpotlight";

export interface TourStepInfo {
  id: string;
  title: string;
  content: React.ReactNode;
  targetId: string;
  path: string;
}

interface ProductTourContextType {
  registerStep: (step: TourStepInfo) => void;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: (completed?: boolean) => void;
  isTourActive: boolean;
  currentStep: number;
  totalSteps: number;
  activeStep: TourStepInfo | null;
}

const ProductTourContext = createContext<ProductTourContextType | undefined>(
  undefined
);

const TOUR_STORAGE_KEY = "stellabill_tour_completed";

export const ProductTourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [steps, setSteps] = useState<TourStepInfo[]>([]);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(
    () => localStorage.getItem(TOUR_STORAGE_KEY) === "true"
  );

  const navigate = useNavigate();
  const location = useLocation();

  const registerStep = useCallback((step: TourStepInfo) => {
    setSteps((prevSteps) => {
      if (prevSteps.some((s) => s.id === step.id)) {
        return prevSteps;
      }
      // This simple sort assumes IDs like 'step1', 'step2'
      return [...prevSteps, step].sort((a, b) => a.id.localeCompare(b.id));
    });
  }, []);

  const startTour = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStep(0);
      setIsTourActive(true);
      document.body.style.overflow = "hidden";
    }
  }, [steps]);

  const endTour = useCallback((completed = false) => {
    setIsTourActive(false);
    document.body.style.overflow = "";
    if (completed) {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
      setHasCompleted(true);
    }
  }, []);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= steps.length) {
        endTour(true);
        return;
      }
      const nextStepInfo = steps[stepIndex];
      if (location.pathname !== nextStepInfo.path) {
        navigate(nextStepInfo.path);
      }
      setCurrentStep(stepIndex);
    },
    [steps, location.pathname, navigate, endTour]
  );

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  useEffect(() => {
    // Automatically start the tour for new users on the dashboard
    if (
      !hasCompleted &&
      steps.length > 0 &&
      location.pathname === "/dashboard"
    ) {
      // Use a timeout to ensure the page has rendered
      const timer = setTimeout(() => startTour(), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasCompleted, steps.length, location.pathname, startTour]);

  const activeStep = isTourActive ? steps[currentStep] : null;

  const value = useMemo(
    () => ({
      registerStep,
      startTour,
      nextStep,
      prevStep,
      endTour,
      isTourActive,
      currentStep,
      totalSteps: steps.length,
      activeStep,
    }),
    [
      registerStep,
      startTour,
      nextStep,
      prevStep,
      endTour,
      isTourActive,
      currentStep,
      steps.length,
      activeStep,
    ]
  );

  return (
    <ProductTourContext.Provider value={value}>
      {children}
      {activeStep && <TourSpotlight step={activeStep} />}
    </ProductTourContext.Provider>
  );
};

export const useProductTour = () => {
  const context = useContext(ProductTourContext);
  if (!context) {
    throw new Error("useProductTour must be used within a ProductTourProvider");
  }
  return context;
};