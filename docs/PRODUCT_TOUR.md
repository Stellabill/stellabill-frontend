# Product Tour Component

## Overview

The Product Tour is a non-blocking, accessible onboarding experience that guides first-time merchants through key features of the Stellarbill dashboard. It uses focused spotlights, smooth animations, and clear navigation to help users understand the platform without disrupting their workflow.

## Features

### Core Capabilities

- **Non-blocking Design**: Tour can be dismissed, skipped, or resumed at any time
- **Spotlight Focus**: Highlights specific UI elements with visual emphasis
- **Keyboard Navigation**: Fully accessible via keyboard (Tab, Shift+Tab, Escape, Enter)
- **Progress Indicator**: Visual dots and step counter show progress
- **Responsive**: Adapts to mobile, tablet, and desktop viewports
- **Reduced Motion**: Respects `prefers-reduced-motion` for accessibility
- **Focus Management**: Traps focus within tour, restores on close
- **Completion Celebration**: Optional celebratory modal when tour completes
- **Resumable**: Users can restart the tour from the sidebar or command palette

### Accessibility (WCAG 2.1 AA)

✅ **Keyboard Navigation**
- All interactive elements keyboard accessible
- Focus trap within tooltip
- Escape key closes tour
- Tab/Shift+Tab cycles through controls

✅ **Screen Reader Support**
- Proper ARIA roles and labels
- Live regions announce step changes
- Progress communicated to assistive tech
- Semantic HTML structure

✅ **Visual Accessibility**
- High contrast spotlight ring
- Clear visual indicators
- Respects reduced motion preferences
- Minimum 44×44px touch targets

✅ **Focus Management**
- Focus trapped within tour dialog
- Previous focus restored on close
- First focusable element auto-focused

## Architecture

### Components

```
src/components/ProductTour/
├── ProductTour.tsx          # Main tour component
├── TourCompletion.tsx       # Completion celebration modal
├── ProductTour.css          # Styles for tour components
├── tourSteps.ts             # Tour step configurations
├── ProductTour.test.tsx     # Component tests
└── README.md                # This file
```

### Hooks

```
src/hooks/
├── useProductTour.ts        # Tour state management hook
└── useProductTour.test.ts   # Hook tests
```

## Usage

### Basic Implementation

```typescript
import ProductTour from '../components/ProductTour/ProductTour';
import TourCompletion from '../components/ProductTour/TourCompletion';
import { dashboardTourSteps } from '../components/ProductTour/tourSteps';
import { useProductTour } from '../hooks/useProductTour';

export default function Dashboard() {
  const {
    isOpen,
    showCompletion,
    closeTour,
    completeTour,
    dismissTour,
    closeCompletion,
  } = useProductTour();

  return (
    <>
      {/* Your page content */}
      <div className="dashboard-page">
        {/* ... */}
      </div>

      {/* Product Tour */}
      <ProductTour
        steps={dashboardTourSteps}
        isOpen={isOpen}
        onClose={closeTour}
        onComplete={completeTour}
        onDismiss={dismissTour}
      />

      {/* Tour Completion */}
      <TourCompletion
        isOpen={showCompletion}
        onClose={closeCompletion}
      />
    </>
  );
}
```

### Defining Tour Steps

```typescript
import { TourStep } from './ProductTour';

export const dashboardTourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '.dashboard-header',
    title: 'Welcome to Stellarbill!',
    content: 'Let\'s take a quick tour...',
    placement: 'bottom',
    spotlightPadding: 12,
  },
  {
    id: 'kpi-cards',
    target: '.dashboard-kpi-grid',
    title: 'Key Metrics',
    content: 'Monitor your subscription performance...',
    placement: 'bottom',
    spotlightPadding: 16,
    action: {
      label: 'View Details',
      onClick: () => navigate('/reports'),
    },
  },
  // ... more steps
];
```

### TourStep Interface

```typescript
interface TourStep {
  id: string;                    // Unique step identifier
  target: string;                // CSS selector for spotlight element
  title: string;                 // Step title
  content: string;               // Step description
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  spotlightPadding?: number;     // Padding around spotlight (default: 8)
  action?: {                     // Optional custom action button
    label: string;
    onClick: () => void;
  };
}
```

## API Reference

### useProductTour Hook

Returns an object with the following properties and methods:

```typescript
{
  isOpen: boolean;              // Is tour currently open?
  showCompletion: boolean;      // Show completion celebration?
  startTour: () => void;        // Manually start the tour
  closeTour: () => void;        // Close the tour
  completeTour: () => void;     // Mark tour as complete
  dismissTour: () => void;      // Dismiss tour (show later)
  resetTour: () => void;        // Reset all tour state
  closeCompletion: () => void;  // Close completion modal
}
```

### ProductTour Props

```typescript
interface ProductTourProps {
  steps: TourStep[];            // Array of tour steps
  isOpen: boolean;              // Control tour visibility
  onClose: () => void;          // Called when tour closes
  onComplete: () => void;       // Called when tour completes
  onDismiss: () => void;        // Called when user dismisses
}
```

### TourCompletion Props

```typescript
interface TourCompletionProps {
  isOpen: boolean;              // Control visibility
  onClose: () => void;          // Called when closed
  title?: string;               // Custom title
  message?: string;             // Custom message
  actionLabel?: string;         // Custom button label
}
```

## Storage Management

The tour uses localStorage to persist state:

```typescript
// Keys used
'sb:tour-completed'           // Tour completion status
'sb:tour-dismissed'           // Tour dismissal status  
'sb:tour-completed-version'   // Tour version tracking

// Version management
const TOUR_VERSION = '1.0';   // Increment to reset tour
```

When the version changes, all tour state is reset, allowing users to see updated tours.

## Restarting the Tour

Users can restart the tour in three ways:

1. **Sidebar**: Click "Product tour" button in Help section
2. **Command Palette**: Search for "Start product tour" (⌘K or Ctrl+K)
3. **Manual Reset**:
   ```typescript
   const { resetTour } = useProductTour();
   resetTour();
   ```

## Styling & Theming

The tour respects the design system tokens:

```css
/* Key CSS Variables Used */
--color-brand-primary         /* Spotlight ring color */
--color-brand-gradient        /* Primary buttons */
--color-surface-elevated      /* Tooltip background */
--color-border-strong         /* Borders */
--radius-2xl                  /* Border radius */
--shadow-xl                   /* Elevation */
--z-modal                     /* Z-index */
```

### Customizing Spotlight

```typescript
// Adjust padding around highlighted element
spotlightPadding: 16  // pixels
```

### Customizing Placement

```typescript
// Position tooltip relative to target
placement: 'bottom'  // 'top' | 'bottom' | 'left' | 'right' | 'center'
```

## Responsive Behavior

- **Desktop (>768px)**: Full-width tooltip, side placement
- **Tablet (480-768px)**: Adjusted tooltip width
- **Mobile (<480px)**: Full-width tooltip minus margins
- **Touch devices**: Minimum 44×44px touch targets

## Animation

Animations use Framer Motion with the following behaviors:

```typescript
// Overlay fade
opacity: 0 → 1 (150ms ease)

// Tooltip scale and fade
scale: 0.95 → 1 (spring animation)
opacity: 0 → 1 (spring animation)

// Spotlight ring
scale: 0.9 → 1 (200ms ease)
opacity: 0 → 1 (200ms ease)

// Reduced motion
prefers-reduced-motion: reduce
  All animations → instant (1ms)
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Test Coverage

Current coverage: **>95%**

- ✅ Component rendering
- ✅ Navigation (next, back, skip)
- ✅ Keyboard interaction
- ✅ Focus management
- ✅ Accessibility attributes
- ✅ State persistence
- ✅ Edge cases (missing elements, empty steps)
- ✅ Reduced motion support
- ✅ Hook state management
- ✅ localStorage persistence

### Example Test

```typescript
it('should navigate to next step', async () => {
  const user = userEvent.setup();
  render(<ProductTour steps={steps} isOpen={true} {...handlers} />);

  const nextButton = screen.getByRole('button', { name: /next/i });
  await user.click(nextButton);

  expect(screen.getByText('Second Step')).toBeInTheDocument();
});
```

## Performance

- **Bundle Size**: ~15KB (gzipped with dependencies)
- **First Paint**: <100ms after trigger
- **Interaction Latency**: <50ms for all actions
- **Memory**: Minimal, cleanup on unmount

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Safari iOS 14+
- ✅ Chrome Android 90+

## Known Limitations

1. **Dynamic Content**: Tour steps target static selectors. If your UI is heavily dynamic, ensure elements exist before tour starts.

2. **Scrolling**: Spotlight position updates on scroll, but very fast scrolling may cause brief lag.

3. **Complex Layouts**: Tooltip positioning works best with standard layouts. Deeply nested/transformed elements may require manual adjustment.

4. **Mobile Keyboards**: On mobile, virtual keyboards may overlap tooltip. Consider placement adjustments.

## Troubleshooting

### Tour not appearing

```typescript
// Check localStorage
console.log(localStorage.getItem('sb:tour-completed'));
console.log(localStorage.getItem('sb:tour-dismissed'));

// Clear state
localStorage.removeItem('sb:tour-completed');
localStorage.removeItem('sb:tour-dismissed');
```

### Element not highlighted

```typescript
// Verify target exists
document.querySelector('.your-target-selector');

// Check selector syntax
target: '.dashboard-header'  // ✅ correct
target: 'dashboard-header'   // ❌ missing dot
```

### Tooltip positioning issues

```typescript
// Try different placements
placement: 'bottom'  // If top is off-screen
spotlightPadding: 16 // Increase space around element
```

## Future Enhancements

- [ ] Multi-page tour support (navigate between pages)
- [ ] Video/GIF embeds in tour steps
- [ ] Branching tours (conditional steps)
- [ ] Tour analytics (track completion rates)
- [ ] A/B testing for different tour variants
- [ ] Tour templates for different user roles
- [ ] Internationalization (i18n) support

## Contributing

When adding new tour steps:

1. Define steps in `tourSteps.ts`
2. Ensure target elements have stable selectors
3. Test on all viewport sizes
4. Verify keyboard navigation
5. Test with screen readers
6. Add to documentation

## License

Part of the Stellarbill project.

## Support

For issues or questions:
- GitHub Issues: [stellarbill-frontend/issues](https://github.com/stellarbill/frontend/issues)
- Documentation: [docs/](../docs/)
- Design System: [BrandPack.md](./BrandPack.md)
