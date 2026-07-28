import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KeyboardChordIndicator from './KeyboardChordIndicator';

describe('KeyboardChordIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('does not render when pendingKey is null', () => {
    const { container } = render(<KeyboardChordIndicator pendingKey={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when pendingKey is set', () => {
    render(<KeyboardChordIndicator pendingKey="g" />);
    
    // Check if key is displayed
    expect(screen.getByText('g')).toBeInTheDocument();
    
    // Check screen reader announcement
    const srElement = screen.getByText(/Chord started with g/);
    expect(srElement).toBeInTheDocument();
    expect(srElement).toHaveClass('kb-chord-sr-only');
    expect(srElement).toHaveAttribute('aria-live', 'polite');
    
    // Check enter animation class
    const container = screen.getByRole('status');
    expect(container).toHaveClass('kb-chord-indicator--enter');
  });

  it('plays exit animation when pendingKey becomes null', () => {
    const { rerender } = render(<KeyboardChordIndicator pendingKey="g" />);
    
    expect(screen.getByRole('status')).toHaveClass('kb-chord-indicator--enter');
    
    rerender(<KeyboardChordIndicator pendingKey={null} />);
    
    // Should now have exit class
    expect(screen.getByRole('status')).toHaveClass('kb-chord-indicator--exit');
    expect(screen.getByText('Chord cancelled.')).toBeInTheDocument();
    
    // Advance timer by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Should now be unmounted
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
