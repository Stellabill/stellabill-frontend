# Bottom-Sheet Pattern (Mobile Action Menus)

## Overview

A reusable bottom-sheet component for mobile action menus with swipe-down dismiss, focus trap, and safe-area padding. Visible only on screens smaller than 720px; degrades to existing dropdown/desktop UI above that breakpoint.

## Usage

```tsx
import BottomSheet from '../components/common/BottomSheet';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Actions"
      description="Choose an action"
    >
      <button onClick={handleAction}>Action</button>
    </BottomSheet>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Controls visibility |
| `onClose` | `() => void` | required | Close handler |
| `title` | `string` | optional | Sheet heading |
| `description` | `string` | optional | Sheet subtext |
| `children` | `ReactNode` | required | Sheet body content |
| `snapPoints` | `[number, number]` | optional | Drag snap points (percent) |

## Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-describedby`
- Focus trap via `useModalFocus` — Tab/Shift+Tab cycle within panel
- Escape key closes the sheet
- Click-outside-to-close on backdrop
- Drag handle is `aria-hidden`
- Close button has `aria-label="Close"`
- Respects `prefers-reduced-motion` — animation skipped
- `env(safe-area-inset-bottom)` padding for notched devices

## Migration

### SubscriptionActions
On mobile (`<720px`), renders a trigger button that opens the bottom sheet with action items. On desktop, renders the existing inline card.

### AddTagPopover
On mobile (`<720px`), opens a bottom sheet with tag search/create UI. On desktop, uses the existing dropdown popover.

## Design Decisions

- Built with **framer-motion** for spring-based drag and animation (consistent with existing `SwipeableRow`)
- Drag threshold: 100px downward or 400px/s velocity triggers dismiss
- Max height: 85vh to leave context visible
- Rounded top corners (20px) with drag handle affordance
- Backdrop blur for visual separation
- Auto-hides above 720px via `display: none` CSS
