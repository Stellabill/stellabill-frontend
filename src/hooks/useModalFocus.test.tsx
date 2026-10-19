import { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useModalFocus } from './useModalFocus';

afterEach(() => {
  vi.useRealTimers();
});

const advanceFocusTimer = () => {
  act(() => {
    vi.advanceTimersByTime(50);
  });
};

describe('useModalFocus', () => {
  it('moves Tab from outside the dialog to its first visible focusable element', () => {
    vi.useFakeTimers();

    function ModalHarness() {
      const modalRef = useRef<HTMLDivElement>(null);
      useModalFocus(modalRef, { isOpen: true, onClose: vi.fn() });

      return (
        <>
          <button>Outside</button>
          <div ref={modalRef}>
            <button hidden>Hidden</button>
            <button aria-hidden="true">Aria hidden</button>
            <div inert="">
              <button>Inert</button>
            </div>
            <button>First</button>
            <button>Last</button>
          </div>
        </>
      );
    }

    render(<ModalHarness />);
    advanceFocusTimer();
    screen.getByRole('button', { name: 'Outside' }).focus();

    fireEvent.keyDown(document, { key: 'Tab' });

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    vi.useFakeTimers();

    function ModalHarness() {
      const modalRef = useRef<HTMLDivElement>(null);
      useModalFocus(modalRef, { isOpen: true, onClose: vi.fn() });

      return (
        <div ref={modalRef}>
          <button>First</button>
          <button>Last</button>
        </div>
      );
    }

    render(<ModalHarness />);
    advanceFocusTimer();
    screen.getByRole('button', { name: 'First' }).focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  it('allows only the top-most open modal to handle Escape', () => {
    vi.useFakeTimers();
    const onBaseClose = vi.fn();
    const onTopClose = vi.fn();

    function ModalHarness() {
      const [baseOpen, setBaseOpen] = useState(true);
      const [topOpen, setTopOpen] = useState(true);
      const baseRef = useRef<HTMLDivElement>(null);
      const topRef = useRef<HTMLDivElement>(null);

      useModalFocus(baseRef, {
        isOpen: baseOpen,
        onClose: () => {
          onBaseClose();
          setBaseOpen(false);
        },
      });
      useModalFocus(topRef, {
        isOpen: topOpen,
        onClose: () => {
          onTopClose();
          setTopOpen(false);
        },
      });

      return (
        <>
          {baseOpen && <div ref={baseRef}><button>Base modal</button></div>}
          {topOpen && <div ref={topRef}><button>Top modal</button></div>}
        </>
      );
    }

    render(<ModalHarness />);
    advanceFocusTimer();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(onTopClose).toHaveBeenCalledTimes(1);
    expect(onBaseClose).not.toHaveBeenCalled();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(onBaseClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to the fallback when the opener was removed', () => {
    vi.useFakeTimers();

    function ModalHarness() {
      const [isOpen, setIsOpen] = useState(false);
      const [showOpener, setShowOpener] = useState(true);
      const modalRef = useRef<HTMLDivElement>(null);
      const fallbackRef = useRef<HTMLButtonElement>(null);

      useModalFocus(modalRef, {
        isOpen,
        onClose: () => setIsOpen(false),
        fallbackFocusRef: fallbackRef,
      });

      return (
        <>
          {showOpener && <button onClick={() => setIsOpen(true)}>Open</button>}
          <button ref={fallbackRef}>Fallback</button>
          {isOpen && (
            <div ref={modalRef}>
              <button onClick={() => {
                setShowOpener(false);
                setIsOpen(false);
              }}>Close</button>
            </div>
          )}
        </>
      );
    }

    render(<ModalHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    advanceFocusTimer();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.getByRole('button', { name: 'Fallback' })).toHaveFocus();
  });
});
