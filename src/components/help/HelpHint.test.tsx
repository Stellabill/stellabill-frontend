import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import HelpHint from './HelpHint';

describe('HelpHint', () => {
  describe('rendering', () => {
    it('renders a trigger button with the expected ARIA contract', () => {
      render(<HelpHint title="MRR" definition="Monthly recurring revenue." />);
      const trigger = screen.getByRole('button', { name: /more information about MRR/i });
      expect(trigger).toHaveAttribute('type', 'button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveAttribute('aria-controls');
      expect(trigger).toHaveAttribute('aria-describedby', trigger.getAttribute('aria-controls'));
    });

    it('hides the popover by default', () => {
      render(<HelpHint title="MRR" definition="Monthly recurring revenue." />);
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('applies the placement modifier class', () => {
      const { container } = render(
        <HelpHint title="MRR" definition="Monthly recurring revenue." placement="top" />
      );
      expect(container.querySelector('.help-hint')).toHaveClass('help-hint--top');
    });

    it('uses a custom trigger label when provided', () => {
      render(
        <HelpHint title="MRR" definition="Monthly recurring revenue." triggerLabel="What does MRR mean?" />
      );
      expect(screen.getByRole('button', { name: 'What does MRR mean?' })).toBeInTheDocument();
    });
  });

  describe('glossary-backed content', () => {
    it('resolves title, definition, example, and learn-more link from termId', async () => {
      render(<HelpHint termId="mrr" />);
      const trigger = screen.getByRole('button', { name: /learn more about monthly recurring revenue/i });
      fireEvent.click(trigger);

      const popover = await screen.findByRole('region');
      expect(popover).toHaveTextContent('Monthly Recurring Revenue');
      expect(popover).toHaveTextContent(/predictable revenue/i);
      expect(popover).toHaveTextContent(/100 customers pay \$50\/month/i);
      expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
        'href',
        'https://docs.stellarbill.example/glossary/mrr'
      );
    });

    it('lets explicit props override the glossary values', async () => {
      render(<HelpHint termId="mrr" title="Custom MRR" definition="Custom definition." />);
      fireEvent.click(screen.getByRole('button', { name: /learn more about custom mrr/i }));
      const popover = await screen.findByRole('region');
      expect(popover).toHaveTextContent('Custom MRR');
      expect(popover).toHaveTextContent('Custom definition.');
    });

    it('does not render a learn-more link when no URL is available', async () => {
      render(<HelpHint title="Active Subscriptions" definition="Current paid subscriptions." />);
      fireEvent.click(screen.getByRole('button'));
      const popover = await screen.findByRole('region');
      expect(popover).toHaveTextContent('Active Subscriptions');
      expect(screen.queryByRole('link', { name: 'Learn more' })).not.toBeInTheDocument();
      expect(screen.queryByText(/example/i)).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('opens on click without stealing focus from the trigger', async () => {
      render(<HelpHint title="MRR" definition="Monthly recurring revenue." />);
      const trigger = screen.getByRole('button');
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(await screen.findByRole('region')).toBeVisible();
      expect(document.activeElement).toBe(trigger);
    });

    it('does not auto-focus the popover or its link when opened by mouse', async () => {
      render(
        <HelpHint title="MRR" definition="Monthly recurring revenue." learnMoreUrl="https://example.com/mrr" />
      );
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      await screen.findByRole('region');

      expect(document.activeElement).not.toBe(screen.getByRole('link', { name: 'Learn more' }));
    });

    it('toggles closed when the trigger is clicked again', async () => {
      render(<HelpHint title="MRR" definition="Monthly recurring revenue." />);
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      expect(await screen.findByRole('region')).toBeVisible();

      fireEvent.click(trigger);
      await waitFor(() => expect(screen.queryByRole('region')).not.toBeInTheDocument());
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes on Escape and restores focus to the trigger', async () => {
      render(<HelpHint title="MRR" definition="Monthly recurring revenue." />);
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);
      await screen.findByRole('region');

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('region')).not.toBeInTheDocument());
      expect(document.activeElement).toBe(trigger);
    });

    it('closes when the user presses outside the hint', async () => {
      render(<HelpHint title="MRR" definition="Monthly recurring revenue." />);
      fireEvent.click(screen.getByRole('button'));
      await screen.findByRole('region');

      fireEvent.pointerDown(document.body);
      await waitFor(() => expect(screen.queryByRole('region')).not.toBeInTheDocument());
    });

    it('opens on focus and stays open when focus moves inside the popover', () => {
      render(
        <HelpHint title="MRR" definition="Monthly recurring revenue." learnMoreUrl="https://example.com/mrr" />
      );
      const trigger = screen.getByRole('button');
      fireEvent.focus(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      const link = screen.getByRole('link', { name: 'Learn more' });
      fireEvent.blur(trigger, { relatedTarget: link });
      expect(screen.getByRole('region')).toBeVisible();
    });

    it('closes when focus leaves the hint entirely', () => {
      render(<HelpHint title="MRR" definition="Monthly recurring revenue." />);
      const trigger = screen.getByRole('button');
      fireEvent.focus(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      fireEvent.blur(trigger, { relatedTarget: document.body });
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });
  });

  describe('hover behavior with delays', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('opens on hover after the open delay and closes after the close delay', async () => {
      render(
        <HelpHint
          title="MRR"
          definition="Monthly recurring revenue."
          openDelayMs={50}
          closeDelayMs={100}
        />
      );
      const trigger = screen.getByRole('button');
      const wrapper = trigger.closest('.help-hint') as HTMLElement;

      fireEvent.mouseEnter(wrapper);
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('region')).toBeVisible();

      fireEvent.mouseLeave(wrapper);
      expect(screen.getByRole('region')).toBeVisible();

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('does not close on quick hover-out when the open timer is still pending', () => {
      render(
        <HelpHint title="MRR" definition="Monthly recurring revenue." openDelayMs={50} closeDelayMs={100} />
      );
      const wrapper = screen.getByRole('button').closest('.help-hint') as HTMLElement;

      fireEvent.mouseEnter(wrapper);
      fireEvent.mouseLeave(wrapper);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.queryByRole('region')).not.toBeInTheDocument();
    });

    it('uses the configured open/close delay props', () => {
      render(
        <HelpHint title="MRR" definition="Monthly recurring revenue." openDelayMs={200} closeDelayMs={300} />
      );
      const wrapper = screen.getByRole('button').closest('.help-hint') as HTMLElement;

      fireEvent.mouseEnter(wrapper);
      act(() => {
        vi.advanceTimersByTime(199);
      });
      expect(screen.queryByRole('region')).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByRole('region')).toBeVisible();
    });
  });
});
