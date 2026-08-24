import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  motion,
  useAnimation,
  useDragControls,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import { X } from "lucide-react";
import { useModalFocus } from "../../hooks/useModalFocus";
import "./BottomSheet.css";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  snapPoints?: [number, number];
}

const DRAG_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 400;

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  snapPoints,
}: BottomSheetProps) {
  const panelId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const dragControls = useDragControls();
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  const isDesktop = useCallback(() => window.innerWidth >= 720, []);

  useModalFocus(panelRef, { isOpen, onClose, initialFocusRef: closeButtonRef });

  useEffect(() => {
    if (isOpen && !isDesktop()) {
      document.body.style.overflow = "hidden";
      controls.start("visible");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, controls, isDesktop]);

  useEffect(() => {
    if (!isOpen || isDesktop()) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose, isDesktop]);

  const handleDragEnd = async (_: any, info: any) => {
    setIsDragging(false);
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    if (offset > DRAG_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      await controls.start("hidden");
      onClose();
    } else {
      controls.start("visible");
    }
  };

  const sheetVariants = {
    hidden: {
      y: "100%",
      transition: {
        type: prefersReducedMotion ? "tween" : "spring",
        damping: 25,
        stiffness: 300,
        duration: prefersReducedMotion ? 0.15 : undefined,
      },
    },
    visible: {
      y: 0,
      transition: {
        type: prefersReducedMotion ? "tween" : "spring",
        damping: 25,
        stiffness: 300,
        duration: prefersReducedMotion ? 0.15 : undefined,
      },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  if (isDesktop()) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="bottom-sheet-root">
          <motion.div
            className="bottom-sheet-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            id={panelId}
            className="bottom-sheet-panel"
            variants={sheetVariants}
            initial="hidden"
            animate={controls}
            exit="hidden"
            drag={prefersReducedMotion ? false : "y"}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
          >
            <div
              className="bottom-sheet-drag-area"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <span className="bottom-sheet-drag-handle" aria-hidden="true" />
            </div>

            <div className="bottom-sheet-header">
              <div className="bottom-sheet-header-text">
                {title && (
                  <h2 id={titleId} className="bottom-sheet-title">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descriptionId} className="bottom-sheet-description">
                    {description}
                  </p>
                )}
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="bottom-sheet-close-button"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div
              className="bottom-sheet-body"
              aria-busy={isDragging}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
