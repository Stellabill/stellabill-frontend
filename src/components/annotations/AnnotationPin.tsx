import { type Annotation, AnnotationType, ResolveState } from "./AnnotationTypes";

interface AnnotationPinProps {
  annotation: Annotation;
  isActive: boolean;
  onClick: () => void;
}

const typeConfig: Record<AnnotationType, { label: string; color: string }> = {
  sticky: { label: "Note", color: "var(--color-annotation-sticky, #fbbf24)" },
  highlight: { label: "Highlight", color: "var(--color-annotation-highlight, #818cf8)" },
};

const resolveIcons: Record<ResolveState, string> = {
  open: "\u{1F4DD}",
  resolved: "\u2705",
  reopened: "\u{1F504}",
};

export default function AnnotationPin({ annotation, isActive, onClick }: AnnotationPinProps) {
  const config = typeConfig[annotation.type];

  return (
    <button
      type="button"
      className="annotation-pin"
      style={{
        position: "absolute",
        top: `${annotation.top}%`,
        left: `${annotation.left}%`,
        backgroundColor: config.color,
        borderColor: isActive ? "var(--color-focus-ring, #3b82f6)" : config.color,
      }}
      onClick={onClick}
      aria-label={`${config.label}: ${annotation.comments.length} comment(s), ${annotation.resolveState}`}
      aria-pressed={isActive}
      data-annotation-id={annotation.id}
      data-resolve-state={annotation.resolveState}
    >
      <span aria-hidden="true">{resolveIcons[annotation.resolveState]}</span>
      <span className="annotation-pin-count" aria-hidden="true">
        {annotation.comments.length}
      </span>
    </button>
  );
}
