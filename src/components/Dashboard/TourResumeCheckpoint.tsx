import { useProductTour } from "./ProductTourProvider";
import styles from "./ProductTour.module.css";

export default function TourResumeCheckpoint() {
  const { checkpoint, resumeTour, clearCheckpoint, isTourActive } =
    useProductTour();

  if (!checkpoint || isTourActive) return null;

  return (
    <div
      className={styles.checkpointChip}
      role="status"
      aria-label={`Tour paused at step: ${checkpoint.title}`}
    >
      <span className={styles.checkpointText}>
        Tour paused at step {checkpoint.stepIndex + 1}: {checkpoint.title}
      </span>
      <button
        className={styles.checkpointResume}
        onClick={resumeTour}
        aria-label="Resume product tour"
      >
        Continue
      </button>
      <button
        className={styles.checkpointDismiss}
        onClick={clearCheckpoint}
        aria-label="Dismiss tour checkpoint"
      >
        Dismiss
      </button>
    </div>
  );
}
