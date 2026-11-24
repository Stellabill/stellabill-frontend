import React, { useRef, MouseEvent, RefObject } from 'react';
import { useModalFocus } from '../../hooks/useModalFocus';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** @deprecated Prefer `size`. Kept for backward compatibility. */
  maxWidth?: ModalSize;
  /** Width preset for the default modal panel. Defaults to `maxWidth` or `'md'`. */
  size?: ModalSize;
  /** Whether clicking the backdrop closes the modal. Defaults to `true`. */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape closes the modal. Defaults to `true`. */
  closeOnEscape?: boolean;
  /** Optional element ref to receive initial focus when the modal opens. */
  initialFocusRef?: RefObject<HTMLElement>;
  /** Custom `aria-labelledby` id. Defaults to `"modal-title"` when `title` is provided. */
  labelledBy?: string;
  /** Custom `aria-describedby` id. Defaults to `"modal-description"` when `description` is provided. */
  describedBy?: string;
  /** ARIA dialog role. Defaults to `"dialog"`. */
  role?: 'dialog' | 'alertdialog';
  /** Sets `aria-busy` on the dialog container (e.g. while an action is in flight). */
  busy?: boolean;
  /** When true, omits the default card chrome/header so custom-styled modals share overlay, focus trap, and ARIA wiring. */
  unstyled?: boolean;
  /** Optional extra classes for the overlay container. */
  overlayClassName?: string;
  /** Optional classes for the inner modal panel (replaces default card classes when `unstyled` is true). */
  contentClassName?: string;
  /** Optional `data-testid` for the overlay element. */
  overlayTestId?: string;
}

const maxWidthClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth,
  size,
  closeOnBackdrop = true,
  closeOnEscape = true,
  initialFocusRef,
  labelledBy,
  describedBy,
  role = 'dialog',
  busy,
  unstyled = false,
  overlayClassName,
  contentClassName,
  overlayTestId,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const resolvedInitialFocusRef = initialFocusRef ?? (unstyled ? undefined : closeButtonRef);
  const resolvedSize: ModalSize = size ?? maxWidth ?? 'md';
  const resolvedLabelledBy = labelledBy ?? (title ? 'modal-title' : undefined);
  const resolvedDescribedBy = describedBy ?? (description ? 'modal-description' : undefined);

  useModalFocus(modalRef, {
    isOpen,
    onClose,
    initialFocusRef: resolvedInitialFocusRef,
    closeOnEscape,
  });

  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const overlayClasses = [
    'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity',
    overlayClassName,
  ]
    .filter(Boolean)
    .join(' ');

  if (unstyled) {
    return (
      <div
        className={overlayClasses}
        onClick={handleBackdropClick}
        role={role}
        aria-modal="true"
        aria-labelledby={resolvedLabelledBy}
        aria-describedby={resolvedDescribedBy}
        aria-busy={busy === undefined ? undefined : busy}
        data-testid={overlayTestId}
      >
        <div
          className={contentClassName}
          ref={modalRef}
        >
          {children}
        </div>
      </div>
    );
  }

  const panelClasses = [
    `w-full ${maxWidthClasses[resolvedSize]} bg-[#00060f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300`,
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={overlayClasses}
      onClick={handleBackdropClick}
      role={role}
      aria-modal="true"
      aria-labelledby={resolvedLabelledBy}
      aria-describedby={resolvedDescribedBy}
      aria-busy={busy === undefined ? undefined : busy}
      data-testid={overlayTestId}
    >
      <div
        className={panelClasses}
        ref={modalRef}
      >
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 id={resolvedLabelledBy} className="text-xl font-bold text-white">{title}</h2>
          <button
            ref={closeButtonRef}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {description && (
          <p id={resolvedDescribedBy} className="px-6 pb-4 text-sm text-slate-400">
            {description}
          </p>
        )}

        <div className="p-6">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-3 p-6 pt-2 bg-white/2 border-t border-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
