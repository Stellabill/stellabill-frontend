import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorState from './ErrorState';
import type { ApiError } from '../api/client';
import { SUPPORT_URL } from '../config/links';

describe('ErrorState Component', () => {
  const onRetry = vi.fn();
  let originalNavigatorLine: boolean;

  beforeEach(() => {
    onRetry.mockClear();
    originalNavigatorLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorLine,
      configurable: true,
    });
  });

  it('renders title and message correctly', () => {
    render(<ErrorState title="Failed to Load" message="Please try again later." />);
    
    expect(screen.getByText('Failed to Load')).toBeInTheDocument();
    expect(screen.getByText('Please try again later.')).toBeInTheDocument();
  });

  it('shows default title and fallback message if neither message nor kind is provided', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('shows default title if none provided', () => {
    render(<ErrorState message="Error occurred." />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    render(<ErrorState message="Error" onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables retry button when isRetrying is true', () => {
    render(<ErrorState message="Error" onRetry={onRetry} isRetrying={true} />);
    
    const retryButton = screen.getByRole('button', { name: /retrying.../i });
    expect(retryButton).toBeDisabled();
    expect(retryButton).toHaveAttribute('aria-busy', 'true');
  });

  it('toggles technical details visibility', () => {
    const details = 'Stack trace details here';
    render(<ErrorState message="Error" technicalDetails={details} />);
    
    // Initially hidden
    expect(screen.queryByText(details)).not.toBeInTheDocument();
    
    const toggleButton = screen.getByRole('button', { name: /technical details/i });
    
    // Show details
    fireEvent.click(toggleButton);
    expect(screen.getByText(details)).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    
    // Hide details
    fireEvent.click(toggleButton);
    expect(screen.queryByText(details)).not.toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows offline messaging when type is offline', () => {
    render(<ErrorState message="Error" type="offline" />);
    
    expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
    expect(screen.getByText(/please check your network settings/i)).toBeInTheDocument();
  });

  it('shows offline messaging when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });
    
    render(<ErrorState message="Error" />);
    
    expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
    expect(screen.getByText(/please check your network settings/i)).toBeInTheDocument();
  });

  it('renders contact support button with correct link', () => {
    render(<ErrorState message="Error" />);
    
    const supportButton = screen.getByRole('button', { name: /contact support/i });
    expect(supportButton).toBeInTheDocument();
    
    // Mock window.open
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(supportButton);
    expect(windowOpenSpy).toHaveBeenCalledWith(SUPPORT_URL, '_blank', 'noopener,noreferrer');
    windowOpenSpy.mockRestore();
  });

  describe('error kind mapping', () => {
    it('maps kind="network" to network title, message, and data-error-kind', () => {
      render(<ErrorState kind="network" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-error-kind', 'network');
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.getByText(/unable to reach the server/i)).toBeInTheDocument();
    });

    it('maps kind="timeout" to timeout title, message, and data-error-kind', () => {
      render(<ErrorState kind="timeout" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-error-kind', 'timeout');
      expect(screen.getByText('Request timed out')).toBeInTheDocument();
      expect(screen.getByText(/the server took too long to respond/i)).toBeInTheDocument();
    });

    it('maps kind="http" to server error title, message, and data-error-kind', () => {
      render(<ErrorState kind="http" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-error-kind', 'http');
      expect(screen.getByText('Server error')).toBeInTheDocument();
      expect(screen.getByText(/the request could not be completed by the server/i)).toBeInTheDocument();
    });

    it('maps kind="parse" to unexpected response format title, message, and data-error-kind', () => {
      render(<ErrorState kind="parse" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-error-kind', 'parse');
      expect(screen.getByText('Unexpected response format')).toBeInTheDocument();
      expect(screen.getByText(/we received an invalid response from the server/i)).toBeInTheDocument();
    });

    it('extracts kind, message, and technicalDetails from an ApiError prop', () => {
      const apiErr: ApiError = Object.assign(new Error('Gateway timed out'), {
        kind: 'timeout' as const,
        isTimeout: true as const,
        technicalDetails: 'Upstream 504 after 15000ms',
      });

      render(<ErrorState error={apiErr} />);

      expect(screen.getByRole('alert')).toHaveAttribute('data-error-kind', 'timeout');
      expect(screen.getByText('Request timed out')).toBeInTheDocument();
      expect(screen.getByText('Gateway timed out')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /technical details/i }));
      expect(screen.getByText('Upstream 504 after 15000ms')).toBeInTheDocument();
    });

    it('infers kind from legacy ApiError flags (isTimeout, isNetworkError, status)', () => {
      const { unmount: u1 } = render(
        <ErrorState error={{ name: 'Error', message: 'Timed out', isTimeout: true }} />
      );
      expect(screen.getByRole('alert')).toHaveAttribute('data-error-kind', 'timeout');
      u1();

      const { unmount: u2 } = render(
        <ErrorState error={{ name: 'Error', message: 'Net fail', isNetworkError: true }} />
      );
      expect(screen.getByRole('alert')).toHaveAttribute('data-error-kind', 'network');
      u2();

      const { unmount: u3 } = render(
        <ErrorState error={{ name: 'Error', message: '500 fail', status: 500 }} />
      );
      expect(screen.getByRole('alert')).toHaveAttribute('data-error-kind', 'http');
      u3();
    });
  });
});
