import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PricingSeatToggle from './PricingSeatToggle';

function setUrl(search = '') {
  window.history.replaceState(null, '', '/pricing' + search);
}

describe('PricingSeatToggle', () => {
  beforeEach(() => {
    setUrl('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state from URL', () => {
    it('reads valid mode and seats from ?mode=per-seat&seats=12', () => {
      setUrl('?mode=per-seat&seats=12');
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);

      expect(screen.getByRole('radio', { name: /per seat/i })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /flat rate/i })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('spinbutton', { name: /number of seats/i })).toHaveValue(12);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('per-seat', 12);
    });

    it.each([
      { label: 'seats=0', search: '?mode=invalid&seats=0' },
      { label: 'seats=abc', search: '?seats=abc' },
      { label: 'seats=10001', search: '?seats=10001' },
    ])('falls back to flat/5 for invalid URL params ($label)', ({ search }) => {
      setUrl(search);
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);

      expect(screen.getByRole('radio', { name: /flat rate/i })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /per seat/i })).toHaveAttribute('aria-checked', 'false');
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('flat', 5);
    });

    it('falls back to 5 seats when mode=per-seat has out-of-range or non-numeric seats', () => {
      for (const seatsParam of ['0', 'abc', '10001']) {
        setUrl('?mode=per-seat&seats=' + seatsParam);
        const onChange = vi.fn();

        const { unmount } = render(<PricingSeatToggle onChange={onChange} />);

        expect(screen.getByRole('spinbutton', { name: /number of seats/i })).toHaveValue(5);
        expect(onChange).toHaveBeenCalledWith('per-seat', 5);
        unmount();
      }
    });
  });

  describe('onChange and URL synchronization', () => {
    it('calls onChange on mount and after each mode and seat change', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);

      expect(onChange).toHaveBeenLastCalledWith('flat', 5);

      await user.click(screen.getByRole('radio', { name: /per seat/i }));
      expect(onChange).toHaveBeenLastCalledWith('per-seat', 5);

      await user.click(screen.getByRole('button', { name: /add one seat/i }));
      expect(onChange).toHaveBeenLastCalledWith('per-seat', 6);

      await user.click(screen.getByRole('button', { name: /remove one seat/i }));
      expect(onChange).toHaveBeenLastCalledWith('per-seat', 5);

      await user.click(screen.getByRole('radio', { name: /flat rate/i }));
      expect(onChange).toHaveBeenLastCalledWith('flat', 5);
      expect(onChange).toHaveBeenCalledTimes(5);
    });

    it('writes seats to the URL in per-seat mode and removes seats when switching to flat', async () => {
      const user = userEvent.setup();
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);

      expect(replaceStateSpy).toHaveBeenLastCalledWith(null, '', '/pricing?mode=flat');
      expect(new URLSearchParams(window.location.search).get('seats')).toBeNull();

      await user.click(screen.getByRole('radio', { name: /per seat/i }));
      expect(replaceStateSpy).toHaveBeenLastCalledWith(null, '', '/pricing?mode=per-seat&seats=5');
      expect(new URLSearchParams(window.location.search).get('seats')).toBe('5');

      await user.click(screen.getByRole('button', { name: /add one seat/i }));
      expect(replaceStateSpy).toHaveBeenLastCalledWith(null, '', '/pricing?mode=per-seat&seats=6');

      await user.click(screen.getByRole('radio', { name: /flat rate/i }));
      expect(replaceStateSpy).toHaveBeenLastCalledWith(null, '', '/pricing?mode=flat');
      expect(new URLSearchParams(window.location.search).get('seats')).toBeNull();
    });

    it('supports keyboard arrow navigation between pricing modes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);

      const flatRadio = screen.getByRole('radio', { name: /flat rate/i });
      flatRadio.focus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('radio', { name: /per seat/i })).toHaveAttribute('aria-checked', 'true');
      expect(onChange).toHaveBeenLastCalledWith('per-seat', 5);

      await user.keyboard('{ArrowLeft}');
      expect(flatRadio).toHaveAttribute('aria-checked', 'true');
      expect(onChange).toHaveBeenLastCalledWith('flat', 5);
    });
  });

  describe('seat clamping on commit', () => {
    it('clamps 0 back to 1 on blur and updates the input text', async () => {
      setUrl('?mode=per-seat&seats=5');
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);
      const input = screen.getByRole('spinbutton', { name: /number of seats/i });

      await user.clear(input);
      await user.type(input, '0');
      await user.tab();

      expect(input).toHaveValue(1);
      expect(onChange).toHaveBeenLastCalledWith('per-seat', 1);
      expect(screen.getByRole('button', { name: /remove one seat/i })).toBeDisabled();
    });

    it('clamps empty input back to 1 on blur and updates the input text', async () => {
      setUrl('?mode=per-seat&seats=8');
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);
      const input = screen.getByRole('spinbutton', { name: /number of seats/i });

      await user.clear(input);
      await user.tab();

      expect(input).toHaveValue(1);
      expect(onChange).toHaveBeenLastCalledWith('per-seat', 1);
    });

    it('clamps values above 10000 to 10000 on blur and Enter', async () => {
      setUrl('?mode=per-seat&seats=5');
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);
      const input = screen.getByRole('spinbutton', { name: /number of seats/i });

      await user.clear(input);
      await user.type(input, '10001{Enter}');

      expect(input).toHaveValue(10000);
      expect(onChange).toHaveBeenLastCalledWith('per-seat', 10000);
      expect(screen.getByRole('button', { name: /add one seat/i })).toBeDisabled();
    });
  });

  describe('live announcer region', () => {
    it('renders a polite status region with a useId-generated id and announces seat changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<PricingSeatToggle onChange={onChange} />);

      const announcer = screen.getByRole('status', { hidden: true });
      expect(announcer.id).toBeTruthy();
      expect(announcer).toHaveAttribute('aria-live', 'polite');
      expect(announcer).toHaveAttribute('aria-atomic', 'true');
      expect(announcer).toHaveTextContent('');

      await user.click(screen.getByRole('radio', { name: /per seat/i }));
      expect(announcer).toHaveTextContent('5 seats selected');

      const input = screen.getByRole('spinbutton', { name: /number of seats/i });
      await user.clear(input);
      await user.type(input, '1');
      await user.tab();
      expect(announcer).toHaveTextContent('1 seat selected');

      await user.click(screen.getByRole('button', { name: /add one seat/i }));
      expect(announcer).toHaveTextContent('2 seats selected');
    });
  });
});
