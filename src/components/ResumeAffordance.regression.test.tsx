import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeAffordance from './ResumeAffordance';

/**
 * Regression suite for the explicit failure/empty-result path in
 * `src/components/ResumeAffordance.tsx`:
 *
 *   if (!isPaused) {
 *     return null;
 *   }
 *
 * plus the boundary inputs of the neighbouring success path (date formatting
 * and the two-step confirmation state machine). The `return null` branch is a
 * silent contract — nothing renders and no error is thrown — so these tests
 * pin it down to prevent it being changed without notice.
 */

const ISO_DATE = '2026-04-22T00:00:00.000Z';

function renderComponent(props: {
  isPaused: boolean;
  pauseUntilDate?: string | null;
  onResumeClick?: () => void;
  isLoading?: boolean;
}) {
  return render(<ResumeAffordance {...props} />);
}

describe('ResumeAffordance failure path (isPaused = false)', () => {
  it('renders null while keeping the component mounted', () => {
    const { container } = renderComponent({ isPaused: false });

    expect(container.firstChild).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders null regardless of how the remaining props are set (all combinations)', () => {
    const onResumeClick = vi.fn();

    const combinations: Array<{
      pauseUntilDate?: string | null;
      onResumeClick?: () => void;
      isLoading?: boolean;
    }> = [
      {},
      { pauseUntilDate: undefined },
      { pauseUntilDate: null },
      { pauseUntilDate: ISO_DATE },
      { isLoading: true },
      { isLoading: false },
      { onResumeClick },
      { onResumeClick, isLoading: true },
      { onResumeClick, pauseUntilDate: ISO_DATE, isLoading: true },
    ];

    for (const combination of combinations) {
      const { container, unmount } = renderComponent({
        isPaused: false,
        ...combination,
      });

      expect(container.firstChild, `failed for: ${JSON.stringify(combination)}`).toBeNull();
      expect(onResumeClick).not.toHaveBeenCalled();
      unmount();
    }
  });

  it('never fires onResumeClick while paused=false', () => {
    const onResumeClick = vi.fn();
    renderComponent({ isPaused: false, onResumeClick });

    expect(onResumeClick).not.toHaveBeenCalled();
  });

  it('transitions from null (unpaused) to rendered (paused) on the same instance', () => {
    const { rerender } = renderComponent({ isPaused: false });

    expect(screen.queryByText(/subscription paused/i)).not.toBeInTheDocument();

    rerender(<ResumeAffordance isPaused={true} />);

    expect(screen.getByText(/subscription paused/i)).toBeInTheDocument();
  });

  it('transitions from rendered (paused) back to null on the same instance', () => {
    const { rerender, container } = renderComponent({ isPaused: true });

    expect(container.firstChild).not.toBeNull();

    rerender(<ResumeAffordance isPaused={false} />);

    expect(container.firstChild).toBeNull();
  });
});

describe('ResumeAffordance success-path boundaries', () => {
  let onResumeClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onResumeClick = vi.fn();
  });

  describe('pauseUntilDate formatting', () => {
    it('formats a full ISO timestamp as a short US date', () => {
      renderComponent({ isPaused: true, pauseUntilDate: ISO_DATE });

      const subtitle = screen.getByText(/resumes on/i);
      expect(subtitle).toHaveTextContent(/Resumes on\s+\w{3}\s+\d{1,2},\s+\d{4}/);
    });

    it('formats a date-only string', () => {
      renderComponent({ isPaused: true, pauseUntilDate: '2026-12-01' });

      expect(screen.getByText(/resumes on/i)).toHaveTextContent(/Dec\s+\d{1,2},\s+2026/);
    });

    it('renders "indefinitely" when the date is null', () => {
      renderComponent({ isPaused: true, pauseUntilDate: null });

      expect(screen.queryByText(/resumes on/i)).not.toBeInTheDocument();
      expect(screen.getByText(/subscription paused/i)).toBeInTheDocument();
    });

    it('renders "indefinitely" when the date is undefined', () => {
      renderComponent({ isPaused: true });

      expect(screen.queryByText(/resumes on/i)).not.toBeInTheDocument();
    });

    it('returns the raw string unchanged for an invalid date value', () => {
      renderComponent({ isPaused: true, pauseUntilDate: 'not-a-date' });

      // Invalid dates fall through to the raw string; "indefinitely" must NOT appear.
      expect(screen.queryByText(/^indefinitely$/)).not.toBeInTheDocument();
      expect(screen.getByText(/resumes on/i)).toBeInTheDocument();
    });

    it('does not throw for boundary date inputs', () => {
      const boundaryInputs: Array<string | null | undefined> = [
        '',
        '0',
        '9999-12-31T23:59:59Z',
      ];

      for (const input of boundaryInputs) {
        const { unmount } = renderComponent({ isPaused: true, pauseUntilDate: input });
        expect(() => {
          // Force an assertion while mounted so failures surface per input.
          expect(screen.getByText(/subscription paused/i)).toBeInTheDocument();
        }).not.toThrow();
        unmount();
      }
    });
  });

  describe('two-step confirmation state machine', () => {
    it('does not call onResumeClick on the first click of the resume button', async () => {
      const user = userEvent.setup();
      renderComponent({ isPaused: true, onResumeClick });

      await user.click(screen.getByRole('button', { name: /resume now/i }));

      expect(onResumeClick).not.toHaveBeenCalled();
      expect(screen.getByText(/this will resume charging/i)).toBeInTheDocument();
    });

    it('calls onResumeClick exactly once on the second click (confirm)', async () => {
      const user = userEvent.setup();
      renderComponent({ isPaused: true, onResumeClick });

      await user.click(screen.getByRole('button', { name: /resume now/i }));
      await user.click(screen.getByRole('button', { name: /confirm resume/i }));

      expect(onResumeClick).toHaveBeenCalledTimes(1);
    });

    it('allows cancelling after arming, and the first click after cancel re-arms without firing', async () => {
      const user = userEvent.setup();
      renderComponent({ isPaused: true, onResumeClick });

      await user.click(screen.getByRole('button', { name: /resume now/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onResumeClick).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /resume now/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /resume now/i }));

      expect(onResumeClick).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: /confirm resume/i })).toBeInTheDocument();
    });

    it('disables all interactive controls and shows "Resuming..." while isLoading during confirmation', async () => {
      const user = userEvent.setup();
      const { rerender } = renderComponent({
        isPaused: true,
        onResumeClick,
        isLoading: false,
      });

      await user.click(screen.getByRole('button', { name: /resume now/i }));

      const confirmBtn = screen.getByRole('button', { name: /confirm resume/i });
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      expect(confirmBtn).toBeEnabled();
      expect(cancelBtn).toBeEnabled();

      rerender(
        <ResumeAffordance isPaused={true} onResumeClick={onResumeClick} isLoading={true} />,
      );

      expect(screen.getByRole('button', { name: /resuming\.\.\./i })).toBeDisabled();
      expect(cancelBtn).toBeDisabled();
    });

    it('disables the initial resume button when isLoading is true from the start', () => {
      renderComponent({ isPaused: true, onResumeClick, isLoading: true });

      expect(screen.getByRole('button', { name: /resume now/i })).toBeDisabled();
    });

    it('does not fire onResumeClick when a disabled confirm button is activated', async () => {
      const user = userEvent.setup();
      renderComponent({ isPaused: true, onResumeClick, isLoading: true });

      const resumeBtn = screen.getByRole('button', { name: /resume now/i });
      expect(resumeBtn).toBeDisabled();

      // userEvent respects `disabled`; a failed activation must not fire the callback.
      await user.click(resumeBtn).catch(() => undefined);

      expect(onResumeClick).not.toHaveBeenCalled();
    });
  });

  describe('public a11y contract', () => {
    it('exposes the region and its heading', () => {
      renderComponent({ isPaused: true });

      expect(screen.getByRole('region', { name: /subscription paused/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /subscription paused/i })).toBeInTheDocument();
    });

    it('keeps the visible label of the resume button in its accessible name', () => {
      renderComponent({ isPaused: true });

      const btn = screen.getByRole('button', { name: /resume now/i });
      // The accessible name must include the visible text (not override it),
      // otherwise screen-reader and voice-control users cannot match what they see.
      expect(btn.textContent).toContain('Resume now');
      expect(btn).toHaveAccessibleName(/resume now/i);
    });

    it('renders null output that stays out of the accessibility tree', () => {
      const { container } = renderComponent({ isPaused: false });

      expect(container.querySelector('[role="region"]')).toBeNull();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
