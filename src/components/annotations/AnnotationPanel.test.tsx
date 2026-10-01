import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import AnnotationPanel from './AnnotationPanel';

// Derive the fixture types from the component's own module so the suite stays
// structurally in sync with the props the source actually requires.
type AnnotationPanelProps = ComponentProps<typeof AnnotationPanel>;
type Annotation = NonNullable<AnnotationPanelProps['annotation']>;
type AnnotationComment = Annotation['comments'][number];

const makeComment = (overrides: Partial<AnnotationComment> = {}): AnnotationComment => ({
  id: 'comment-1',
  author: 'Alice',
  body: 'Check this amount',
  createdAt: '2026-07-28',
  ...overrides,
});

const makeAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: 'ann-1',
  type: 'sticky',
  invoiceId: 'inv-1',
  top: 25,
  left: 30,
  resolveState: 'open',
  comments: [],
  createdAt: '2026-07-28',
  createdBy: 'Alice',
  ...overrides,
});

const renderPanel = (annotation: Annotation | null) => {
  const onClose = vi.fn();
  const onAddComment = vi.fn();
  const onResolve = vi.fn();
  const onReopen = vi.fn();

  const result = render(
    <AnnotationPanel
      annotation={annotation}
      onClose={onClose}
      onAddComment={onAddComment}
      onResolve={onResolve}
      onReopen={onReopen}
    />
  );

  return { ...result, onClose, onAddComment, onResolve, onReopen };
};

describe('AnnotationPanel', () => {
  it('returns null when annotation is null (regression: empty/failure path)', () => {
    const { container } = renderPanel(null);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('returns null when annotation is undefined (falsy guard boundary)', () => {
    const { container } = renderPanel(undefined as unknown as Annotation | null);

    expect(container.firstChild).toBeNull();
  });

  it('renders the panel with sticky note title and open status for a populated annotation', () => {
    const { container } = renderPanel(
      makeAnnotation({ comments: [makeComment()] })
    );

    expect(screen.getByRole('complementary')).toHaveAttribute(
      'aria-label',
      'Annotation comments for sticky'
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Sticky Note');
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Check this amount')).toBeInTheDocument();
    expect(screen.getByText('2026-07-28')).toBeInTheDocument();
    expect(screen.getByLabelText('Resolve annotation')).toBeInTheDocument();
    expect(container.querySelectorAll('.annotation-panel-comment')).toHaveLength(1);
  });

  it('renders the empty-state message when comments is an empty array', () => {
    const { container } = renderPanel(makeAnnotation({ comments: [] }));

    expect(screen.getByRole('log')).toBeInTheDocument();
    expect(screen.getByText('No comments yet. Add one below.')).toBeInTheDocument();
    expect(container.querySelectorAll('.annotation-panel-comment')).toHaveLength(0);
  });

  it('renders highlight annotations with resolved status and reopen control', () => {
    renderPanel(makeAnnotation({ type: 'highlight', resolveState: 'resolved' }));

    expect(screen.getByRole('complementary')).toHaveAttribute(
      'aria-label',
      'Annotation comments for highlight'
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Highlight');
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByLabelText('Reopen annotation')).toBeInTheDocument();
    expect(screen.queryByLabelText('Resolve annotation')).toBeNull();
  });

  it('treats a reopened resolveState as open', () => {
    renderPanel(makeAnnotation({ resolveState: 'reopened' }));

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByLabelText('Resolve annotation')).toBeInTheDocument();
    expect(screen.queryByLabelText('Reopen annotation')).toBeNull();
  });

  it('renders a minimal annotation without optional-looking content', () => {
    renderPanel(makeAnnotation());

    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByText('No comments yet. Add one below.')).toBeInTheDocument();
  });

  it('renders comments whose string fields are empty without throwing', () => {
    const { container } = renderPanel(
      makeAnnotation({ comments: [makeComment({ id: '', author: '', body: '', createdAt: '' })] })
    );

    expect(container.querySelectorAll('.annotation-panel-comment')).toHaveLength(1);
    expect(container.querySelector('.annotation-panel-comment-author')?.textContent).toBe('');
    expect(container.querySelector('.annotation-panel-comment-time')?.textContent).toBe('');
    expect(container.querySelector('.annotation-panel-comment-body')?.textContent).toBe('');
  });

  it('renders very long comment values verbatim', () => {
    const longAuthor = 'A'.repeat(200);
    const longBody = 'Long comment body '.repeat(40).trim();

    renderPanel(
      makeAnnotation({ comments: [makeComment({ author: longAuthor, body: longBody })] })
    );

    expect(screen.getByText(longAuthor)).toBeInTheDocument();
    expect(screen.getByText(longBody)).toBeInTheDocument();
  });

  it('throws a TypeError when comments is undefined instead of silently rendering empty state', () => {
    expect(() =>
      renderPanel({ ...makeAnnotation(), comments: undefined } as unknown as Annotation)
    ).toThrow(TypeError);
  });

  it('disables the submit button until the comment has non-whitespace text', () => {
    renderPanel(makeAnnotation());

    const submit = screen.getByLabelText('Submit comment');
    const textarea = screen.getByPlaceholderText('Add a comment...');

    expect(submit).toBeDisabled();

    fireEvent.change(textarea, { target: { value: '   ' } });
    expect(submit).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'New note' } });
    expect(submit).toBeEnabled();
  });

  it('calls onAddComment with the trimmed body and clears the input on submit', () => {
    const { onAddComment } = renderPanel(makeAnnotation());

    const textarea = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(textarea, { target: { value: '  hello  ' } });
    fireEvent.click(screen.getByLabelText('Submit comment'));

    expect(onAddComment).toHaveBeenCalledWith('ann-1', 'hello');
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('calls onResolve with the annotation id when the resolve control is clicked', () => {
    const { onResolve } = renderPanel(makeAnnotation());

    fireEvent.click(screen.getByLabelText('Resolve annotation'));

    expect(onResolve).toHaveBeenCalledWith('ann-1');
  });

  it('calls onReopen with the annotation id when the annotation is resolved', () => {
    const { onReopen } = renderPanel(makeAnnotation({ resolveState: 'resolved' }));

    fireEvent.click(screen.getByLabelText('Reopen annotation'));

    expect(onReopen).toHaveBeenCalledWith('ann-1');
  });

  it('calls onClose when the close control is clicked', () => {
    const { onClose } = renderPanel(makeAnnotation());

    fireEvent.click(screen.getByLabelText('Close annotation panel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
