export type AnnotationType = "sticky" | "highlight";

export type ResolveState = "open" | "resolved" | "reopened";

export interface AnnotationComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Annotation {
  id: string;
  type: AnnotationType;
  invoiceId: string;
  top: number;
  left: number;
  resolveState: ResolveState;
  comments: AnnotationComment[];
  createdAt: string;
  createdBy: string;
}

export type AnnotationCreate = {
  type: AnnotationType;
  invoiceId: string;
  top: number;
  left: number;
};
