import { useEffect, useRef, RefObject } from 'react';

interface UseModalFocusOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement>;
  /**
   * Whether the Escape key should trigger `onClose`. Defaults to `true`.
   * Set to `false` to prevent dismissal while an action is in flight.
   */
  closeOnEscape?: boolean;
}

/**
 * A reusable hook to manage accessibility for modals.
 *
 * Features:
 * - Focus Trapping: Keeps focus within the modal during tabbing.
 * - Focus Restoration: Returns focus to the previously active element on close.
 * - Escape Key Support: Automatically calls the onClose handler when Escape is pressed.
 * - Initial Focus: Focuses a specific element or the first focusable element when opened.
 *
 * @param modalRef Reference to the modal's container element.
 * @param options Configuration options for focus management.
 * @param options.isOpen Boolean indicating if the modal is currently open.
 * @param options.onClose Callback function to close the modal (triggered by Escape).
 * @param options.initialFocusRef Optional reference to an element that should be focused first.
 * @param options.closeOnEscape Whether Escape should close the modal (default true).
 */
export function useModalFocus(
  modalRef: RefObject<HTMLElement>,
  { isOpen, onClose, initialFocusRef, closeOnEscape = true }: UseModalFocusOptions
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          // Default to the first focusable element
          const focusableElements = modalRef.current?.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements && focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
          }
        }
      }, 50);

      return () => clearTimeout(timer);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen, initialFocusRef, modalRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (closeOnEscape) {
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, modalRef, closeOnEscape]);
}
