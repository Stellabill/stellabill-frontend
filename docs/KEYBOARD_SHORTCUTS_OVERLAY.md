# Keyboard Shortcuts Overlay

A discoverable, accessible help overlay that displays grouped keyboard shortcuts to users. Triggered by pressing `?`, the overlay adapts to the user's platform (displaying ⌘ on macOS, Ctrl elsewhere) and supports responsive layouts and print mode.

## Overview

The keyboard shortcuts overlay addresses the discoverability problem: users often don't know what keyboard shortcuts are available. This component provides an in-app reference that's:

- **Discoverable**: Triggered by the universal `?` shortcut
- **Accessible**: WCAG 2.1 AA compliant with proper focus management
- **Platform-aware**: Shows ⌘ on Mac, Ctrl on Windows/Linux
- **Responsive**: Two-column on desktop, single-column on mobile
- **Print-friendly**: Clean layout for printing cheatsheets
- **Copy-friendly**: Semantic `<kbd>` elements for easy text selection

## Usage

### Basic Implementation

The overlay is already integrated into the app shell at `src/components/Layout.tsx` and triggered globally via the `?` key.

```tsx
import KeyboardShortcutsOverlay from './KeyboardShortcutsOverlay';

function MyApp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Your app content */}
      <KeyboardShortcutsOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

### Custom Shortcuts

To display custom shortcuts, pass a `shortcuts` prop:

```tsx
import KeyboardShortcutsOverlay, { ShortcutGroup } from './KeyboardShortcutsOverlay';

const customShortcuts: ShortcutGroup[] = [
  {
    name: 'editing',
    title: 'Editing',
    shortcuts: [
      {
        id: 'save',
        label: 'Save document',
        keys: ['mod', 'S'],
        description: 'Save the current document',
      },
      {
        id: 'undo',
        label: 'Undo',
        keys: ['mod', 'Z'],
      },
    ],
  },
];

<KeyboardShortcutsOverlay
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  shortcuts={customShortcuts}
/>
```

### Platform-Aware Modifiers

Use `'mod'` in the `keys` array to automatically render the correct modifier:

```tsx
keys: ['mod', 'K']  // Renders as "⌘ K" on Mac, "Ctrl K" elsewhere
keys: ['Esc']       // Renders as "Esc" on all platforms
keys: ['Shift', 'Tab']  // Renders as "Shift Tab"
```

### Hiding Mobile-Irrelevant Shortcuts

Desktop keyboard shortcuts that don't make sense on touch devices can be hidden on mobile:

```tsx
{
  id: 'command-palette',
  label: 'Open command palette',
  keys: ['mod', 'K'],
  hiddenOnMobile: true,  // Hidden on screens ≤768px
}
```

## Default Shortcuts

The overlay ships with a default set of shortcuts for StellarBill:

### Navigation
- `⌘K` / `Ctrl+K` — Open command palette (desktop only)
- `Esc` — Close overlay or modal

### Help
- `?` — Show keyboard shortcuts

## Accessibility

The overlay implements the WAI-ARIA dialog pattern and satisfies WCAG 2.1 AA:

### ARIA Attributes
- `role="dialog"` — Identifies the overlay as a dialog
- `aria-modal="true"` — Indicates the content behind is inert
- `aria-labelledby` — Points to the dialog title

### Focus Management
- **On open**: Focus moves to the close button
- **While open**: Focus is trapped within the dialog
- **On close**: Focus returns to the previously focused element
- **Tab order**: Close button → Print button → Close button (cycles)

### Keyboard Support
- `Esc` — Close the overlay
- `Tab` / `Shift+Tab` — Navigate between interactive elements (focus trap)

### Screen Readers
- Semantic `<kbd>` elements announce keyboard shortcuts correctly
- Dialog title is announced when opened
- Close button has descriptive `aria-label`
- Print button has descriptive `aria-label`

### Color Contrast
- Text on dark background meets WCAG AA contrast ratios (≥4.5:1 for body text, ≥3:1 for large text)
- Uses design tokens from `tokens.css` for consistent theming

## Responsive Behavior

### Desktop (>768px)
- Two-column grid layout
- Centered modal with max-width 720px
- Footer shows print button and Esc hint side-by-side

### Mobile (≤768px)
- Full-screen overlay
- Single-column layout
- Shortcuts marked `hiddenOnMobile: true` are hidden
- Footer stacks vertically (print button above hint)

## Print Mode

The overlay includes dedicated print styles for creating physical cheatsheets:

### Print Layout
- Black text on white background
- Two-column grid (even on mobile)
- No modal chrome (backdrop, close button, footer hidden)
- Clean borders and spacing
- Page-break avoidance for groups

### Triggering Print
- Click "Print Cheatsheet" button in the footer
- Or use browser print: `Cmd+P` / `Ctrl+P`
- Print preview shows the clean layout automatically

## Implementation Details

### Files

- **Component**: `src/components/KeyboardShortcutsOverlay.tsx`
- **Styles**: `src/components/KeyboardShortcutsOverlay.css`
- **Tests**: `src/components/KeyboardShortcutsOverlay.test.tsx`
- **Platform utility**: `src/utils/platform.ts`
- **Platform tests**: `src/utils/platform.test.ts`

### Dependencies

- **useModalFocus hook**: Reused from `src/hooks/useModalFocus.ts` for focus management
- **Design tokens**: Uses CSS custom properties from `src/styles/tokens.css`
- **Platform detection**: Custom utility in `src/utils/platform.ts`

### Integration

The overlay is globally integrated in `src/components/Layout.tsx`:

1. **State**: `useState` for overlay visibility
2. **Keyboard listener**: `useEffect` watches for `?` key
3. **Input guard**: Prevents triggering when typing in input fields
4. **Render**: Overlay component at root level

## Customization

### Adding New Shortcuts

To add new shortcuts to the default catalog:

1. Open `src/components/KeyboardShortcutsOverlay.tsx`
2. Find the `DEFAULT_SHORTCUTS` array
3. Add to an existing group or create a new group:

```tsx
{
  name: 'actions',
  title: 'Actions',
  shortcuts: [
    {
      id: 'new-action',
      label: 'Perform action',
      keys: ['mod', 'Shift', 'A'],
      description: 'Optional description',
      hiddenOnMobile: true,  // Optional
    },
  ],
},
```

### Styling

Override styles by targeting CSS classes:

```css
/* Custom overlay background */
.kb-shortcuts-overlay {
  background: rgba(0, 0, 0, 0.9);
}

/* Custom key appearance */
.kb-shortcuts-key {
  background: linear-gradient(to bottom, #444, #222);
  color: #fff;
}
```

## Testing

### Running Tests

```bash
npm test src/components/KeyboardShortcutsOverlay.test.tsx
npm test src/utils/platform.test.ts
```

### Test Coverage

- ✅ Opens with `?` key (Layout integration)
- ✅ Closes with `Esc` key
- ✅ Focus trap (Tab/Shift+Tab cycles within dialog)
- ✅ Focus restoration (returns to trigger element)
- ✅ Platform-aware modifiers (⌘ on Mac, Ctrl elsewhere)
- ✅ Mobile shortcuts hidden (CSS class applied)
- ✅ Print functionality (window.print() called)
- ✅ ARIA attributes (dialog, modal, labelledby)
- ✅ Semantic `<kbd>` elements
- ✅ Backdrop dismiss
- ✅ Close button

### Accessibility Validation

Manual testing with screen readers:

- **macOS**: VoiceOver (Safari)
- **Windows**: NVDA (Firefox, Chrome)
- **Mobile**: TalkBack (Android), VoiceOver (iOS)

Automated testing:

- **axe-core**: Run via Storybook addon-a11y
- **Vitest**: Automated accessibility attribute checks in test suite

## Browser Support

- Chrome/Edge 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Mobile Safari 14+ ✅
- Chrome Android 90+ ✅

### Platform Detection Support

The component uses a fallback chain for platform detection:

1. `navigator.userAgentData.platform` (modern, privacy-focused)
2. `navigator.platform` (deprecated but widely supported)
3. `navigator.userAgent` (final fallback)

This ensures platform-aware display works across all browsers.

## Future Enhancements

Potential improvements for future iterations:

- [ ] Fuzzy search/filter shortcuts
- [ ] Shortcut conflict detection
- [ ] Customizable keyboard shortcuts (user preferences)
- [ ] Export shortcuts as PDF
- [ ] Animated transitions (respecting prefers-reduced-motion)
- [ ] Shortcut categories (beginner, advanced, power user)

## Related Documentation

- [Modal Accessibility](./DOCS_MODAL_ACCESSIBILITY.md) — Focus management patterns
- [Command Palette](./COMMAND_PALETTE.md) — Similar modal component
- [Design Tokens](../src/styles/tokens.css) — Color and spacing variables

## Questions?

For questions or issues related to the keyboard shortcuts overlay:

1. Check this documentation
2. Review existing issues in the repository
3. Open a new issue with the `ui/ux` label
