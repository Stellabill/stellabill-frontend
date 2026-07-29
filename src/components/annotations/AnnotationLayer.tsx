import { useState, useCallback } from "react";
import AnnotationPin from "./AnnotationPin";
import AnnotationPanel from "./AnnotationPanel";
import { Annotation, AnnotationCreate } from "./AnnotationTypes";
import "./AnnotationLayer.css";

interface AnnotationLayerProps {
  invoiceId: string;
  children: React.ReactNode;
  annotations: Annotation[];
  onAddAnnotation: (create: AnnotationCreate) => void;
  onAddComment: (annotationId: string, body: string) => void;
  onResolve: (annotationId: string) => void;
  onReopen: (annotationId: string) => void;
  isAnnotatable?: boolean;
}

export default function AnnotationLayer({
  invoiceId,
  children,
  annotations,
  onAddAnnotation,
  onAddComment,
  onResolve,
  onReopen,
  isAnnotatable = false,
}: AnnotationLayerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const invoiceAnnotations = annotations.filter((a) => a.invoiceId === invoiceId);
  const activeAnnotation = invoiceAnnotations.find((a) => a.id === activeId) ?? null;

  const handlePinClick = useCallback((id: string) => {
    setActiveId(id);
    setIsPanelOpen(true);
  }, []);

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const handleLayerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAnnotatable) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const top = ((e.clientY - rect.top) / rect.height) * 100;
      const left = ((e.clientX - rect.left) / rect.width) * 100;
      onAddAnnotation({ type: "sticky", invoiceId, top, left });
    },
    [isAnnotatable, invoiceId, onAddAnnotation]
  );

  return (
    <div className="annotation-layer-root">
      <div
        className={`annotation-layer-content ${isAnnotatable ? "annotation-layer-content--annotatable" : ""}`}
        onClick={handleLayerClick}
        role={isAnnotatable ? "region" : undefined}
        aria-label={isAnnotatable ? "Invoice content with annotations" : undefined}
      >
        {children}

        {invoiceAnnotations.map((annotation) => (
          <AnnotationPin
            key={annotation.id}
            annotation={annotation}
            isActive={annotation.id === activeId}
            onClick={() => handlePinClick(annotation.id)}
          />
        ))}
      </div>

      {isPanelOpen && (
        <AnnotationPanel
          annotation={activeAnnotation}
          onClose={handlePanelClose}
          onAddComment={onAddComment}
          onResolve={onResolve}
          onReopen={onReopen}
        />
      )}
    </div>
  );
}
