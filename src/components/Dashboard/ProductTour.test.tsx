import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  ProductTourProvider,
  useProductTour,
  TourStepInfo,
} from "./ProductTourProvider";
import { TourStep } from "./TourStep";

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
    // Mock IntersectionObserver
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

    // Go to next step
    fireEvent.click(screen.getByText("Next"));
    expect(await screen.findByText("Second Step")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    // Go back
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