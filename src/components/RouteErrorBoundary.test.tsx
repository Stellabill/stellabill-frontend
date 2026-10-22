import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import RouteErrorBoundary from "./RouteErrorBoundary";
import Layout from "./Layout";

describe("RouteErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Silence React's expected error logs during boundary catches
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("throwing child shows fallback", () => {
    function BrokenChild(): JSX.Element {
      throw new Error("Simulated page crash");
    }

    render(
      <RouteErrorBoundary>
        <BrokenChild />
      </RouteErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Simulated page crash")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("retry re-renders child", () => {
    let shouldFail = true;

    function RecoverableChild(): JSX.Element {
      if (shouldFail) {
        throw new Error("Temporary failure");
      }
      return <div>Recovered child successfully</div>;
    }

    render(
      <RouteErrorBoundary>
        <RecoverableChild />
      </RouteErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.queryByText("Recovered child successfully")
    ).not.toBeInTheDocument();

    // Fix error condition and click retry
    shouldFail = false;
    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(
      screen.getByText("Recovered child successfully")
    ).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("route change resets", () => {
    function FailingRoute(): JSX.Element {
      throw new Error("Crash on broken page");
    }

    function HealthyRoute(): JSX.Element {
      return <div>Healthy page content</div>;
    }

    render(
      <MemoryRouter initialEntries={["/broken"]}>
        <nav>
          <Link to="/healthy">Go to Healthy</Link>
        </nav>
        <RouteErrorBoundary>
          <Routes>
            <Route path="/broken" element={<FailingRoute />} />
            <Route path="/healthy" element={<HealthyRoute />} />
          </Routes>
        </RouteErrorBoundary>
      </MemoryRouter>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.queryByText("Healthy page content")
    ).not.toBeInTheDocument();

    // Navigate to the healthy route
    fireEvent.click(screen.getByRole("link", { name: /go to healthy/i }));

    expect(screen.getByText("Healthy page content")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("route change resets when pathname prop changes", () => {
    let shouldFail = true;

    function Crashable(): JSX.Element {
      if (shouldFail) throw new Error("Crashed route");
      return <div>Normal Content</div>;
    }

    const { rerender } = render(
      <RouteErrorBoundary pathname="/initial">
        <Crashable />
      </RouteErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Route changed to /next-path and child no longer fails
    shouldFail = false;
    rerender(
      <RouteErrorBoundary pathname="/next-path">
        <Crashable />
      </RouteErrorBoundary>
    );

    expect(screen.getByText("Normal Content")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("chunk-load error shows reload CTA", () => {
    const onReload = vi.fn();

    function ChunkBrokenChild(): JSX.Element {
      const err = new Error(
        "Failed to fetch dynamically imported module: /assets/Dashboard-CCmcS7AI.js"
      );
      throw err;
    }

    render(
      <RouteErrorBoundary onReload={onReload}>
        <ChunkBrokenChild />
      </RouteErrorBoundary>
    );

    expect(screen.getByText(/page update required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a new version of the application is available/i)
    ).toBeInTheDocument();

    const reloadButton = screen.getByRole("button", { name: /reload page/i });
    expect(reloadButton).toBeInTheDocument();

    fireEvent.click(reloadButton);
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("chunk-load error with ChunkLoadError name shows reload CTA and defaults to window.location.reload", () => {
    const originalLocation = window.location;
    const reloadMock = vi.fn();

    try {
      // @ts-expect-error Mocking window.location for test
      delete window.location;
      window.location = {
        ...originalLocation,
        reload: reloadMock,
      };

      function NamedChunkFailure(): JSX.Element {
        const err = new Error("Loading chunk 123 failed");
        err.name = "ChunkLoadError";
        throw err;
      }

      render(
        <RouteErrorBoundary>
          <NamedChunkFailure />
        </RouteErrorBoundary>
      );

      const reloadButton = screen.getByRole("button", { name: /reload page/i });
      expect(reloadButton).toBeInTheDocument();

      fireEvent.click(reloadButton);
      expect(reloadMock).toHaveBeenCalledTimes(1);
    } finally {
      window.location = originalLocation;
    }
  });

  it("renders children when no error occurs", () => {
    render(
      <RouteErrorBoundary>
        <div>Working child content</div>
      </RouteErrorBoundary>
    );

    expect(screen.getByText("Working child content")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("correctly identifies chunk load errors via isChunkLoadError helper", () => {
    expect(RouteErrorBoundary.isChunkLoadError(null)).toBe(false);
    expect(RouteErrorBoundary.isChunkLoadError(undefined)).toBe(false);
    expect(RouteErrorBoundary.isChunkLoadError(new Error("Generic TypeError"))).toBe(false);

    expect(
      RouteErrorBoundary.isChunkLoadError(
        new Error("Failed to fetch dynamically imported module: ./foo.js")
      )
    ).toBe(true);

    expect(
      RouteErrorBoundary.isChunkLoadError(
        new Error("error loading dynamically imported module")
      )
    ).toBe(true);

    expect(
      RouteErrorBoundary.isChunkLoadError(
        new Error("Importing a module script failed.")
      )
    ).toBe(true);

    const chunkErr = new Error("Custom message");
    chunkErr.name = "ChunkLoadError";
    expect(RouteErrorBoundary.isChunkLoadError(chunkErr)).toBe(true);
  });

  it("renders error UI while sidebar stays interactive when child throws inside Layout", () => {
    function CrashingDashboard(): JSX.Element {
      throw new Error("Dashboard render failed");
    }

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<CrashingDashboard />} />
            <Route path="subscriptions" element={<div>Subscriptions OK</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Error UI is rendered inside the Outlet
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Dashboard render failed")).toBeInTheDocument();

    // The sidebar and bottom nav links are still rendered and interactive!
    const subLinks = screen.getAllByRole("link", { name: /^subscriptions$/i });
    expect(subLinks.length).toBeGreaterThan(0);

    // Clicking navigation link clears the error state and navigates
    fireEvent.click(subLinks[0]);
    expect(screen.getByText("Subscriptions OK")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
