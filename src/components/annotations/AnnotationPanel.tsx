import { useState, useRef, useEffect } from "react";
import { Annotation, AnnotationComment } from "./AnnotationTypes";
import { X, MessageSquare, CheckCircle, RotateCcw } from "lucide-react";

interface AnnotationPanelProps {
  annotation: Annotation | null;
  onClose: () => void;
  onAddComment: (annotationId: string, body: string) => void;
  onResolve: (annotationId: string) => void;
  onReopen: (annotationId: string) => void;
}

export default function AnnotationPanel({
  annotation,
  onClose,
  onAddComment,
  onResolve,
  onReopen,
}: AnnotationPanelProps) {
  const [newComment, setNewComment] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (annotation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [annotation]);

  useEffect(() => {
    if (!annotation) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [annotation, onClose]);

  if (!annotation) return null;

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(annotation.id, newComment.trim());
      setNewComment("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isResolved = annotation.resolveState === "resolved";

  return (
    <aside
      className="annotation-panel"
      role="complementary"
      aria-label={`Annotation comments for ${annotation.type}`}
    >
      <div className="annotation-panel-header">
        <h3 className="annotation-panel-title">
          <MessageSquare size={16} aria-hidden="true" />
          {annotation.type === "sticky" ? "Sticky Note" : "Highlight"}
        </h3>
        <div className="annotation-panel-header-actions">
          {isResolved ? (
            <button
              type="button"
              className="annotation-panel-action-btn"
              onClick={() => onReopen(annotation.id)}
              aria-label="Reopen annotation"
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="annotation-panel-action-btn"
              onClick={() => onResolve(annotation.id)}
              aria-label="Resolve annotation"
            >
              <CheckCircle size={16} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="annotation-panel-action-btn"
            onClick={onClose}
            aria-label="Close annotation panel"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className={`annotation-panel-status ${
          isResolved ? "annotation-panel-status--resolved" : "annotation-panel-status--open"
        }`}
      >
        {isResolved ? "Resolved" : "Open"}
      </div>

      <div className="annotation-panel-comments" role="log" aria-label="Comments">
        {annotation.comments.length === 0 ? (
          <p className="annotation-panel-empty">No comments yet. Add one below.</p>
        ) : (
          annotation.comments.map((comment) => (
            <div key={comment.id} className="annotation-panel-comment">
              <div className="annotation-panel-comment-header">
                <span className="annotation-panel-comment-author">{comment.author}</span>
                <span className="annotation-panel-comment-time">{comment.createdAt}</span>
              </div>
              <p className="annotation-panel-comment-body">{comment.body}</p>
            </div>
          ))
        )}
      </div>

      <div className="annotation-panel-input-area">
        <label htmlFor="annotation-comment-input" className="sr-only">
          Add a comment
        </label>
        <textarea
          ref={inputRef}
          id="annotation-comment-input"
          className="annotation-panel-input"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
        <button
          type="button"
          className="annotation-panel-submit"
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          aria-label="Submit comment"
        >
          Comment
        </button>
      </div>
    </aside>
  );
}
