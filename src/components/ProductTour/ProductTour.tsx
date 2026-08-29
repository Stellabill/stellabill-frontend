import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import './ProductTour.css';

export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ProductTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onDismiss: () => void;
}

export default function ProductTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  onDismiss,
}: ProductTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const currentStep = steps[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  // Calculate spotlight and tooltip position
  const updatePositions = useCallback(() => {
    if (!currentStep || !isOpen) return;

    const targetElement = document.querySelector(currentStep.target);
    if (!targetElement) {
      console.warn(`Tour target not found: ${currentStep.target}`);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    setSpotlightRect(rect);

    // Calculate tooltip position based on placement
    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) return;

    const tooltipRect = tooltipEl.getBoundingClientRect();
    const padding = currentStep.spotlightPadding || 8;
    const placement = currentStep.placement || 'bottom';

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top - tooltipRect.height - padding;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + padding;
        break;
      case 'center':
        top = window.innerHeight / 2 - tooltipRect.height / 2;
        left = window.innerWidth / 2 - tooltipRect.width / 2;
        break;
    }

    // Keep tooltip within viewport
    const margin = 16;
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));

    setTooltipPosition({ top, left });
  }, [currentStep, isOpen]);

  // Handle resize and scroll
  useEffect(() => {
    if (!isOpen) return;

    updatePositions();

    const handleResize = () => updatePositions();
    const handleScroll = () => updatePositions();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, currentStepIndex, updatePositions]);

  // Store and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Focus trap within tooltip
  useEffect(() => {
    if (!isOpen || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const focusableElements = tooltip.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    tooltip.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      tooltip.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (isLast) {
      onComplete();
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleShowLater = () => {
    onDismiss();
    onClose();
  };

  if (!isOpen) return null;

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const tooltipVariants = shouldReduceMotion
    ? {}
    : {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { type: 'spring', damping: 25, stiffness: 300 },
        },
        exit: { opacity: 0, scale: 0.95 },
      };

  return (
    <AnimatePresence>
      <div
        className="product-tour"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-content"
      >
        {/* Overlay with cutout spotlight */}
        <motion.div
          className="product-tour__overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleClose}
          aria-hidden="true"
        >
          {spotlightRect && (
            <svg className="product-tour__spotlight-svg" aria-hidden="true">
              <defs>
                <mask id="spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <rect
                    x={spotlightRect.left - (currentStep.spotlightPadding || 8)}
                    y={spotlightRect.top - (currentStep.spotlightPadding || 8)}
                    width={spotlightRect.width + (currentStep.spotlightPadding || 8) * 2}
                    height={spotlightRect.height + (currentStep.spotlightPadding || 8) * 2}
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.7)"
                mask="url(#spotlight-mask)"
              />
            </svg>
          )}

          {spotlightRect && (
            <motion.div
              className="product-tour__spotlight-ring"
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
              style={{
                left: spotlightRect.left - (currentStep.spotlightPadding || 8),
                top: spotlightRect.top - (currentStep.spotlightPadding || 8),
                width: spotlightRect.width + (currentStep.spotlightPadding || 8) * 2,
                height: spotlightRect.height + (currentStep.spotlightPadding || 8) * 2,
              }}
              aria-hidden="true"
            />
          )}
        </motion.div>

        {/* Tooltip Card */}
        <motion.div
          ref={tooltipRef}
          className="product-tour__tooltip"
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="product-tour__header">
            <div className="product-tour__title-row">
              <Sparkles size={20} className="product-tour__icon" aria-hidden="true" />
              <h2 id="tour-title" className="product-tour__title">
                {currentStep.title}
              </h2>
            </div>
            <button
              type="button"
              className="product-tour__close"
              onClick={handleClose}
              aria-label="Close tour"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div id="tour-content" className="product-tour__content">
            {currentStep.content}
          </div>

          {/* Progress Indicator */}
          <div className="product-tour__progress" role="group" aria-label="Tour progress">
            <div className="product-tour__dots" role="presentation">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`product-tour__dot${index === currentStepIndex ? ' product-tour__dot--active' : ''}`}
                  aria-current={index === currentStepIndex ? 'step' : undefined}
                  aria-label={`Step ${index + 1} of ${steps.length}${index === currentStepIndex ? ' (current)' : ''}`}
                />
              ))}
            </div>
            <span className="product-tour__step-label" aria-live="polite">
              {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          {/* Actions */}
          <div className="product-tour__actions">
            <button
              type="button"
              className="product-tour__button product-tour__button--text"
              onClick={handleShowLater}
            >
              Show me later
            </button>

            <div className="product-tour__nav">
              <button
                type="button"
                className="product-tour__button product-tour__button--secondary"
                onClick={handleBack}
                disabled={isFirst}
                aria-label="Previous step"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Back
              </button>

              {currentStep.action && (
                <button
                  type="button"
                  className="product-tour__button product-tour__button--secondary"
                  onClick={currentStep.action.onClick}
                >
                  {currentStep.action.label}
                </button>
              )}

              <button
                type="button"
                className="product-tour__button product-tour__button--primary"
                onClick={handleNext}
                aria-label={isLast ? 'Complete tour' : 'Next step'}
              >
                {isLast ? 'Done' : 'Next'}
                {!isLast && <ChevronRight size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
