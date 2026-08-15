import React from 'react';
import ErrorHandler from '@/lib/errorHandler';

interface State {
  hasError: boolean;
  error?: Error | null;
}

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
    this.onRetry = this.onRetry.bind(this);
    this.onGoHome = this.onGoHome.bind(this);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Report with context including component stack
    ErrorHandler.report(error, { extra: { componentStack: info.componentStack } });
  }

  onRetry() {
    // Simple recovery option: reload the page
    if (typeof window !== 'undefined') window.location.reload();
  }

  onGoHome() {
    if (typeof window !== 'undefined') window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong.</h2>
          <p>
            The application encountered an unexpected problem. You can try refreshing the page or return to the
            home screen.
          </p>
          <div style={{ marginTop: 12 }}>
            <button onClick={this.onRetry} style={{ marginRight: 8 }}>Refresh</button>
            <button onClick={this.onGoHome}>Go to Home</button>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
