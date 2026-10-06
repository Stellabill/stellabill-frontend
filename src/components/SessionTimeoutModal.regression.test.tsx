import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SessionTimeoutModal from './SessionTimeoutModal';

const noop = () => {};

describe('SessionTimeoutModal failure handling (regression)', () => {
  it('renders nothing while closed', () => {
    const { container } = render(
      <SessionTimeoutModal
        isOpen={false}
        remainingSeconds={90}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(document.querySelector('.session-timeout-overlay')).toBeNull();
  });

  it('does not emit a live announcement while closed', () => {
    render(
      <SessionTimeoutModal
        isOpen={false}
        remainingSeconds={5}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    expect(screen.queryByText(/your session will expire in/i)).not.toBeInTheDocument();
  });

  it('clears the last announcement when re-opened after being closed', async () => {
    const { rerender } = render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={10}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/your session will expire in 10 seconds/i)).toBeInTheDocument();
    });

    rerender(
      <SessionTimeoutModal
        isOpen={false}
        remainingSeconds={10}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Re-open with a non-milestone value: the stale announcement must not survive.
    rerender(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={97}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    expect(screen.queryByText(/your session will expire in 10 seconds/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('97').length).toBeGreaterThan(0);
  });

  it('clamps negative remaining time to zero', () => {
    render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={-30}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.queryByText(/your session will expire in -/i)).not.toBeInTheDocument();
  });

  it('clamps remaining time above the warning window to 120', () => {
    render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={9000}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    expect(screen.getAllByText('120').length).toBeGreaterThan(0);
    expect(screen.queryByText('9000')).not.toBeInTheDocument();
  });

  it('uses the singular unit at exactly one second', () => {
    render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={1}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.queryByText('seconds')).not.toBeInTheDocument();
  });

  it('uses the plural unit at zero and above one second', () => {
    const { rerender } = render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={0}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );
    expect(screen.getByText('seconds')).toBeInTheDocument();

    rerender(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={2}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );
    expect(screen.getByText('seconds')).toBeInTheDocument();
  });

  it('announces the expired state once the countdown reaches zero', async () => {
    render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={0}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/your session has expired/i)).toBeInTheDocument();
    });
  });

  it('invokes the caller callbacks for stay / logout without throwing', () => {
    const onStaySignedIn = vi.fn();
    const onLogout = vi.fn();
    render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={15}
        onStaySignedIn={onStaySignedIn}
        onLogout={onLogout}
      />
    );

    act(() => {
      screen.getByRole('button', { name: /stay signed in/i }).click();
    });
    expect(onStaySignedIn).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();

    act(() => {
      screen.getByRole('button', { name: /log out now/i }).click();
    });
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('keeps the countdown stable when remainingSeconds does not change on re-render', () => {
    const { rerender } = render(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={60}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );

    for (let i = 0; i < 3; i += 1) {
      rerender(
        <SessionTimeoutModal
          isOpen
          remainingSeconds={60}
          onStaySignedIn={noop}
          onLogout={noop}
        />
      );
    }

    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
  });

  it('exposes the overlay only when open', () => {
    const { rerender } = render(
      <SessionTimeoutModal
        isOpen={false}
        remainingSeconds={45}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );
    expect(document.querySelector('.session-timeout-overlay')).toBeNull();

    rerender(
      <SessionTimeoutModal
        isOpen
        remainingSeconds={45}
        onStaySignedIn={noop}
        onLogout={noop}
      />
    );
    expect(document.querySelector('.session-timeout-overlay')).not.toBeNull();
  });
});
