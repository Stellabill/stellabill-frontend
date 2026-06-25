import { useEffect, useState, useRef } from "react";
import { useProductTour, TourStepInfo } from "./ProductTourProvider";
import styles from "./ProductTour.module.css";
import { X } from "lucide-react";

interface TourSpotlightProps {
  step: TourStepInfo;
}

const PADDING = 10;

export default function TourSpotlight({ step }: TourSpotlightProps) {
  const { nextStep, prevStep, endTour, currentStep, totalSteps } =
    useProductTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  useEffect(() => {
    const targetElement = document.querySelector(`[data-tour-id="${step.targetId}"]`);
    if (targetElement) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTargetRect(entry.target.getBoundingClientRect());
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(targetElement);

      const resizeObserver = new ResizeObserver(() => {
        setTargetRect(targetElement.getBoundingClientRect());
      });
      resizeObserver.observe(targetElement);
      resizeObserver.observe(document.body);

      return () => {
        observer.disconnect();
        resizeObserver.disconnect();
      };
    }
  }, [step.targetId]);

  useEffect(() => {
    nextButtonRef.current?.focus();
  }, [step]);

  const getTooltipPosition = () => {
    if (!targetRect || !tooltipRef.current) return {};

    const tooltipHeight = tooltipRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - targetRect.bottom;

    let top;
    if (spaceBelow > tooltipHeight + PADDING) {
      // Position below
      top = targetRect.bottom + PADDING;
    } else {
      // Position above
      top = targetRect.top - tooltipHeight - PADDING;
    }

    const left = Math.max(
      PADDING,
      Math.min(
        targetRect.left + targetRect.width / 2 - 160, // 160 is half of tooltip width
        window.innerWidth - 320 - PADDING
      )
    );

    return { top, left };
  };

  const spotlightPath = targetRect
    ? `M0,0H${window.innerWidth}V${window.innerHeight}H0z M${targetRect.x - PADDING},${targetRect.y - PADDING} h${targetRect.width + 2 * PADDING} a${PADDING},${PADDING} 0 0 1 ${PADDING},${PADDING} v${targetRect.height} a${PADDING},${PADDING} 0 0 1 -${PADDING},${PADDING} h-${targetRect.width} a${PADDING},${PADDING} 0 0 1 -${PADDING},-${PADDING} v-${targetRect.height} a${PADDING},${PADDING} 0 0 1 ${PADDING},-${PADDING} z`
    : "";

  return (
    <>
      <div
        className={`${styles.spotlightOverlay} ${
          prefersReducedMotion ? styles.reducedMotion : ""
        }`}
        aria-hidden="true"
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}>
          <path
            className={`${styles.spotlightPath} ${
              prefersReducedMotion ? styles.reducedMotion : ""
            }`}
            fillRule="evenodd"
            fill="currentColor"
            d={spotlightPath}
          />
        </svg>
      </div>

      <div
        ref={tooltipRef}
        className={`${styles.tooltipCard} ${
          prefersReducedMotion ? styles.reducedMotion : ""
        }`}
        style={getTooltipPosition()}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
      >
        <div className={styles.tooltipHeader}>
          <h3 id="tour-title" className={styles.tooltipTitle}>
            {step.title}
          </h3>
          <button
            className={styles.skipButton}
            onClick={() => endTour(false)}
            aria-label="Skip tour"
          >
            Skip
          </button>
        </div>
        <div id="tour-body" className={styles.tooltipBody}>
          {step.content}
        </div>
        <div className={styles.tooltipFooter}>
          <span className={styles.progressIndicator}>
            {currentStep + 1} / {totalSteps}
          </span>
          <div className={styles.navigation}>
            {currentStep > 0 && (
              <button
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={prevStep}
              >
                Back
              </button>
            )}
            <button
              ref={nextButtonRef}
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={nextStep}
            >
              {currentStep === totalSteps - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}