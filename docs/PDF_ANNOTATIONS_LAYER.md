# PDF Annotations Layer for Invoice Review

## Overview

An annotation layer for invoice review supporting sticky notes, highlights, and a side panel of comments with resolve/reopen state. Designed for accounting teams who need to leave notes on invoices before approval.

## Components

### AnnotationLayer
Wraps invoice content and renders annotation pins at absolute positions. Supports toggling annotation mode (crosshair cursor).

### AnnotationPin
Circular marker positioned on the invoice content. Shows annotation type icon, comment count badge, and resolve state color.

### AnnotationPanel
Side panel that slides in from the right showing the comment thread for the active annotation. Supports adding comments, resolving, and reopening.

## Types

| Type | Field | Description |
|------|-------|-------------|
| `Annotation` | `id` | Unique identifier |
| | `type` | `"sticky"` or `"highlight"` |
| | `invoiceId` | Associated invoice |
| | `top`, `left` | Position as percentage of container |
| | `resolveState` | `"open"`, `"resolved"`, or `"reopened"` |
| | `comments` | Array of `AnnotationComment` |
| `AnnotationComment` | `id`, `author`, `body`, `createdAt` | Comment data |

## Usage

```tsx
import AnnotationLayer from '../components/annotations/AnnotationLayer';

function InvoiceReview({ invoice }) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  return (
    <AnnotationLayer
      invoiceId={invoice.id}
      annotations={annotations}
      onAddAnnotation={(create) => { /* add annotation */ }}
      onAddComment={(id, body) => { /* add comment */ }}
      onResolve={(id) => { /* resolve */ }}
      onReopen={(id) => { /* reopen */ }}
      isAnnotatable={true}
    >
      {/* Invoice content */}
    </AnnotationLayer>
  );
}
```

## Accessibility

- `role="complementary"` on annotation panel
- `aria-label` on pins describing type, comment count, and state
- `aria-pressed` on active pin
- Focus trap within open panel
- Escape key closes panel
- Enter/click on pin opens its panel
- `role="log"` on comments list for live region updates
- Respects `prefers-reduced-motion`

## Edge Cases

- **Overlapping pins**: Pins use `z-index` layering; active pin rises above others
- **Many annotations**: Panel scrolls independently; pins cluster visually
- **RTL**: CSS uses logical properties; panel slides from the right side
- **Screen-reader pin list**: Pins are buttons with descriptive `aria-label`
- **Empty state**: Panel shows "No comments yet" when annotation has no comments
- **Resolve/Reopen**: Visual state change with distinct colors and icons
