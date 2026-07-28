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

interface TourCheckpoint {
  stepIndex: number;
  stepId: string;
  title: string;
  version: number;
}

interface ProductTourContextType {
  registerStep: (step: TourStepInfo) => void;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: (completed?: boolean) => void;
  resumeTour: () => void;
  clearCheckpoint: () => void;
  isTourActive: boolean;
  currentStep: number;
  totalSteps: number;
  activeStep: TourStepInfo | null;
  checkpoint: TourCheckpoint | null;
}

const ProductTourContext = createContext<ProductTourContextType | undefined>(
  undefined
);

const TOUR_STORAGE_KEY = "stellabill_tour_completed";
const TOUR_CHECKPOINT_KEY = "stellabill_tour_checkpoint";
const TOUR_CHECKPOINT_VERSION = 1;

export const ProductTourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [steps, setSteps] = useState<TourStepInfo[]>([]);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(
    () => localStorage.getItem(TOUR_STORAGE_KEY) === "true"
  );
  const [checkpoint, setCheckpoint] = useState<TourCheckpoint | null>(() => {
    try {
      const raw = localStorage.getItem(TOUR_CHECKPOINT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.version !== TOUR_CHECKPOINT_VERSION) return null;
      return parsed as TourCheckpoint;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  const registerStep = useCallback((step: TourStepInfo) => {
    setSteps((prevSteps) => {
      if (prevSteps.some((s) => s.id === step.id)) {
        return prevSteps;
      }
      return [...prevSteps, step].sort((a, b) => a.id.localeCompare(b.id));
    });
  }, []);

  const persistCheckpoint = useCallback((index: number, stepsList: TourStepInfo[]) => {
    const step = stepsList[index];
    if (!step) return;
    const cp: TourCheckpoint = {
      stepIndex: index,
      stepId: step.id,
      title: step.title,
      version: TOUR_CHECKPOINT_VERSION,
    };
    setCheckpoint(cp);
    localStorage.setItem(TOUR_CHECKPOINT_KEY, JSON.stringify(cp));
  }, []);

  const clearCheckpoint = useCallback(() => {
    setCheckpoint(null);
    localStorage.removeItem(TOUR_CHECKPOINT_KEY);
  }, []);

  const startTour = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStep(0);
      setIsTourActive(true);
      clearCheckpoint();
      document.body.style.overflow = "hidden";
    }
  }, [steps, clearCheckpoint]);

  const endTour = useCallback((completed = false) => {
    setIsTourActive(false);
    document.body.style.overflow = "";
    if (completed) {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
      setHasCompleted(true);
      clearCheckpoint();
    } else {
      // Skipped but not completed — save checkpoint so user can resume
    }
  }, [clearCheckpoint]);

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
      persistCheckpoint(stepIndex, steps);
    },
    [steps, location.pathname, navigate, endTour, persistCheckpoint]
  );

  const resumeTour = useCallback(() => {
    if (!checkpoint || steps.length === 0) return;
    // Validate checkpoint step still exists
    const idx = checkpoint.stepIndex;
    if (idx < 0 || idx >= steps.length) {
      clearCheckpoint();
      return;
    }
    setCurrentStep(idx);
    setIsTourActive(true);
    document.body.style.overflow = "hidden";
    const step = steps[idx];
    if (step && location.pathname !== step.path) {
      navigate(step.path);
    }
  }, [checkpoint, steps, clearCheckpoint, location.pathname, navigate]);

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
      resumeTour,
      clearCheckpoint,
      isTourActive,
      currentStep,
      totalSteps: steps.length,
      activeStep,
      checkpoint,
    }),
    [
      registerStep,
      startTour,
      nextStep,
      prevStep,
      endTour,
      resumeTour,
      clearCheckpoint,
      isTourActive,
      currentStep,
      steps.length,
      activeStep,
      checkpoint,
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