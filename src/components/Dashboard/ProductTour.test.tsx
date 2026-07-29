import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import {
  ProductTourProvider,
  useProductTour,
  TourStepInfo,
} from "./ProductTourProvider";
import { TourStep } from "./TourStep";
import TourResumeCheckpoint from "./TourResumeCheckpoint";

const TestComponent = ({ steps }: { steps: Omit<TourStepInfo, "path">[] }) => {
  return (
    <div>
      {steps.map((step) => (
        <div key={step.targetId} data-tour-id={step.targetId}>
          {step.targetId}
        </div>
      ))}
      {steps.map((step) => (
        <TourStep key={step.id} {...step} />
      ))}
    </div>
  );
};

const mockSteps = [
  {
    id: "step1",
    title: "Welcome!",
    content: "This is the first step.",
    targetId: "target1",
  },
  {
    id: "step2",
    title: "Second Step",
    content: "This is the second step.",
    targetId: "target2",
  },
];

const renderWithRouter = (ui: React.ReactElement, { route = "/" } = {}) => {
  window.history.pushState({}, "Test page", route);
  return render(ui, { wrapper: MemoryRouter });
};

describe("ProductTour", () => {
  beforeEach(() => {
    localStorage.clear();
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
  });

  test("does not start tour if already completed", () => {
    localStorage.setItem("stellabill_tour_completed", "true");
    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
      </ProductTourProvider>,
      { route: "/dashboard" }
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("registers steps and shows the first step on start", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Welcome!")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  test("navigates between steps", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });

    fireEvent.click(screen.getByText("Next"));
    expect(await screen.findByText("Second Step")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Back"));
    expect(await screen.findByText("Welcome!")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  test("finishes the tour and sets localStorage", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });

    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Finish"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("stellabill_tour_completed")).toBe("true");
  });

  test("skips the tour without setting completion in localStorage", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };
    renderWithRouter(<ProductTourProvider><TestComponent steps={mockSteps} /><HookComponent /></ProductTourProvider>);
    await act(async () => { tour.startTour(); });

    fireEvent.click(screen.getByText("Skip"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("stellabill_tour_completed")).toBeNull();
  });
});

describe("Tour checkpoint persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
  });

  test("saves checkpoint when advancing to a step", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });

    fireEvent.click(screen.getByText("Next"));

    const cp = JSON.parse(
      localStorage.getItem("stellabill_tour_checkpoint")!
    );
    expect(cp.stepIndex).toBe(1);
    expect(cp.stepId).toBe("step2");
    expect(cp.title).toBe("Second Step");
    expect(cp.version).toBe(1);
  });

  test("clears checkpoint when tour is completed", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });

    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Finish"));

    expect(localStorage.getItem("stellabill_tour_checkpoint")).toBeNull();
  });

  test("resumeTour restores from checkpoint", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });

    // Advance to step 2
    fireEvent.click(screen.getByText("Next"));
    expect(await screen.findByText("Second Step")).toBeInTheDocument();

    // Skip the tour (leaves checkpoint intact)
    fireEvent.click(screen.getByText("Skip"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Resume from checkpoint
    await act(async () => {
      tour.resumeTour();
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Second Step")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  test("clearCheckpoint removes the saved checkpoint", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });

    fireEvent.click(screen.getByText("Next"));
    expect(localStorage.getItem("stellabill_tour_checkpoint")).not.toBeNull();

    await act(async () => {
      tour.clearCheckpoint();
    });

    expect(localStorage.getItem("stellabill_tour_checkpoint")).toBeNull();
  });

  test("restores checkpoint from localStorage on mount", async () => {
    // Pre-seed a valid checkpoint in localStorage
    localStorage.setItem(
      "stellabill_tour_checkpoint",
      JSON.stringify({
        stepIndex: 1,
        stepId: "step2",
        title: "Second Step",
        version: 1,
      })
    );

    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    expect(tour.checkpoint).toEqual({
      stepIndex: 1,
      stepId: "step2",
      title: "Second Step",
      version: 1,
    });
  });

  test("ignores checkpoint with mismatched version", async () => {
    localStorage.setItem(
      "stellabill_tour_checkpoint",
      JSON.stringify({
        stepIndex: 0,
        stepId: "step1",
        title: "Welcome!",
        version: 999,
      })
    );

    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    expect(tour.checkpoint).toBeNull();
  });

  test("startTour clears existing checkpoint", async () => {
    localStorage.setItem(
      "stellabill_tour_checkpoint",
      JSON.stringify({
        stepIndex: 1,
        stepId: "step2",
        title: "Second Step",
        version: 1,
      })
    );

    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });

    expect(localStorage.getItem("stellabill_tour_checkpoint")).toBeNull();
    expect(screen.getByText("Welcome!")).toBeInTheDocument();
  });
});

describe("TourResumeCheckpoint", () => {
  beforeEach(() => {
    localStorage.clear();
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    }));
  });

  test("renders nothing when no checkpoint exists", () => {
    renderWithRouter(
      <ProductTourProvider>
        <TourResumeCheckpoint />
      </ProductTourProvider>
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("renders nothing when tour is active", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TourResumeCheckpoint />
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    localStorage.setItem(
      "stellabill_tour_checkpoint",
      JSON.stringify({
        stepIndex: 1,
        stepId: "step2",
        title: "Second Step",
        version: 1,
      })
    );

    await act(async () => {
      tour.startTour();
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("shows checkpoint chip and resumes tour on continue", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TourResumeCheckpoint />
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    // Start and advance to step 2
    await act(async () => {
      tour.startTour();
    });
    fireEvent.click(screen.getByText("Next"));
    // Skip the tour
    fireEvent.click(screen.getByText("Skip"));

    // Checkpoint chip should appear
    const chip = screen.getByRole("status");
    expect(chip).toHaveTextContent("Tour paused at step 2: Second Step");

    // Click Continue
    fireEvent.click(screen.getByText("Continue"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Second Step")).toBeInTheDocument();
  });

  test("dismiss clears checkpoint and hides chip", async () => {
    let tour;
    const HookComponent = () => {
      tour = useProductTour();
      return null;
    };

    renderWithRouter(
      <ProductTourProvider>
        <TourResumeCheckpoint />
        <TestComponent steps={mockSteps} />
        <HookComponent />
      </ProductTourProvider>
    );

    await act(async () => {
      tour.startTour();
    });
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Skip"));

    expect(screen.getByText("Dismiss")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Dismiss"));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(localStorage.getItem("stellabill_tour_checkpoint")).toBeNull();
  });
});