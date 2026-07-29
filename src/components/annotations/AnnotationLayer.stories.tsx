import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import AnnotationLayer from "./AnnotationLayer";
import { Annotation, AnnotationCreate } from "./AnnotationTypes";
import { Button } from "../common/Button";

const meta: Meta<typeof AnnotationLayer> = {
  title: "Annotations/AnnotationLayer",
  component: AnnotationLayer,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AnnotationLayer>;

const initialAnnotations: Annotation[] = [
  {
    id: "1",
    type: "sticky",
    invoiceId: "inv-1",
    top: 20,
    left: 40,
    resolveState: "open",
    comments: [
      { id: "c1", author: "Alice", body: "This total seems high. Can we verify?", createdAt: "2026-07-28" },
    ],
    createdAt: "2026-07-28",
    createdBy: "Alice",
  },
  {
    id: "2",
    type: "highlight",
    invoiceId: "inv-1",
    top: 60,
    left: 30,
    resolveState: "resolved",
    comments: [
      { id: "c2", author: "Bob", body: "Checked with vendor. Correct.", createdAt: "2026-07-27" },
    ],
    createdAt: "2026-07-27",
    createdBy: "Bob",
  },
];

export const Default: Story = {
  render: () => {
    const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
    const [annotatable, setAnnotatable] = useState(false);

    const handleAddAnnotation = (create: AnnotationCreate) => {
      const ann: Annotation = {
        id: `ann-${Date.now()}`,
        ...create,
        resolveState: "open",
        comments: [],
        createdAt: new Date().toISOString().split("T")[0],
        createdBy: "You",
      };
      setAnnotations((prev) => [...prev, ann]);
    };

    const handleAddComment = (annotationId: string, body: string) => {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId
            ? {
                ...a,
                comments: [
                  ...a.comments,
                  {
                    id: `c-${Date.now()}`,
                    author: "You",
                    body,
                    createdAt: new Date().toISOString().split("T")[0],
                  },
                ],
              }
            : a
        )
      );
    };

    const handleResolve = (annotationId: string) => {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === annotationId ? { ...a, resolveState: "resolved" as const } : a))
      );
    };

    const handleReopen = (annotationId: string) => {
      setAnnotations((prev) =>
        prev.map((a) => (a.id === annotationId ? { ...a, resolveState: "reopened" as const } : a))
      );
    };

    return (
      <div style={{ width: 600 }}>
        <div style={{ marginBottom: 12 }}>
          <Button onClick={() => setAnnotatable(!annotatable)}>
            {annotatable ? "Done annotating" : "Add annotation"}
          </Button>
        </div>
        <AnnotationLayer
          invoiceId="inv-1"
          annotations={annotations}
          onAddAnnotation={handleAddAnnotation}
          onAddComment={handleAddComment}
          onResolve={handleResolve}
          onReopen={handleReopen}
          isAnnotatable={annotatable}
        >
          <div
            style={{
              padding: 24,
              background: "#00060f",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff",
              minHeight: 300,
            }}
          >
            <h3>Invoice INV-001</h3>
            <p>Total: $1,234.56</p>
            <p>Status: Paid</p>
            <p>Click the &quot;Add annotation&quot; button then click anywhere to add a note.</p>
          </div>
        </AnnotationLayer>
      </div>
    );
  },
};
