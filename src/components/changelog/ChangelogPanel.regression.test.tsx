import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ChangelogPanel, { type ChangelogArea } from './ChangelogPanel';

const UNREAD_STORAGE_KEY = 'sb:changelog-unread';

// Mirrors AREA_LABELS in ChangelogPanel.tsx. Typed against the exported union so a
// new area (or a renamed label) breaks this suite at compile time.
const AREA_LABELS: Record<ChangelogArea, string> = {
  billing: 'Billing',
  ui: 'UI',
  api: 'API',
  security: 'Security',
  performance: 'Performance',
  general: 'General',
};

function renderPanel(isOpen: boolean, onOpenChange = vi.fn()) {
  const utils = render(<ChangelogPanel isOpen={isOpen} onOpenChange={onOpenChange} />);
  return { ...utils, onOpenChange };
}

describe('ChangelogPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe('closed state regression (isOpen = false)', () => {
    it('returns null when isOpen is false', () => {
      const { container } = renderPanel(false);

      expect(container.firstChild).toBeNull();
    });

    it('renders no dialog or panel when isOpen is false', () => {
      renderPanel(false);

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.queryByText(/what.s new/i)).toBeNull();
    });

    it('renders nothing after transitioning from open to closed', () => {
      const onOpenChange = vi.fn();
      const { container, rerender } = render(<ChangelogPanel isOpen onOpenChange={onOpenChange} />);
      expect(container.firstChild).not.toBeNull();

      rerender(<ChangelogPanel isOpen={false} onOpenChange={onOpenChange} />);

      expect(container.firstChild).toBeNull();
    });

    it('ignores Escape key presses while closed', () => {
      const { onOpenChange } = renderPanel(false);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('clears persisted unread ids when mounted closed', () => {
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(['cl-001', 'cl-002']));

      renderPanel(false);

      expect(localStorage.getItem(UNREAD_STORAGE_KEY)).toBeNull();
    });
  });

  describe('open state normal path (isOpen = true)', () => {
    it('renders the dialog panel when isOpen is true', () => {
      renderPanel(true);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('tabindex', '-1');
    });

    it('renders the panel heading', () => {
      renderPanel(true);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/what.s new/i);
    });

    it('renders the close button with an accessible label', () => {
      renderPanel(true);

      expect(screen.getByRole('button', { name: /close what.s new panel/i })).toBeInTheDocument();
    });

    it('renders the area filter group with the All chip active by default', () => {
      renderPanel(true);

      expect(screen.getByRole('group', { name: /filter by area/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders an inactive chip for every changelog area', () => {
      renderPanel(true);

      for (const area of Object.keys(AREA_LABELS) as ChangelogArea[]) {
        expect(screen.getByRole('button', { name: AREA_LABELS[area] })).toHaveAttribute(
          'aria-pressed',
          'false'
        );
      }
    });
  });

  describe('filter chip state transitions', () => {
    it('marks the clicked area chip active and All inactive', () => {
      renderPanel(true);

      fireEvent.click(screen.getByRole('button', { name: 'Billing' }));

      expect(screen.getByRole('button', { name: 'Billing' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('moves the active chip when a different area is selected', () => {
      renderPanel(true);

      fireEvent.click(screen.getByRole('button', { name: 'Security' }));
      fireEvent.click(screen.getByRole('button', { name: 'API' }));

      expect(screen.getByRole('button', { name: 'API' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Security' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('resets the filter to All when the All chip is clicked', () => {
      renderPanel(true);

      fireEvent.click(screen.getByRole('button', { name: 'UI' }));
      expect(screen.getByRole('button', { name: 'UI' })).toHaveAttribute('aria-pressed', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'All' }));

      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'UI' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('does not request a close when a filter chip is clicked', () => {
      const { onOpenChange } = renderPanel(true);

      fireEvent.click(screen.getByRole('button', { name: 'Performance' }));

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('dismiss transitions', () => {
    it('calls onOpenChange(false) when the close button is clicked', () => {
      const { onOpenChange } = renderPanel(true);

      fireEvent.click(screen.getByRole('button', { name: /close what.s new panel/i }));

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange(false) when the overlay is clicked', () => {
      const { container, onOpenChange } = renderPanel(true);

      const overlay = container.querySelector('.changelog-overlay');
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay as HTMLElement);

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('calls onOpenChange(false) when Escape is pressed while open', () => {
      const { onOpenChange } = renderPanel(true);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('clears persisted unread ids and the badge when closed', () => {
      const onOpenChange = vi.fn();
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(['cl-001', 'cl-002']));

      const { rerender } = render(<ChangelogPanel isOpen onOpenChange={onOpenChange} />);
      expect(screen.getByLabelText('2 unread updates')).toBeInTheDocument();

      rerender(<ChangelogPanel isOpen={false} onOpenChange={onOpenChange} />);

      expect(localStorage.getItem(UNREAD_STORAGE_KEY)).toBeNull();
      expect(screen.queryByLabelText(/unread updates/)).toBeNull();
    });
  });

  describe('boundary inputs for persisted unread ids', () => {
    it('hides the unread badge when the persisted list is empty', () => {
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify([]));

      renderPanel(true);

      expect(screen.queryByLabelText(/unread updates/)).toBeNull();
    });

    it('falls back to every entry when storage is empty', () => {
      renderPanel(true);

      expect(screen.getByLabelText('8 unread updates')).toBeInTheDocument();
    });

    it('falls back to every entry when storage holds invalid JSON', () => {
      localStorage.setItem(UNREAD_STORAGE_KEY, '{not valid json');

      renderPanel(true);

      expect(screen.getByLabelText('8 unread updates')).toBeInTheDocument();
    });

    it('counts blank persisted ids without throwing', () => {
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(['', '   ']));

      renderPanel(true);

      expect(screen.getByLabelText('2 unread updates')).toBeInTheDocument();
    });

    it('renders a large unread count', () => {
      const manyIds = Array.from({ length: 150 }, (_, index) => `cl-${index}`);
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(manyIds));

      renderPanel(true);

      expect(screen.getByLabelText('150 unread updates')).toBeInTheDocument();
    });

    it('renders a single very long persisted id', () => {
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(['x'.repeat(5000)]));

      renderPanel(true);

      expect(screen.getByLabelText('1 unread updates')).toBeInTheDocument();
    });

    it('keeps persisted unread ids while the panel remains open', () => {
      localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(['cl-001']));

      renderPanel(true);

      expect(screen.getByLabelText('1 unread updates')).toBeInTheDocument();
      expect(localStorage.getItem(UNREAD_STORAGE_KEY)).toBe(JSON.stringify(['cl-001']));
    });
  });
});
