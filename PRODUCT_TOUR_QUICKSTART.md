# Product Tour - Quick Start Guide

## 🚀 Setup & Installation

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:5173/dashboard`

### 3. View in Storybook

```bash
npm run storybook
```

Navigate to `http://localhost:6006` and find **Components/ProductTour**

## ✅ Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test ProductTour
```

### Run with Coverage

```bash
npm run test:coverage
```

### Lint Code

```bash
npm run lint
```

## 🎯 How to Use

### Basic Implementation

```typescript
// In your page component
import ProductTour from '../components/ProductTour/ProductTour';
import TourCompletion from '../components/ProductTour/TourCompletion';
import { dashboardTourSteps } from '../components/ProductTour/tourSteps';
import { useProductTour } from '../hooks/useProductTour';

export default function YourPage() {
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
      <div className="your-page">...</div>

      {/* Add tour */}
      <ProductTour
        steps={dashboardTourSteps}
        isOpen={isOpen}
        onClose={closeTour}
        onComplete={completeTour}
        onDismiss={dismissTour}
      />

      <TourCompletion
        isOpen={showCompletion}
        onClose={closeCompletion}
      />
    </>
  );
}
```

### Create Custom Steps

```typescript
// In tourSteps.ts or your component
import { TourStep } from './ProductTour';

const myCustomSteps: TourStep[] = [
  {
    id: 'step-1',
    target: '.my-element',           // CSS selector
    title: 'Welcome!',                // Step title
    content: 'This is the content',   // Description
    placement: 'bottom',              // top | bottom | left | right | center
    spotlightPadding: 12,             // Optional padding (default: 8)
    action: {                         // Optional custom button
      label: 'Try it',
      onClick: () => console.log('Action clicked'),
    },
  },
  // Add more steps...
];
```

### Manual Controls

```typescript
const { startTour, closeTour, resetTour } = useProductTour();

// Start tour manually
<button onClick={startTour}>Start Tour</button>

// Close tour
<button onClick={closeTour}>Close Tour</button>

// Reset all tour state
<button onClick={resetTour}>Reset Tour</button>
```

## 🎨 Customization

### Change Tour Version

```typescript
// In src/hooks/useProductTour.ts
const TOUR_VERSION = '2.0';  // Increment to reset for all users
```

### Custom Completion Message

```typescript
<TourCompletion
  isOpen={showCompletion}
  onClose={closeCompletion}
  title="Custom Title!"
  message="Your custom completion message here."
  actionLabel="Let's Go!"
/>
```

### Add Tour to New Page

1. Import components and hook
2. Define tour steps for that page
3. Add `<ProductTour>` and `<TourCompletion>` components
4. Ensure target elements have stable CSS selectors

## 🐛 Troubleshooting

### Tour Not Showing

```typescript
// Clear localStorage
localStorage.removeItem('sb:tour-completed');
localStorage.removeItem('sb:tour-dismissed');
// Reload page
```

### Element Not Highlighted

```typescript
// Check if element exists
console.log(document.querySelector('.your-selector'));

// Verify selector in step config
target: '.your-selector'  // Must match exactly
```

### Positioning Issues

```typescript
// Try different placement
placement: 'bottom'  // Change to 'top', 'left', 'right'

// Adjust padding
spotlightPadding: 20  // Increase for more space
```

## 📝 Common Tasks

### Add New Step to Existing Tour

```typescript
// In src/components/ProductTour/tourSteps.ts
export const dashboardTourSteps: TourStep[] = [
  // ... existing steps
  {
    id: 'new-step',
    target: '.new-element',
    title: 'New Feature',
    content: 'Check out this new feature!',
    placement: 'bottom',
  },
];
```

### Disable Auto-Start

```typescript
// In src/hooks/useProductTour.ts
useEffect(() => {
  // Comment out or remove this block
  /*
  const shouldShow = !completed && !dismissed;
  if (shouldShow) {
    const timer = setTimeout(() => setIsOpen(true), 800);
    return () => clearTimeout(timer);
  }
  */
}, []);
```

### Add Tour Trigger Button

```typescript
import { useProductTour } from '../hooks/useProductTour';

function MyComponent() {
  const { startTour } = useProductTour();
  
  return (
    <button onClick={startTour}>
      Take a Tour
    </button>
  );
}
```

## 🔍 Debugging

### Enable Console Logs

```typescript
// In ProductTour.tsx, add console logs
const updatePositions = useCallback(() => {
  if (!currentStep || !isOpen) return;
  
  const targetElement = document.querySelector(currentStep.target);
  console.log('Target element:', targetElement);
  console.log('Current step:', currentStep);
  
  // ... rest of code
}, [currentStep, isOpen]);
```

### Check localStorage State

```javascript
// In browser console
console.log({
  completed: localStorage.getItem('sb:tour-completed'),
  dismissed: localStorage.getItem('sb:tour-dismissed'),
  version: localStorage.getItem('sb:tour-completed-version'),
});
```

### Inspect Tour State

```typescript
// In your component
const tour = useProductTour();
console.log('Tour state:', tour);
```

## 📚 Resources

- **Full Documentation**: `docs/PRODUCT_TOUR.md`
- **Implementation Details**: `PRODUCT_TOUR_IMPLEMENTATION.md`
- **Component Tests**: `src/components/ProductTour/ProductTour.test.tsx`
- **Hook Tests**: `src/hooks/useProductTour.test.ts`
- **Storybook**: Run `npm run storybook`

## 🎯 Key Concepts

### Tour Lifecycle

1. **First Visit**: Tour auto-opens after 800ms delay
2. **Navigation**: User progresses through steps
3. **Completion**: User reaches last step, clicks "Done"
4. **Celebration**: Completion modal shows
5. **Persistence**: State saved to localStorage

### State Management

- `isOpen`: Is tour currently visible?
- `showCompletion`: Show completion modal?
- `completed`: Has user completed tour? (localStorage)
- `dismissed`: Has user dismissed tour? (localStorage)

### Keyboard Controls

- **Tab**: Move to next focusable element
- **Shift+Tab**: Move to previous focusable element
- **Escape**: Close tour
- **Enter**: Activate focused button

## 💡 Tips

1. **Element Selectors**: Use stable class names, not dynamic IDs
2. **Timing**: Ensure elements exist before tour starts
3. **Placement**: Test all placements on different screen sizes
4. **Content**: Keep step content concise (2-3 sentences max)
5. **Testing**: Always test keyboard navigation and screen readers

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run `npm run lint` and `npm test`
5. Submit PR with clear description

## 📞 Getting Help

- Check documentation first
- Review Storybook examples
- Search existing GitHub issues
- Ask in project Discord/Slack
- Create new issue with "Product Tour" label

---

**Happy coding!** 🚀
