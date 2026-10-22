import { useEffect, useRef, RefObject } from 'react';

interface UseModalFocusOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement>;
  fallbackFocusRef?: RefObject<HTMLElement>;
}

const modalStack: symbol[] = [];

const isVisible = (element: HTMLElement) => {
  let current: HTMLElement | null = element;

  while (current) {
    if (
      current.hidden ||
      current.hasAttribute('inert') ||
      current.getAttribute('aria-hidden') === 'true'
    ) {
      return false;
    }

    const { display, visibility } = window.getComputedStyle(current);
    if (display === 'none' || visibility === 'hidden' || visibility === 'collapse') {
      return false;
    }

    current = current.parentElement;
  }

  return true;
};

const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    element =>
      element.isConnected &&
      !element.matches(':disabled') &&
      isVisible(element)
  );

/**
 * A reusable hook to manage accessibility for modals.
 *
 * Features:
 * - Keeps keyboard focus within the top-most modal.
 * - Restores focus to the previously active element when it remains in the document.
 * - Calls onClose for Escape only on the top-most modal.
 * - Focuses a specific element or the first visible focusable element when opened.
 *
 * @param modalRef Reference to the modal's container element.
 * @param options Configuration options for focus management.
 * @param options.isOpen Boolean indicating if the modal is currently open.
 * @param options.onClose Callback function to close the modal (triggered by Escape).
 * @param options.initialFocusRef Optional reference to an element that should be focused first.
 * @param options.fallbackFocusRef Optional focus target if the previous element was removed.
 */
export function useModalFocus(
  modalRef: RefObject<HTMLElement>,
  { isOpen, onClose, initialFocusRef, fallbackFocusRef }: UseModalFocusOptions
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalIdRef = useRef(Symbol('modal'));
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      const timer = setTimeout(() => {
        const initialFocus = initialFocusRef?.current;
        if (
          initialFocus?.isConnected &&
          !initialFocus.matches(':disabled') &&
          isVisible(initialFocus)
        ) {
          initialFocus.focus();
        } else {
          const focusableElements = modalRef.current
            ? getFocusableElements(modalRef.current)
            : [];
          focusableElements[0]?.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    }

    const previousFocus = previousFocusRef.current;
    if (!previousFocus) return;

    if (previousFocus.isConnected) {
      previousFocus.focus();
    } else {
      const fallback = fallbackFocusRef?.current;
      (fallback?.isConnected ? fallback : document.body).focus();
    }
  }, [isOpen, initialFocusRef, fallbackFocusRef, modalRef]);

  useEffect(() => {
    if (!isOpen) return;

    const modalId = modalIdRef.current;
    modalStack.push(modalId);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== modalId) return;

      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = getFocusableElements(modalRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const focusIsInside = activeElement instanceof Node && modalRef.current.contains(activeElement);

      if (!focusIsInside) {
        (event.shiftKey ? lastElement : firstElement).focus();
        event.preventDefault();
      } else if (event.shiftKey && activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      } else if (!event.shiftKey && activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const stackIndex = modalStack.lastIndexOf(modalId);
      if (stackIndex !== -1) modalStack.splice(stackIndex, 1);
    };
  }, [isOpen, modalRef]);
}
