import { type Annotation, AnnotationType, ResolveState } from "./AnnotationTypes";

interface AnnotationPinProps {
  annotation: Annotation;
  isActive: boolean;
  onClick?: () => void;
}

const typeConfig: Record<AnnotationType, { label: string; color: string }> = {
  sticky: { label: "Note", color: "var(--color-annotation-sticky, #fbbf24)" },
  highlight: { label: "Highlight", color: "var(--color-annotation-highlight, #818cf8)" },
};

const DEFAULT_TYPE_CONFIG = {
  label: "Note",
  color: "var(--color-annotation-sticky, #fbbf24)",
};

const resolveIcons: Record<ResolveState, string> = {
  open: "\u{1F4DD}",
  resolved: "\u2705",
  reopened: "\u{1F504}",
};

const DEFAULT_RESOLVE_ICON = "\u{1F4DD}";

export default function AnnotationPin({ annotation, isActive, onClick }: AnnotationPinProps) {
  if (!annotation) {
    return null;
  }

  const config = typeConfig[annotation.type] ?? DEFAULT_TYPE_CONFIG;
  const resolveState = annotation.resolveState ?? "open";
  const icon = resolveIcons[resolveState as ResolveState] ?? DEFAULT_RESOLVE_ICON;
  const commentCount = Array.isArray(annotation.comments) ? annotation.comments.length : 0;
  const top = typeof annotation.top === "number" && !Number.isNaN(annotation.top) ? annotation.top : 0;
  const left = typeof annotation.left === "number" && !Number.isNaN(annotation.left) ? annotation.left : 0;

  return (
    <button
      type="button"
      className="annotation-pin"
      style={{
        position: "absolute",
        top: `${top}%`,
        left: `${left}%`,
        backgroundColor: config.color,
        borderColor: isActive ? "var(--color-focus-ring, #3b82f6)" : config.color,
      }}
      onClick={onClick}
      aria-label={`${config.label}: ${commentCount} comment(s), ${resolveState}`}
      aria-pressed={isActive}
      data-annotation-id={annotation.id}
      data-resolve-state={resolveState}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="annotation-pin-count" aria-hidden="true">
        {commentCount}
      </span>
    </button>
  );
}

