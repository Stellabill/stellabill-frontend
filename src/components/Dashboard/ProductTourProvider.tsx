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
  targetSelector?: string;
}

export interface TourCheckpoint {
  stepIndex: number;
  stepId: string;
  title: string;
  version: number;
}

export interface PersistedTourState {
  version: number;
  completed: boolean;
  dismissed: boolean;
  checkpoint: TourCheckpoint | null;
}

export interface ProductTourContextType {
  registerStep: (step: TourStepInfo) => void;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: (completed?: boolean) => void;
  resumeTour: () => void;
  clearCheckpoint: () => void;
  resetTour: () => void;
  isTourActive: boolean;
  hasCompleted: boolean;
  hasDismissed: boolean;
  currentStep: number;
  totalSteps: number;
  activeStep: TourStepInfo | null;
  checkpoint: TourCheckpoint | null;
}

export const TOUR_STORAGE_KEY = "stellabill_tour_v1";
export const TOUR_STORAGE_VERSION = 1;
export const TOUR_CHECKPOINT_VERSION = 1;

export const LEGACY_TOUR_KEYS = {
  sbCompleted: "sb:tour-completed",
  sbDismissed: "sb:tour-dismissed",
  sbVersion: "sb:tour-completed-version",
  providerCompleted: "stellabill_tour_completed",
  providerCheckpoint: "stellabill_tour_checkpoint",
} as const;

export const dashboardTourSteps: TourStepInfo[] = [
  {
    id: "welcome",
    targetId: "welcome",
    targetSelector: ".dashboard-header",
    path: "/dashboard",
    title: "Welcome to Stellabill!",
    content:
      "Let's take a quick tour to help you get started with managing your subscriptions. You can skip this anytime and come back later.",
  },
  {
    id: "kpi-cards",
    targetId: "kpi-cards",
    targetSelector: ".dashboard-kpi-grid",
    path: "/dashboard",
    title: "Key Metrics at a Glance",
    content:
      "Monitor your subscription performance with these key metrics: active subscriptions, monthly recurring revenue, failed charges, and upcoming renewals.",
  },
  {
    id: "revenue-chart",
    targetId: "revenue-chart",
    targetSelector: ".dashboard-panel--chart",
    path: "/dashboard",
    title: "Track Revenue Growth",
    content: "Visualize your revenue trends over time.",
  },
  {
    id: "activity-feed",
    targetId: "activity-feed",
    targetSelector: ".dashboard-activity-column",
    path: "/dashboard",
    title: "Stay Updated",
    content:
      "Keep track of recent activities like payments, new subscriptions, and renewal reminders.",
  },
  {
    id: "create-plan",
    targetId: "create-plan",
    targetSelector: ".dashboard-action--primary",
    path: "/dashboard",
    title: "Create Your First Plan",
    content:
      "Ready to start? Click here to create your first subscription plan.",
  },
];

export const plansTourSteps: TourStepInfo[] = [
  {
    id: "plans-overview",
    targetId: "plans-overview",
    targetSelector: ".plans-header",
    path: "/plans",
    title: "Manage Your Plans",
    content: "This is where you create and manage all your subscription plans.",
  },
  {
    id: "create-plan-button",
    targetId: "create-plan-button",
    targetSelector: ".plans-create-button",
    path: "/plans",
    title: "Create a New Plan",
    content:
      "Click here to create a new subscription plan with custom pricing and billing intervals.",
  },
];

export const settingsTourSteps: TourStepInfo[] = [
  {
    id: "settings-overview",
    targetId: "settings-overview",
    targetSelector: ".settings-header",
    path: "/settings",
    title: "Customize Your Settings",
    content:
      "Configure your account preferences, payment methods, and notification settings here.",
  },
  {
    id: "account-section",
    targetId: "account-section",
    targetSelector: ".settings-account",
    path: "/settings",
    title: "Account Information",
    content:
      "Update your business details, contact information, and branding.",
  },
];

export const navigationTourSteps: TourStepInfo[] = [
  {
    id: "sidebar",
    targetId: "sidebar",
    targetSelector: ".sb-sidebar",
    path: "/dashboard",
    title: "Quick Navigation",
    content:
      "Use this sidebar to quickly navigate between Dashboard, Subscriptions, Plans, and Settings.",
  },
  {
    id: "command-palette",
    targetId: "command-palette",
    targetSelector: ".cmdk-trigger",
    path: "/dashboard",
    title: "Command Palette",
    content:
      "Press ⌘K (or Ctrl+K) to open the command palette for quick access to any page or action.",
  },
  {
    id: "help",
    targetId: "help",
    targetSelector: ".sb-sidebar__link",
    path: "/dashboard",
    title: "Need Help?",
    content:
      "Access help documentation, keyboard shortcuts, and support resources anytime.",
  },
];

function isValidCheckpoint(value: unknown): value is TourCheckpoint {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.stepIndex === "number" &&
    typeof candidate.stepId === "string" &&
    typeof candidate.title === "string" &&
    candidate.version === TOUR_CHECKPOINT_VERSION
  );
}

function parseLegacyCheckpoint(raw: string | null): TourCheckpoint | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidCheckpoint(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadTourState(): PersistedTourState {
  const defaultState: PersistedTourState = {
    version: TOUR_STORAGE_VERSION,
    completed: false,
    dismissed: false,
    checkpoint: null,
  };

  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed as Record<string, unknown>).version === TOUR_STORAGE_VERSION
      ) {
        const record = parsed as Record<string, unknown>;
        return {
          version: TOUR_STORAGE_VERSION,
          completed: record.completed === true,
          dismissed: record.dismissed === true,
          checkpoint: isValidCheckpoint(record.checkpoint)
            ? record.checkpoint
            : null,
        };
      }
    }

    // One-time migration from legacy storage keys
    const sbCompleted = localStorage.getItem(LEGACY_TOUR_KEYS.sbCompleted);
    const sbDismissed = localStorage.getItem(LEGACY_TOUR_KEYS.sbDismissed);
    const sbVersion = localStorage.getItem(LEGACY_TOUR_KEYS.sbVersion);
    const providerCompleted = localStorage.getItem(
      LEGACY_TOUR_KEYS.providerCompleted
    );
    const providerCheckpointRaw = localStorage.getItem(
      LEGACY_TOUR_KEYS.providerCheckpoint
    );

    const hasLegacyData =
      sbCompleted !== null ||
      sbDismissed !== null ||
      sbVersion !== null ||
      providerCompleted !== null ||
      providerCheckpointRaw !== null;

    if (hasLegacyData) {
      const completed =
        sbCompleted === "true" || providerCompleted === "true";
      const dismissed = sbDismissed === "true";
      const checkpoint =
        completed || dismissed
          ? null
          : parseLegacyCheckpoint(providerCheckpointRaw);

      const migrated: PersistedTourState = {
        version: TOUR_STORAGE_VERSION,
        completed,
        dismissed,
        checkpoint,
      };

      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_TOUR_KEYS.sbCompleted);
      localStorage.removeItem(LEGACY_TOUR_KEYS.sbDismissed);
      localStorage.removeItem(LEGACY_TOUR_KEYS.sbVersion);
      localStorage.removeItem(LEGACY_TOUR_KEYS.providerCompleted);
      localStorage.removeItem(LEGACY_TOUR_KEYS.providerCheckpoint);

      return migrated;
    }
  } catch {
    return defaultState;
  }

  return defaultState;
}

export function saveTourState(state: PersistedTourState): void {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write errors (e.g. private browsing / quota exceeded)
  }
}

export function resetTourStorage(): void {
  try {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TOUR_KEYS.sbCompleted);
    localStorage.removeItem(LEGACY_TOUR_KEYS.sbDismissed);
    localStorage.removeItem(LEGACY_TOUR_KEYS.sbVersion);
    localStorage.removeItem(LEGACY_TOUR_KEYS.providerCompleted);
    localStorage.removeItem(LEGACY_TOUR_KEYS.providerCheckpoint);
  } catch {
    // Ignore storage errors
  }
}

const ProductTourContext = createContext<ProductTourContextType | undefined>(
  undefined
);

export interface ProductTourProviderProps {
  children: React.ReactNode;
  initialSteps?: TourStepInfo[];
}

export const ProductTourProvider: React.FC<ProductTourProviderProps> = ({
  children,
  initialSteps = dashboardTourSteps,
}) => {
  const [steps, setSteps] = useState<TourStepInfo[]>(initialSteps);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [persistedState, setPersistedState] = useState<PersistedTourState>(() =>
    loadTourState()
  );

  const navigate = useNavigate();
  const location = useLocation();

  const updatePersistedState = useCallback(
    (updater: (prev: PersistedTourState) => PersistedTourState) => {
      setPersistedState((prev) => {
        const next = updater(prev);
        saveTourState(next);
        return next;
      });
    },
    []
  );

  const registerStep = useCallback((step: TourStepInfo) => {
    setSteps((prevSteps) => {
      if (prevSteps.some((s) => s.id === step.id)) {
        return prevSteps;
      }
      return [...prevSteps, step].sort((a, b) => a.id.localeCompare(b.id));
    });
  }, []);

  const persistCheckpoint = useCallback(
    (index: number, stepsList: TourStepInfo[]) => {
      const step = stepsList[index];
      if (!step) return;
      const cp: TourCheckpoint = {
        stepIndex: index,
        stepId: step.id,
        title: step.title,
        version: TOUR_CHECKPOINT_VERSION,
      };
      updatePersistedState((prev) => ({
        ...prev,
        checkpoint: cp,
      }));
    },
    [updatePersistedState]
  );

  const clearCheckpoint = useCallback(() => {
    updatePersistedState((prev) => ({
      ...prev,
      checkpoint: null,
    }));
  }, [updatePersistedState]);

  const startTour = useCallback(() => {
    if (steps.length > 0) {
      setCurrentStep(0);
      setIsTourActive(true);
      clearCheckpoint();
      document.body.style.overflow = "hidden";
    }
  }, [steps, clearCheckpoint]);

  const endTour = useCallback(
    (completed = false) => {
      setIsTourActive(false);
      document.body.style.overflow = "";
      if (completed) {
        updatePersistedState((prev) => ({
          ...prev,
          completed: true,
          dismissed: false,
          checkpoint: null,
        }));
      } else {
        updatePersistedState((prev) => ({
          ...prev,
          dismissed: true,
        }));
      }
    },
    [updatePersistedState]
  );

  const resetTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentStep(0);
    document.body.style.overflow = "";
    const fresh: PersistedTourState = {
      version: TOUR_STORAGE_VERSION,
      completed: false,
      dismissed: false,
      checkpoint: null,
    };
    setPersistedState(fresh);
    saveTourState(fresh);
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
      persistCheckpoint(stepIndex, steps);
    },
    [steps, location.pathname, navigate, endTour, persistCheckpoint]
  );

  const resumeTour = useCallback(() => {
    const checkpoint = persistedState.checkpoint;
    if (!checkpoint || steps.length === 0) return;
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
  }, [persistedState.checkpoint, steps, clearCheckpoint, location.pathname, navigate]);

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  useEffect(() => {
    // Automatically start the tour for new users on the dashboard
    if (
      !persistedState.completed &&
      !persistedState.dismissed &&
      steps.length > 0 &&
      location.pathname === "/dashboard"
    ) {
      const timer = setTimeout(() => startTour(), 1000);
      return () => clearTimeout(timer);
    }
  }, [
    persistedState.completed,
    persistedState.dismissed,
    steps.length,
    location.pathname,
    startTour,
  ]);

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
      resetTour,
      isTourActive,
      hasCompleted: persistedState.completed,
      hasDismissed: persistedState.dismissed,
      currentStep,
      totalSteps: steps.length,
      activeStep,
      checkpoint: persistedState.checkpoint,
    }),
    [
      registerStep,
      startTour,
      nextStep,
      prevStep,
      endTour,
      resumeTour,
      clearCheckpoint,
      resetTour,
      isTourActive,
      persistedState.completed,
      persistedState.dismissed,
      persistedState.checkpoint,
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

export const useOptionalProductTour = () => {
  return useContext(ProductTourContext) ?? null;
};
