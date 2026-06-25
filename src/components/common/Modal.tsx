import React, { useRef, MouseEvent } from 'react';
import { useModalFocus } from '../../hooks/useModalFocus';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useModalFocus(modalRef, { isOpen, onClose, initialFocusRef });

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={(e: MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div 
        className={`w-full ${maxWidthClasses[maxWidth]} bg-[#00060f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300`}
        ref={modalRef}
      >
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
          <button
            ref={initialFocusRef}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {description && (
          <p id="modal-description" className="px-6 pb-4 text-sm text-slate-400">
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
