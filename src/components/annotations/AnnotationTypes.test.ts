import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  AnnotationType,
  ResolveState,
  AnnotationComment,
  Annotation,
  AnnotationCreate,
} from "./AnnotationTypes";
import AnnotationPin from "./AnnotationPin";
import AnnotationPanel from "./AnnotationPanel";

// ---------------------------------------------------------------------------
// Shared fixtures â€” satisfy each interface in full so TypeScript confirms
// the shape at compile time.  Invalid shapes are tested below via runtime
// narrowing helpers.
// ---------------------------------------------------------------------------

const ANNOTATION_TYPES: AnnotationType[] = ["sticky", "highlight"];
const RESOLVE_STATES: ResolveState[] = ["open", "resolved", "reopened"];

const makeComment = (overrides: Partial<AnnotationComment> = {}): AnnotationComment => ({
  id: "c-1",
  author: "Alice",
  body: "Check this amount",
  createdAt: "2026-07-28",
  ...overrides,
});

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: "ann-1",
  type: "sticky",
  invoiceId: "inv-1",
  top: 25,
  left: 30,
  resolveState: "open",
  comments: [],
  createdAt: "2026-07-28",
  createdBy: "Alice",
  ...overrides,
});

const makeCreate = (overrides: Partial<AnnotationCreate> = {}): AnnotationCreate => ({
  type: "sticky",
  invoiceId: "inv-1",
  top: 25,
  left: 30,
  ...overrides,
});

// ---------------------------------------------------------------------------
// 1. AnnotationType â€” union exhaustiveness and membership
// ---------------------------------------------------------------------------

describe("AnnotationType", () => {
  it("has exactly two members: sticky and highlight", () => {
    expect(ANNOTATION_TYPES).toHaveLength(2);
    expect(ANNOTATION_TYPES).toContain("sticky");
    expect(ANNOTATION_TYPES).toContain("highlight");
  });

  it("is assignable from literal string 'sticky'", () => {
    const t: AnnotationType = "sticky";
    expect(t).toBe("sticky");
  });

  it("is assignable from literal string 'highlight'", () => {
    const t: AnnotationType = "highlight";
    expect(t).toBe("highlight");
  });

  it("rejects values outside the union at runtime (narrowing guard)", () => {
    const isValidType = (v: unknown): v is AnnotationType =>
      v === "sticky" || v === "highlight";

    expect(isValidType("sticky")).toBe(true);
    expect(isValidType("highlight")).toBe(true);
    expect(isValidType("unknown")).toBe(false);
    expect(isValidType("")).toBe(false);
    expect(isValidType(null)).toBe(false);
    expect(isValidType(undefined)).toBe(false);
    expect(isValidType(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. ResolveState â€” union exhaustiveness and state transitions
// ---------------------------------------------------------------------------

describe("ResolveState", () => {
  it("has exactly three members: open, resolved, reopened", () => {
    expect(RESOLVE_STATES).toHaveLength(3);
    expect(RESOLVE_STATES).toContain("open");
    expect(RESOLVE_STATES).toContain("resolved");
    expect(RESOLVE_STATES).toContain("reopened");
  });

  it("rejects values outside the union at runtime", () => {
    const isValidState = (v: unknown): v is ResolveState =>
      v === "open" || v === "resolved" || v === "reopened";

    expect(isValidState("open")).toBe(true);
    expect(isValidState("resolved")).toBe(true);
    expect(isValidState("reopened")).toBe(true);
    expect(isValidState("closed")).toBe(false);
    expect(isValidState("pending")).toBe(false);
    expect(isValidState("")).toBe(false);
    expect(isValidState(null)).toBe(false);
  });

  it("models the open â†’ resolved transition", () => {
    let state: ResolveState = "open";
    expect(state).toBe("open");
    state = "resolved";
    expect(state).toBe("resolved");
  });

  it("models the resolved â†’ reopened transition", () => {
    let state: ResolveState = "resolved";
    state = "reopened";
    expect(state).toBe("reopened");
  });

  it("models the reopened â†’ resolved transition (re-resolve)", () => {
    let state: ResolveState = "reopened";
    state = "resolved";
    expect(state).toBe("resolved");
  });
});

// ---------------------------------------------------------------------------
// 3. AnnotationComment â€” interface shape and field requirements
// ---------------------------------------------------------------------------

describe("AnnotationComment", () => {
  it("accepts a fully-populated comment object", () => {
    const comment = makeComment();
    expect(comment.id).toBe("c-1");
    expect(comment.author).toBe("Alice");
    expect(comment.body).toBe("Check this amount");
    expect(comment.createdAt).toBe("2026-07-28");
  });

  it("preserves every field without mutation", () => {
    const original = makeComment({ id: "c-99", body: "Hello" });
    const copy: AnnotationComment = { ...original };
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original); // different reference
  });

  it("allows an empty body string (boundary: blank comment)", () => {
    const comment = makeComment({ body: "" });
    expect(comment.body).toBe("");
  });

  it("allows a very long body string (boundary: large text)", () => {
    const longBody = "x".repeat(10_000);
    const comment = makeComment({ body: longBody });
    expect(comment.body).toHaveLength(10_000);
  });

  it("enforces required fields when constructed manually", () => {
    const isValidComment = (v: unknown): v is AnnotationComment => {
      if (typeof v !== "object" || v === null) return false;
      const c = v as Record<string, unknown>;
      return (
        typeof c.id === "string" &&
        typeof c.author === "string" &&
        typeof c.body === "string" &&
        typeof c.createdAt === "string"
      );
    };

    expect(isValidComment(makeComment())).toBe(true);
    expect(isValidComment({ id: "1", author: "A", body: "B" })).toBe(false); // missing createdAt
    expect(isValidComment({ id: "1", author: "A", createdAt: "x" })).toBe(false); // missing body
    expect(isValidComment(null)).toBe(false);
    expect(isValidComment("string")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Annotation â€” full interface shape, comments array, boundary values
// ---------------------------------------------------------------------------

describe("Annotation", () => {
  it("accepts a fully-populated annotation with no comments", () => {
    const ann = makeAnnotation();
    expect(ann.id).toBe("ann-1");
    expect(ann.type).toBe("sticky");
    expect(ann.invoiceId).toBe("inv-1");
    expect(ann.resolveState).toBe("open");
    expect(ann.comments).toHaveLength(0);
  });

  it("accepts a highlight annotation", () => {
    const ann = makeAnnotation({ type: "highlight" });
    expect(ann.type).toBe("highlight");
  });

  it("accepts all three resolve states", () => {
    for (const state of RESOLVE_STATES) {
      const ann = makeAnnotation({ resolveState: state });
      expect(ann.resolveState).toBe(state);
    }
  });

  it("carries its comments array unchanged", () => {
    const comments = [makeComment({ id: "c-1" }), makeComment({ id: "c-2" })];
    const ann = makeAnnotation({ comments });
    expect(ann.comments).toHaveLength(2);
    expect(ann.comments[0].id).toBe("c-1");
    expect(ann.comments[1].id).toBe("c-2");
  });

  it("allows top/left at boundary values 0 and 100", () => {
    const topLeft = makeAnnotation({ top: 0, left: 0 });
    expect(topLeft.top).toBe(0);
    expect(topLeft.left).toBe(0);

    const bottomRight = makeAnnotation({ top: 100, left: 100 });
    expect(bottomRight.top).toBe(100);
    expect(bottomRight.left).toBe(100);
  });

  it("allows fractional top/left coordinates", () => {
    const ann = makeAnnotation({ top: 33.33, left: 66.67 });
    expect(ann.top).toBeCloseTo(33.33);
    expect(ann.left).toBeCloseTo(66.67);
  });

  it("accepts multiple comments reflecting a real comment thread", () => {
    const thread: AnnotationComment[] = [
      makeComment({ id: "c-1", author: "Alice", body: "First" }),
      makeComment({ id: "c-2", author: "Bob", body: "Second" }),
      makeComment({ id: "c-3", author: "Alice", body: "Third" }),
    ];
    const ann = makeAnnotation({ comments: thread });
    expect(ann.comments).toHaveLength(3);
    expect(ann.comments.map((c) => c.author)).toEqual(["Alice", "Bob", "Alice"]);
  });
});

// ---------------------------------------------------------------------------
// 5. AnnotationCreate â€” subset shape and type/invoiceId requirements
// ---------------------------------------------------------------------------

describe("AnnotationCreate", () => {
  it("accepts a valid create payload", () => {
    const create = makeCreate();
    expect(create.type).toBe("sticky");
    expect(create.invoiceId).toBe("inv-1");
    expect(create.top).toBe(25);
    expect(create.left).toBe(30);
  });

  it("does not include id, resolveState, or comments (omitted fields)", () => {
    const create = makeCreate() as Record<string, unknown>;
    expect("id" in create).toBe(false);
    expect("resolveState" in create).toBe(false);
    expect("comments" in create).toBe(false);
    expect("createdAt" in create).toBe(false);
    expect("createdBy" in create).toBe(false);
  });

  it("accepts both valid AnnotationType values", () => {
    for (const type of ANNOTATION_TYPES) {
      const create = makeCreate({ type });
      expect(create.type).toBe(type);
    }
  });

  it("allows boundary coordinates 0 and 100", () => {
    expect(makeCreate({ top: 0, left: 0 }).top).toBe(0);
    expect(makeCreate({ top: 100, left: 100 }).top).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 6. AnnotationPin â€” observable behaviour driven by AnnotationType /
//    ResolveState (verifies the type-to-UI contract).
// ---------------------------------------------------------------------------

describe("AnnotationPin â€” AnnotationType behaviour", () => {
  it("renders a sticky pin with the note aria-label", () => {
    render(
      <AnnotationPin
        annotation={makeAnnotation({ type: "sticky", comments: [] })}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(
      screen.getByRole("button", { name: /Note: 0 comment\(s\), open/i })
    ).toBeInTheDocument();
  });

  it("renders a highlight pin with the highlight aria-label", () => {
    render(
      <AnnotationPin
        annotation={makeAnnotation({ type: "highlight", comments: [] })}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(
      screen.getByRole("button", { name: /Highlight: 0 comment\(s\), open/i })
    ).toBeInTheDocument();
  });

  it("shows correct comment count in aria-label", () => {
    const comments = [makeComment({ id: "c-1" }), makeComment({ id: "c-2" })];
    render(
      <AnnotationPin
        annotation={makeAnnotation({ comments })}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(
      screen.getByRole("button", { name: /2 comment\(s\)/i })
    ).toBeInTheDocument();
  });

  it("is aria-pressed=false when not active", () => {
    render(
      <AnnotationPin
        annotation={makeAnnotation()}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("is aria-pressed=true when active", () => {
    render(
      <AnnotationPin
        annotation={makeAnnotation()}
        isActive={true}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(
      <AnnotationPin
        annotation={makeAnnotation()}
        isActive={false}
        onClick={onClick}
      />
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("AnnotationPin â€” ResolveState behaviour", () => {
  it("renders the open emoji for resolveState=open", () => {
    render(
      <AnnotationPin
        annotation={makeAnnotation({ resolveState: "open" })}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("data-resolve-state", "open");
  });

  it("renders the resolved emoji for resolveState=resolved", () => {
    render(
      <AnnotationPin
        annotation={makeAnnotation({ resolveState: "resolved" })}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("data-resolve-state", "resolved");
  });

  it("renders the reopened emoji for resolveState=reopened", () => {
    render(
      <AnnotationPin
        annotation={makeAnnotation({ resolveState: "reopened" })}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(screen.getByRole("button")).toHaveAttribute("data-resolve-state", "reopened");
  });

  it("reflects the resolve state in the aria-label", () => {
    render(
      <AnnotationPin
        annotation={makeAnnotation({ resolveState: "resolved" })}
        isActive={false}
        onClick={() => {}}
      />
    );
    expect(
      screen.getByRole("button", { name: /resolved/i })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 7. AnnotationPanel â€” observable behaviour driven by AnnotationComment /
//    ResolveState (verifies the type-to-UI contract).
// ---------------------------------------------------------------------------

describe("AnnotationPanel â€” null annotation", () => {
  it("renders nothing when annotation is null", () => {
    const { container } = render(
      <AnnotationPanel
        annotation={null}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("AnnotationPanel â€” AnnotationComment rendering", () => {
  it("shows empty-state message when comments array is empty", () => {
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ comments: [] })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    expect(
      screen.getByText("No comments yet. Add one below.")
    ).toBeInTheDocument();
  });

  it("renders each AnnotationComment with author and body", () => {
    const comments: AnnotationComment[] = [
      makeComment({ id: "c-1", author: "Alice", body: "First note" }),
      makeComment({ id: "c-2", author: "Bob", body: "Second note" }),
    ];
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ comments })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("First note")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Second note")).toBeInTheDocument();
  });

  it("renders the correct comment count", () => {
    const comments = [makeComment({ id: "c-1" }), makeComment({ id: "c-2" })];
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ comments })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    // Two comment bodies are in the DOM
    expect(
      document.querySelectorAll(".annotation-panel-comment").length
    ).toBe(2);
  });
});

describe("AnnotationPanel â€” AnnotationType label", () => {
  it("shows 'Sticky Note' heading for type=sticky", () => {
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ type: "sticky" })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    expect(screen.getByText("Sticky Note")).toBeInTheDocument();
  });

  it("shows 'Highlight' heading for type=highlight", () => {
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ type: "highlight" })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    expect(screen.getByText("Highlight")).toBeInTheDocument();
  });
});

describe("AnnotationPanel â€” ResolveState transitions", () => {
  it("shows 'Open' status badge for resolveState=open", () => {
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ resolveState: "open" })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /resolve annotation/i })
    ).toBeInTheDocument();
  });

  it("shows 'Resolved' status badge for resolveState=resolved", () => {
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ resolveState: "resolved" })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    expect(screen.getByText("Resolved")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reopen annotation/i })
    ).toBeInTheDocument();
  });

  it("calls onResolve when resolve button is clicked (open â†’ resolved)", async () => {
    const onResolve = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ id: "ann-1", resolveState: "open" })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={onResolve}
        onReopen={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /resolve annotation/i }));
    expect(onResolve).toHaveBeenCalledWith("ann-1");
  });

  it("calls onReopen when reopen button is clicked (resolved â†’ reopened)", async () => {
    const onReopen = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ id: "ann-1", resolveState: "resolved" })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={onReopen}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /reopen annotation/i }));
    expect(onReopen).toHaveBeenCalledWith("ann-1");
  });

  it("calls onResolve for a reopened annotation (reopened â†’ resolved)", async () => {
    const onResolve = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ id: "ann-1", resolveState: "reopened" })}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={onResolve}
        onReopen={vi.fn()}
      />
    );
    // reopened is not "resolved", so the Resolve button is shown
    await userEvent.click(screen.getByRole("button", { name: /resolve annotation/i }));
    expect(onResolve).toHaveBeenCalledWith("ann-1");
  });
});

describe("AnnotationPanel â€” comment submission", () => {
  it("calls onAddComment with annotationId and trimmed body on submit", async () => {
    const onAddComment = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ id: "ann-1" })}
        onClose={vi.fn()}
        onAddComment={onAddComment}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Add a comment...");
    await userEvent.type(textarea, "  new comment  ");
    await userEvent.click(screen.getByRole("button", { name: /submit comment/i }));
    expect(onAddComment).toHaveBeenCalledWith("ann-1", "new comment");
  });

  it("does not submit when comment is blank (boundary: whitespace-only)", async () => {
    const onAddComment = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation()}
        onClose={vi.fn()}
        onAddComment={onAddComment}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Add a comment...");
    await userEvent.type(textarea, "   ");
    await userEvent.click(screen.getByRole("button", { name: /submit comment/i }));
    expect(onAddComment).not.toHaveBeenCalled();
  });

  it("submit button is disabled when textarea is empty", () => {
    render(
      <AnnotationPanel
        annotation={makeAnnotation()}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /submit comment/i })
    ).toBeDisabled();
  });

  it("submits comment on Enter key (no shift)", async () => {
    const onAddComment = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation({ id: "ann-1" })}
        onClose={vi.fn()}
        onAddComment={onAddComment}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Add a comment...");
    await userEvent.type(textarea, "Enter test{Enter}");
    expect(onAddComment).toHaveBeenCalledWith("ann-1", "Enter test");
  });

  it("does NOT submit on Shift+Enter (allows newlines)", async () => {
    const onAddComment = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation()}
        onClose={vi.fn()}
        onAddComment={onAddComment}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Add a comment...");
    await userEvent.type(textarea, "line one{Shift>}{Enter}{/Shift}line two");
    expect(onAddComment).not.toHaveBeenCalled();
  });

  it("clears the textarea after successful submission", async () => {
    render(
      <AnnotationPanel
        annotation={makeAnnotation()}
        onClose={vi.fn()}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Add a comment...") as HTMLTextAreaElement;
    await userEvent.type(textarea, "some comment");
    await userEvent.click(screen.getByRole("button", { name: /submit comment/i }));
    expect(textarea.value).toBe("");
  });
});

describe("AnnotationPanel â€” close behaviour", () => {
  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation()}
        onClose={onClose}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /close annotation panel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    render(
      <AnnotationPanel
        annotation={makeAnnotation()}
        onClose={onClose}
        onAddComment={vi.fn()}
        onResolve={vi.fn()}
        onReopen={vi.fn()}
      />
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
