# Modal Accessibility and Focus Management

This document outlines the improvements made to modal accessibility in the StellarBill project and provides instructions for maintaining these patterns in future development.

## Overview

Accessibility for modals (also known as Dialogs) is critical for users who navigate via keyboard or screen readers. These improvements ensure that:
1. **Focus is Trapped**: Users cannot tab out of an open modal into the background page.
2. **Focus is Restored**: When a modal closes, focus returns to the button that opened it.
3. **Keyboard Navigation**: The `Escape` key closes the modal, and `Tab`/`Shift+Tab` cycles correctly.
4. **ARIA Compliance**: Screen readers receive correct context via `role="dialog"`, `aria-modal`, and descriptive labels.

## Implementation: `useModalFocus` Hook

A reusable hook has been implemented to unify this behavior: `src/hooks/useModalFocus.ts`.

### Usage

To add accessibility to a new modal:

1. Create a `ref` for the modal container.
2. (Optional) Create a `ref` for the element that should receive initial focus.
3. Call the hook inside your component.

```tsx
import { useRef } from 'react';
import { useModalFocus } from '../hooks/useModalFocus';

export default function MyModal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  useModalFocus(modalRef, { isOpen, onClose, initialFocusRef });

  if (!isOpen) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="title-id"
      aria-describedby="desc-id"
    >
      <div ref={modalRef}>
        <h2 id="title-id">My Modal</h2>
        <p id="desc-id">Description for screen readers.</p>
        <button ref={initialFocusRef}>First Focused Button</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

## Updated Components

The following modals have been refactored to use this standard:
- `WalletConnectModal`
- `CancelSubscriptionModal`
- `PauseSubscriptionModal`
- `TopUpModal`

## Testing

Automated accessibility tests are located in `src/__tests__/modals/`. These tests verify focus trapping, restoration, and keyboard events.

Run the tests:
```bash
npm test src/__tests__/modals/
```

### Key Test Cases
- **Traps focus**: Ensures tabbing from the last element loops to the first, and shift-tabbing from the first loops to the last.
- **Closes on Escape**: Verifies the `onClose` callback is triggered.
- **Restores focus**: Verifies the document's active element returns to the trigger button after the modal is removed from the DOM.
- **ARIA Attributes**: Ensures required accessibility attributes and IDs are present and correctly linked.
