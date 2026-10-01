import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PdfThumbnailNavigator, {
  PdfThumbnailNavigatorProps,
} from './PdfThumbnailNavigator';

type Props = PdfThumbnailNavigatorProps;

const renderNavigator = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    numPages: 5,
    currentPage: 1,
    onPageChange: vi.fn(),
    ...overrides,
  };
  const utils = render(<PdfThumbnailNavigator {...props} />);
  return { ...utils, props };
};

const rerenderNavigator = (
  utils: ReturnType<typeof renderNavigator>,
  overrides: Partial<Props>
) => {
  const next: Props = { ...utils.props, ...overrides };
  utils.rerender(<PdfThumbnailNavigator {...next} />);
  return next;
};

const getTabs = () => screen.getAllByRole('tab');
const getTablist = () => screen.getByRole('tablist');
const getChip = () => screen.getByRole('status');

const captureWindowErrors = () => {
  const errors: Error[] = [];
  const listener = (event: ErrorEvent) => {
    if (event.error instanceof Error) {
      errors.push(event.error);
    }
    event.preventDefault();
  };
  window.addEventListener('error', listener);
  return {
    errors,
    stop: () => window.removeEventListener('error', listener),
  };
};

describe('PdfThumbnailNavigator', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('exports a callable default component', () => {
    expect(typeof PdfThumbnailNavigator).toBe('function');
  });

  it('renders one tab per page with required props only', () => {
    renderNavigator({ numPages: 5 });
    expect(getTabs()).toHaveLength(5);
    expect(
      screen.getByRole('navigation', { name: 'PDF pages' })
    ).toBeInTheDocument();
  });

  it('labels each tab with its page and total', () => {
    renderNavigator({ numPages: 4 });
    const tabs = getTabs();
    expect(tabs[0]).toHaveAttribute('aria-label', 'Page 1 of 4');
    expect(tabs[3]).toHaveAttribute('aria-label', 'Page 4 of 4');
  });

  it('renders page numbers and labels inside each thumbnail', () => {
    renderNavigator({ numPages: 3 });
    const first = getTabs()[0];
    expect(first.querySelector('.pdf-thumbnail-page-number')).toHaveTextContent(
      '1'
    );
    expect(first.querySelector('.pdf-thumbnail-label')).toHaveTextContent(
      'Page 1'
    );
  });

  it('marks the current page selected, current, and focusable', () => {
    renderNavigator({ numPages: 4, currentPage: 2 });
    const tabs = getTabs();
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-current', 'true');
    expect(tabs[1]).toHaveAttribute('tabindex', '0');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[0]).not.toHaveAttribute('aria-current');
    expect(tabs[0]).toHaveAttribute('tabindex', '-1');
  });

  it('marks the last page selected when currentPage equals numPages', () => {
    renderNavigator({ numPages: 3, currentPage: 3 });
    expect(getTabs()[2]).toHaveAttribute('aria-selected', 'true');
    expect(getTabs()[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the current page and total in the status chip', () => {
    renderNavigator({ numPages: 7, currentPage: 4 });
    expect(getChip()).toHaveTextContent('Page 4 of 7');
    expect(getChip()).toHaveAttribute('aria-live', 'polite');
  });

  it('defaults className to an empty string when omitted', () => {
    renderNavigator();
    const nav = screen.getByRole('navigation', { name: 'PDF pages' });
    expect(nav.className.trim()).toBe('pdf-thumbnail-navigator');
  });

  it('appends a custom className to the nav and the chip container', () => {
    renderNavigator({ className: 'compact' });
    expect(
      screen.getByRole('navigation', { name: 'PDF pages' })
    ).toHaveClass('compact');
    expect(document.querySelector('.pdf-mobile-chip-container')).toHaveClass(
      'compact'
    );
  });

  it('accepts a multi-class className string', () => {
    renderNavigator({ className: 'a b' });
    const nav = screen.getByRole('navigation', { name: 'PDF pages' });
    expect(nav).toHaveClass('a');
    expect(nav).toHaveClass('b');
  });

  it('accepts a whitespace-only className', () => {
    renderNavigator({ className: '   ' });
    const nav = screen.getByRole('navigation', { name: 'PDF pages' });
    expect(nav).toHaveClass('pdf-thumbnail-navigator');
  });

  it('stringifies a null className cast into the class attribute', () => {
    renderNavigator({ className: null as unknown as string });
    const nav = screen.getByRole('navigation', { name: 'PDF pages' });
    expect(nav).toHaveClass('pdf-thumbnail-navigator');
    expect(nav).toHaveClass('null');
  });

  it('calls onPageChange with the clicked page number', async () => {
    const user = userEvent.setup();
    const { props } = renderNavigator({ numPages: 5 });
    await user.click(getTabs()[2]);
    expect(props.onPageChange).toHaveBeenCalledTimes(1);
    expect(props.onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with 1 for the first thumbnail', async () => {
    const user = userEvent.setup();
    const { props } = renderNavigator({ numPages: 5, currentPage: 5 });
    await user.click(getTabs()[0]);
    expect(props.onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with the last page for the last thumbnail', async () => {
    const user = userEvent.setup();
    const { props } = renderNavigator({ numPages: 5, currentPage: 1 });
    await user.click(getTabs()[4]);
    expect(props.onPageChange).toHaveBeenCalledWith(5);
  });

  it('calls onPageChange even when the clicked page is already current', async () => {
    const user = userEvent.setup();
    const { props } = renderNavigator({ numPages: 5, currentPage: 2 });
    await user.click(getTabs()[1]);
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });

  it('moves one page back on ArrowUp', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 3 });
    fireEvent.keyDown(getTablist(), { key: 'ArrowUp' });
    expect(props.onPageChange).toHaveBeenLastCalledWith(2);
  });

  it('clamps ArrowUp at the first page without calling onPageChange', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 1 });
    fireEvent.keyDown(getTablist(), { key: 'ArrowUp' });
    expect(props.onPageChange).not.toHaveBeenCalled();
  });

  it('moves one page forward on ArrowDown', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 3 });
    fireEvent.keyDown(getTablist(), { key: 'ArrowDown' });
    expect(props.onPageChange).toHaveBeenLastCalledWith(4);
  });

  it('clamps ArrowDown at the last page without calling onPageChange', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 5 });
    fireEvent.keyDown(getTablist(), { key: 'ArrowDown' });
    expect(props.onPageChange).not.toHaveBeenCalled();
  });

  it('jumps back three pages on PageUp and clamps at the first page', () => {
    const { props, unmount } = renderNavigator({ numPages: 10, currentPage: 5 });
    fireEvent.keyDown(getTablist(), { key: 'PageUp' });
    expect(props.onPageChange).toHaveBeenLastCalledWith(2);
    unmount();

    const clamped = renderNavigator({ numPages: 10, currentPage: 2 });
    fireEvent.keyDown(getTablist(), { key: 'PageUp' });
    expect(clamped.props.onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('jumps forward three pages on PageDown and clamps at the last page', () => {
    const { props, unmount } = renderNavigator({ numPages: 10, currentPage: 5 });
    fireEvent.keyDown(getTablist(), { key: 'PageDown' });
    expect(props.onPageChange).toHaveBeenLastCalledWith(8);
    unmount();

    const clamped = renderNavigator({ numPages: 10, currentPage: 9 });
    fireEvent.keyDown(getTablist(), { key: 'PageDown' });
    expect(clamped.props.onPageChange).toHaveBeenLastCalledWith(10);
  });

  it('jumps to the first page on Home', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 4 });
    fireEvent.keyDown(getTablist(), { key: 'Home' });
    expect(props.onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('does not call onPageChange for Home on the first page', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 1 });
    fireEvent.keyDown(getTablist(), { key: 'Home' });
    expect(props.onPageChange).not.toHaveBeenCalled();
  });

  it('jumps to the last page on End', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 2 });
    fireEvent.keyDown(getTablist(), { key: 'End' });
    expect(props.onPageChange).toHaveBeenLastCalledWith(5);
  });

  it('does not call onPageChange for End on the last page', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 5 });
    fireEvent.keyDown(getTablist(), { key: 'End' });
    expect(props.onPageChange).not.toHaveBeenCalled();
  });

  it('prevents default for handled keys and ignores unhandled keys', () => {
    const { props } = renderNavigator({ numPages: 5, currentPage: 2 });
    expect(fireEvent.keyDown(getTablist(), { key: 'ArrowDown' })).toBe(false);
    expect(props.onPageChange).toHaveBeenCalledWith(3);
    expect(fireEvent.keyDown(getTablist(), { key: 'x' })).toBe(true);
    expect(props.onPageChange).toHaveBeenCalledTimes(1);
  });

  it('focuses the newly selected thumbnail after a keyboard page change', () => {
    vi.useFakeTimers();
    const { props } = renderNavigator({ numPages: 5, currentPage: 1 });
    const target = getTabs()[1];
    const focusSpy = vi.spyOn(target, 'focus');
    fireEvent.keyDown(getTablist(), { key: 'ArrowDown' });
    expect(props.onPageChange).toHaveBeenCalledWith(2);
    expect(focusSpy).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('does not schedule focus when a navigation key changes nothing', () => {
    vi.useFakeTimers();
    const { props } = renderNavigator({ numPages: 5, currentPage: 1 });
    const focusSpies = getTabs().map((tab) => vi.spyOn(tab, 'focus'));
    fireEvent.keyDown(getTablist(), { key: 'ArrowUp' });
    expect(props.onPageChange).not.toHaveBeenCalled();
    vi.runAllTimers();
    focusSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('scrolls the current thumbnail into view when the page changes', () => {
    const utils = renderNavigator({ numPages: 5, currentPage: 1 });
    const scrollSpy = vi.fn();
    getTabs()[3].scrollIntoView = scrollSpy;
    rerenderNavigator(utils, { currentPage: 4 });
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    });
  });

  it('does not scroll when the page is unchanged', () => {
    const utils = renderNavigator({ numPages: 5, currentPage: 2 });
    const scrollSpy = vi.fn();
    getTabs()[1].scrollIntoView = scrollSpy;
    rerenderNavigator(utils, { currentPage: 2 });
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('propagates a scrollIntoView failure as a thrown error', () => {
    const captured = captureWindowErrors();
    try {
      const utils = renderNavigator({ numPages: 5, currentPage: 1 });
      getTabs()[2].scrollIntoView = vi.fn(() => {
        throw new Error('scroll failed');
      });
      expect(() => rerenderNavigator(utils, { currentPage: 3 })).toThrow(
        'scroll failed'
      );
    } finally {
      captured.stop();
    }
  });

  it('skips scrolling when the target thumbnail does not exist', () => {
    expect(() => renderNavigator({ numPages: 5, currentPage: 9 })).not.toThrow();
    expect(getTabs()).toHaveLength(5);
    getTabs().forEach((tab) => expect(tab).toHaveAttribute('aria-selected', 'false'));
  });

  it('renders a single-page document with no navigation room', () => {
    const { props } = renderNavigator({ numPages: 1, currentPage: 1 });
    const tabs = getTabs();
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(getChip()).toHaveTextContent('Page 1 of 1');
    fireEvent.keyDown(getTablist(), { key: 'ArrowUp' });
    fireEvent.keyDown(getTablist(), { key: 'ArrowDown' });
    fireEvent.keyDown(getTablist(), { key: 'PageUp' });
    fireEvent.keyDown(getTablist(), { key: 'PageDown' });
    fireEvent.keyDown(getTablist(), { key: 'Home' });
    fireEvent.keyDown(getTablist(), { key: 'End' });
    expect(props.onPageChange).not.toHaveBeenCalled();
  });

  it('renders an empty tablist for a zero-page document', () => {
    renderNavigator({ numPages: 0 });
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(getTablist()).toBeInTheDocument();
    expect(getChip()).toHaveTextContent('Page 1 of 0');
  });

  it('renders no tabs for a negative page count', () => {
    renderNavigator({ numPages: -2 });
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(getChip()).toHaveTextContent('Page 1 of -2');
  });

  it(
    'renders every requested tab for an extremely large page count',
    () => {
      renderNavigator({ numPages: 10000 });
      expect(getTabs()).toHaveLength(10000);
      expect(getTabs()[9999]).toHaveAttribute(
        'aria-label',
        'Page 10000 of 10000'
      );
    },
    30000
  );

  it('renders two tabs for a fractional page count of 2.5', () => {
    renderNavigator({ numPages: 2.5 });
    expect(getTabs()).toHaveLength(2);
  });

  it('renders no tabs for a NaN page count', () => {
    renderNavigator({ numPages: Number.NaN });
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });

  it('marks no tab selected for a negative currentPage', () => {
    renderNavigator({ numPages: 3, currentPage: -1 });
    getTabs().forEach((tab) => expect(tab).toHaveAttribute('aria-selected', 'false'));
    expect(getChip()).toHaveTextContent('Page -1 of 3');
  });

  it('marks no tab selected when currentPage is beyond the page count', () => {
    renderNavigator({ numPages: 3, currentPage: 4 });
    getTabs().forEach((tab) => expect(tab).toHaveAttribute('aria-selected', 'false'));
    expect(getChip()).toHaveTextContent('Page 4 of 3');
  });

  it('marks no tab selected for a zero currentPage', () => {
    renderNavigator({ numPages: 3, currentPage: 0 });
    getTabs().forEach((tab) => expect(tab).toHaveAttribute('aria-selected', 'false'));
    expect(getChip()).toHaveTextContent('Page 0 of 3');
  });

  it('treats a fractional currentPage as matching no tab', () => {
    renderNavigator({ numPages: 4, currentPage: 2.5 });
    getTabs().forEach((tab) => expect(tab).toHaveAttribute('aria-selected', 'false'));
    expect(getChip()).toHaveTextContent('Page 2.5 of 4');
  });

  it('clamps ArrowDown from an out-of-range currentPage to the last page', () => {
    const { props } = renderNavigator({ numPages: 3, currentPage: 4 });
    fireEvent.keyDown(getTablist(), { key: 'ArrowDown' });
    expect(props.onPageChange).toHaveBeenLastCalledWith(3);
  });

  it('resolves ArrowUp from a zero currentPage to the first page', () => {
    const { props } = renderNavigator({ numPages: 3, currentPage: 0 });
    fireEvent.keyDown(getTablist(), { key: 'ArrowUp' });
    expect(props.onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('reports a TypeError when a null onPageChange receives a click', () => {
    const captured = captureWindowErrors();
    try {
      const { container } = render(
        <PdfThumbnailNavigator
          numPages={3}
          currentPage={1}
          onPageChange={null as unknown as (page: number) => void}
        />
      );
      const first = container.querySelector(
        '.pdf-thumbnail-btn'
      ) as HTMLButtonElement;
      fireEvent.click(first);
      expect(captured.errors.map((error) => error.message)).toContain(
        'onPageChange is not a function'
      );
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    } finally {
      captured.stop();
    }
  });

  it('reports a TypeError when an undefined onPageChange receives a click', () => {
    const captured = captureWindowErrors();
    try {
      const { container } = render(
        <PdfThumbnailNavigator
          numPages={3}
          currentPage={1}
          onPageChange={undefined as unknown as (page: number) => void}
        />
      );
      const first = container.querySelector(
        '.pdf-thumbnail-btn'
      ) as HTMLButtonElement;
      fireEvent.click(first);
      expect(captured.errors.map((error) => error.message)).toContain(
        'onPageChange is not a function'
      );
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    } finally {
      captured.stop();
    }
  });

  it('reports a TypeError when a null onPageChange receives a handled keydown', () => {
    const captured = captureWindowErrors();
    try {
      render(
        <PdfThumbnailNavigator
          numPages={3}
          currentPage={1}
          onPageChange={null as unknown as (page: number) => void}
        />
      );
      fireEvent.keyDown(getTablist(), { key: 'ArrowDown' });
      expect(captured.errors.map((error) => error.message)).toContain(
        'onPageChange is not a function'
      );
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    } finally {
      captured.stop();
    }
  });

  it('resets selection when remounted with different props', () => {
    const first = renderNavigator({ numPages: 5, currentPage: 3 });
    expect(getTabs()[2]).toHaveAttribute('aria-selected', 'true');
    first.unmount();
    renderNavigator({ numPages: 4, currentPage: 2 });
    const tabs = getTabs();
    expect(tabs).toHaveLength(4);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('updates selection and chip when the parent advances the page', () => {
    const utils = renderNavigator({ numPages: 5, currentPage: 1 });
    expect(getTabs()[0]).toHaveAttribute('aria-selected', 'true');
    rerenderNavigator(utils, { currentPage: 3 });
    expect(getTabs()[2]).toHaveAttribute('aria-selected', 'true');
    expect(getTabs()[0]).toHaveAttribute('aria-selected', 'false');
    expect(getChip()).toHaveTextContent('Page 3 of 5');
  });

  it('updates the chip and tabs when the parent changes numPages', () => {
    const utils = renderNavigator({ numPages: 3, currentPage: 2 });
    expect(getChip()).toHaveTextContent('Page 2 of 3');
    rerenderNavigator(utils, { numPages: 6 });
    expect(getTabs()).toHaveLength(6);
    expect(getChip()).toHaveTextContent('Page 2 of 6');
    expect(getTabs()[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('drops tabs beyond the new smaller page count', () => {
    const utils = renderNavigator({ numPages: 5, currentPage: 2 });
    expect(getTabs()).toHaveLength(5);
    rerenderNavigator(utils, { numPages: 2 });
    expect(getTabs()).toHaveLength(2);
    expect(getTabs()[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps a stable callback contract across parent-driven updates', async () => {
    const user = userEvent.setup();
    const utils = renderNavigator({ numPages: 5, currentPage: 1 });
    await user.click(getTabs()[1]);
    expect(utils.props.onPageChange).toHaveBeenLastCalledWith(2);
    rerenderNavigator(utils, { currentPage: 2 });
    await user.click(getTabs()[3]);
    expect(utils.props.onPageChange).toHaveBeenLastCalledWith(4);
    expect(utils.props.onPageChange).toHaveBeenCalledTimes(2);
  });

  it('renders the rail and chip containers with structural classes', () => {
    renderNavigator();
    expect(
      document.querySelector('.pdf-thumbnail-navigator-rail')
    ).toBeInTheDocument();
    expect(
      document.querySelector('.pdf-mobile-chip-container')
    ).toBeInTheDocument();
    expect(document.querySelector('.pdf-mobile-chip')).toBeInTheDocument();
  });
});
