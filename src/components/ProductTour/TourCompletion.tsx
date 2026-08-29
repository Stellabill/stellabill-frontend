import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import './ProductTour.css';

interface TourCompletionProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actionLabel?: string;
}

export default function TourCompletion({
  isOpen,
  onClose,
  title = "You're all set!",
  message = "You've completed the tour. You're ready to start managing your subscriptions.",
  actionLabel = "Get started",
}: TourCompletionProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Store and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const cardVariants = shouldReduceMotion
    ? {}
    : {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: {
            type: 'spring',
            damping: 25,
            stiffness: 300,
            delay: 0.1,
          },
        },
        exit: { opacity: 0, scale: 0.95 },
      };

  const iconVariants = shouldReduceMotion
    ? {}
    : {
        hidden: { scale: 0, rotate: -180 },
        visible: {
          scale: 1,
          rotate: 0,
          transition: {
            type: 'spring',
            damping: 15,
            stiffness: 200,
            delay: 0.3,
          },
        },
      };

  return (
    <AnimatePresence>
      <div
        className="product-tour-completion"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-title"
        aria-describedby="completion-message"
      >
        <motion.div
          className="product-tour-completion__overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          aria-hidden="true"
        />

        <motion.div
          className="product-tour-completion__card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            className="product-tour-completion__icon-wrapper"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            aria-hidden="true"
          >
            <PartyPopper size={32} className="product-tour-completion__icon" />
          </motion.div>

          <h2 id="completion-title" className="product-tour-completion__title">
            {title}
          </h2>

          <p id="completion-message" className="product-tour-completion__message">
            {message}
          </p>

          <button
            type="button"
            className="product-tour-completion__action"
            onClick={onClose}
            autoFocus
          >
            {actionLabel}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
