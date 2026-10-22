import React, { Component, ErrorInfo, ReactNode } from "react";
import { UNSAFE_LocationContext } from "react-router-dom";
import ErrorState from "./ErrorState";
import { RefreshCw } from "lucide-react";

function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === "string") {
    return isChunkErrorMessage(error);
  }
  if (error instanceof Error) {
    if (error.name === "ChunkLoadError") return true;
    return isChunkErrorMessage(error.message);
  }
  if (typeof error === "object" && error !== null) {
    const err = error as { name?: unknown; message?: unknown };
    if (err.name === "ChunkLoadError") return true;
    if (typeof err.message === "string" && isChunkErrorMessage(err.message)) return true;
  }
  return false;
}

function isChunkErrorMessage(message: string): boolean {
  return (
    /chunkloaderror/i.test(message) ||
    /failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message) ||
    /unable to preload css/i.test(message)
  );
}

export interface RouteErrorBoundaryProps {
  children?: ReactNode;
  pathname?: string;
  onReset?: () => void;
  onReload?: () => void;
}

export interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  static contextType = UNSAFE_LocationContext;
  static isChunkLoadError = isChunkLoadError;
  declare context: React.ContextType<typeof UNSAFE_LocationContext>;

  private lastPathname?: string;

  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      console.error("RouteErrorBoundary caught error:", error, errorInfo);
    }
  }

  componentDidMount(): void {
    this.lastPathname = this.getCurrentPathname();
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps): void {
    const currentPathname = this.getCurrentPathname();
    const prevPathname = prevProps.pathname ?? this.lastPathname;

    if (
      this.state.hasError &&
      currentPathname !== undefined &&
      currentPathname !== prevPathname
    ) {
      this.resetBoundary();
    }
    this.lastPathname = currentPathname;
  }

  private getCurrentPathname(): string | undefined {
    return this.props.pathname ?? this.context?.location?.pathname;
  }

  resetBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = (): void => {
    if (this.props.onReload) {
      this.props.onReload();
    } else {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const error = this.state.error;
      const isChunk = isChunkLoadError(error);

      if (isChunk) {
        return (
          <div className="route-error-boundary route-error-boundary--chunk">
            <ErrorState
              title="Page update required"
              message="A new version of the application is available. Please reload the page to load the latest version."
              technicalDetails={error?.stack}
            />
            <div
              className="error-state-actions"
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "-1.5rem",
                marginBottom: "2rem",
              }}
            >
              <button
                type="button"
                className="retry-button"
                onClick={this.handleReload}
                aria-label="Reload page"
              >
                <RefreshCw size={18} />
                Reload page
              </button>
            </div>
          </div>
        );
      }

      return (
        <ErrorState
          title="Something went wrong"
          message={
            error?.message ||
            "An unexpected error occurred while rendering this page."
          }
          technicalDetails={error?.stack}
          onRetry={this.resetBoundary}
        />
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
