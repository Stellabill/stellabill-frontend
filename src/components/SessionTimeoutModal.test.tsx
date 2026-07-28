import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import SessionTimeoutModal from './SessionTimeoutModal';

describe('SessionTimeoutModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the warning content, actions, and countdown ring', () => {
    render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={45}
        onStaySignedIn={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole('alertdialog', { name: /your session is about to expire/i })).toBeInTheDocument();
    expect(screen.getByText(/if you remain inactive/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stay signed in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out now/i })).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(document.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('announces countdown milestones for screen readers', async () => {
    render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={30}
        onStaySignedIn={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/your session will expire in 30 seconds/i)).toBeInTheDocument();
    });
  });

  it('falls back to numeric-only countdown under reduced motion', () => {
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={12}
        onStaySignedIn={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getAllByText('12').length).toBeGreaterThan(0);
    expect(document.querySelector('svg[aria-hidden="true"]')).not.toBeInTheDocument();
  });
});
