# Product Tour - Visual Reference Guide

## 🎨 Component Anatomy

### Product Tour Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Overlay (70% opacity)                  │
│                                                             │
│    ┌─────────────────────────────┐                        │
│    │  ┌─ Spotlight Ring (3px)    │                        │
│    │  │  ┌─ Target Element       │                        │
│    │  │  │                        │                        │
│    │  │  │   Dashboard Header     │  ◄─ Highlighted       │
│    │  │  │                        │     with spotlight    │
│    │  │  └────────────────────────┘                        │
│    │  └───────────────────────────┘                        │
│    └─────────────────────────────────┘                     │
│                                                             │
│         ┌───────────────────────────────────┐             │
│         │  ╔════════════════════════════╗  │             │
│         │  ║ 🌟 Welcome to Stellarbill! ║  │  ◄─ Tooltip │
│         │  ╚════════════════════════════╝  │     Card    │
│         │  Let's take a quick tour...      │             │
│         │  ────────────────────────────    │             │
│         │  Progress: ●━━━━  1 of 5         │             │
│         │  ────────────────────────────    │             │
│         │  [Show later] [◄ Back] [Next ►]  │             │
│         └───────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📐 Layout Specifications

### Tooltip Card

```
┌─────────────────────────────────────────┐
│  ┌─ Icon (20px)  Title                 ╳│  ◄─ Close button
│                                          │
│  Step content text goes here. Keep it   │
│  concise and actionable. 2-3 sentences  │  ◄─ Content area
│  maximum for best readability.          │
│                                          │
│  ─────────────────────────────────────  │  ◄─ Divider
│  ●━━━━  1 of 5                          │  ◄─ Progress
│  ─────────────────────────────────────  │
│  [Show me later]  [◄ Back]  [Next ►]    │  ◄─ Actions
└─────────────────────────────────────────┘
    │                    │          │
    └─ Dismissal         │          └─ Navigation
                         └─ Navigation
```

### Dimensions

- **Max Width**: 420px
- **Padding**: 24px (var(--space-6))
- **Border Radius**: 24px (var(--radius-2xl))
- **Spotlight Padding**: 8-16px (configurable)
- **Min Touch Target**: 44×44px

## 🎨 Color Palette

### Light Mode
```css
Overlay:          rgba(0, 0, 0, 0.7)
Spotlight Ring:   #067d99 (brand primary)
Spotlight Glow:   rgba(6, 125, 153, 0.16)
Tooltip BG:       #ffffff (surface elevated)
Border:           #cbd5e1 (border strong)
Primary Button:   linear-gradient(90deg, #067d99 0%, #0f766e 100%)
Text Primary:     #0f172a
Text Secondary:   #334155
```

### Dark Mode
```css
Overlay:          rgba(0, 0, 0, 0.7)
Spotlight Ring:   #22d3ee (brand primary)
Spotlight Glow:   rgba(34, 211, 238, 0.10)
Tooltip BG:       #0f172a (surface elevated)
Border:           rgba(203, 213, 225, 0.42)
Primary Button:   linear-gradient(90deg, #22d3ee 0%, #2dd4bf 100%)
Text Primary:     #f8fafc
Text Secondary:   #cbd5e1
```

## 📱 Responsive Breakpoints

### Mobile (<480px)

```
┌───────────────────┐
│  ┌─ Spotlight   ┐ │
│  │  Element     │ │
│  └──────────────┘ │
│                   │
│  ┌──────────────┐ │
│  │ Title       ╳│ │
│  │              │ │
│  │ Content...  │ │  ◄─ Full width
│  │              │ │     minus margins
│  │ ●━━━  2/5   │ │
│  │              │ │
│  │ [Later]     │ │
│  │ [Back][Next]│ │  ◄─ Stacked on
│  └──────────────┘ │     very small
└───────────────────┘     screens
```

### Tablet (480-768px)

```
┌─────────────────────────────┐
│  ┌─ Spotlight    ┐          │
│  │  Element      │          │
│  └───────────────┘          │
│                             │
│      ┌──────────────────┐  │
│      │ Title           ╳│  │
│      │                  │  │  ◄─ Adjusted width
│      │ Content...       │  │     420px max
│      │                  │  │
│      │ ●━━━━  3 of 5    │  │
│      │                  │  │
│      │ [Later][◄][Next] │  │
│      └──────────────────┘  │
└─────────────────────────────┘
```

### Desktop (>768px)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─ Spotlight ─────┐                               │
│  │  Element        │                               │
│  └─────────────────┘                               │
│           │                                         │
│           └─ Arrow (implicit)                      │
│                                                     │
│           ┌──────────────────────┐                 │
│           │ Title               ╳│                 │
│           │                      │  ◄─ Positioned  │
│           │ Content...           │     based on    │
│           │                      │     placement   │
│           │ ●━━━━  4 of 5        │                 │
│           │                      │                 │
│           │ [Later] [◄] [Next ►] │                 │
│           └──────────────────────┘                 │
└─────────────────────────────────────────────────────┘
```

## 🎭 States & Animations

### Overlay Fade-In
```
Time: 0ms ──────────────► 150ms
Opacity:  0% ──────────────► 100%
Easing:   ease-in-out
```

### Spotlight Scale
```
Time: 0ms ──────────────► 200ms
Scale:    0.9 ──────────────► 1.0
Opacity:  0% ──────────────► 100%
Easing:   cubic-bezier(0.4, 0, 0.2, 1)
```

### Tooltip Spring Animation
```
Time: 0ms ──────────────► 300ms
Scale:    0.95 ──────────────► 1.0
Y-Offset: 20px ──────────────► 0px
Opacity:  0% ──────────────► 100%
Type:     Spring (damping: 25, stiffness: 300)
```

### Progress Dot Transition
```
Inactive: ●  (8px diameter)
Active:   ━━ (24px width, pill shape)
Duration: 200ms
Easing:   ease
```

## 🎨 Tooltip Placements

### Top Placement
```
       ┌──────────────┐
       │ Tour Tooltip │
       └──────┬───────┘
              │
       ┌──────▼───────┐
       │ Target       │
       │ Element      │
       └──────────────┘
```

### Bottom Placement (Default)
```
       ┌──────────────┐
       │ Target       │
       │ Element      │
       └──────▲───────┘
              │
       ┌──────┴───────┐
       │ Tour Tooltip │
       └──────────────┘
```

### Left Placement
```
┌──────────────┐     ┌──────────────┐
│ Tour Tooltip │ ──► │ Target       │
└──────────────┘     │ Element      │
                     └──────────────┘
```

### Right Placement
```
┌──────────────┐     ┌──────────────┐
│ Target       │ ──► │ Tour Tooltip │
│ Element      │     └──────────────┘
└──────────────┘
```

### Center Placement
```
┌───────────────────────────────┐
│                               │
│     ┌──────────────────┐      │
│     │  Tour Tooltip    │      │
│     │  (Centered)      │      │
│     └──────────────────┘      │
│                               │
└───────────────────────────────┘
```

## 🎨 Progress Indicator

### Step States

```
Step 1 (Current):  ●━━━━━━  (Active - 24px wide pill)
Step 2 (Upcoming): ●        (Inactive - 8px dot)
Step 3 (Upcoming): ●        (Inactive - 8px dot)
Step 4 (Upcoming): ●        (Inactive - 8px dot)
Step 5 (Upcoming): ●        (Inactive - 8px dot)

Label: "1 of 5"  (Right-aligned)
```

### Progress Animation

```
Transition from Step 1 to Step 2:

Before:  ●━━━━━━ ● ● ● ●
                │
                ▼  (200ms ease)
After:   ● ●━━━━━━ ● ● ●
```

## 🎊 Completion Modal

```
┌───────────────────────────────────┐
│                                   │
│         ┌─────────────┐           │
│         │     ╱ ╲     │           │  ◄─ Animated icon
│         │    │ 🎉│    │           │     (party popper)
│         │     ╲ ╱     │           │
│         └─────────────┘           │
│                                   │
│        You're all set!            │  ◄─ Title
│                                   │
│   You've completed the tour.      │
│   You're ready to start managing  │  ◄─ Message
│   your subscriptions.             │
│                                   │
│      ┌───────────────┐            │
│      │  Get Started  │            │  ◄─ Action button
│      └───────────────┘            │
│                                   │
└───────────────────────────────────┘
     (Centered on screen)
```

## 🖱️ Interactive Elements

### Button States

```
Default:    [  Next  ]
           Background: var(--color-brand-gradient)
           Border: 1px transparent
           Shadow: var(--shadow-brand)

Hover:      [  Next  ]
           Opacity: 0.92
           Cursor: pointer

Focus:      [  Next  ]
           Outline: 2px var(--color-focus-ring)
           Offset: 2px

Disabled:   [  Back  ]
           Opacity: 0.5
           Cursor: not-allowed
```

### Touch Targets

```
Minimum size: 44×44px (WCAG 2.1 AA)

Example:
┌────────────────┐
│                │  ◄─ 44px
│   [Button]     │     minimum
│                │     height
└────────────────┘
   ◄─ 44px min ─►
      width
```

## 🎨 Spotlight Variations

### Small Padding (8px)
```
┌────────────────────┐
│ ┌────────────────┐ │  ◄─ 8px padding
│ │   Element      │ │     (compact)
│ └────────────────┘ │
└────────────────────┘
```

### Medium Padding (12px)
```
┌──────────────────────┐
│  ┌────────────────┐  │  ◄─ 12px padding
│  │   Element      │  │     (default)
│  └────────────────┘  │
└──────────────────────┘
```

### Large Padding (16px)
```
┌────────────────────────┐
│   ┌────────────────┐   │  ◄─ 16px padding
│   │   Element      │   │     (spacious)
│   └────────────────┘   │
└────────────────────────┘
```

## 🎨 Theme Comparison

### Light Mode Tour
```
┌──────────────────────────────┐
│  Overlay: Dark semi-opaque   │  ◄─ Light theme
│                              │
│  ┌────────────────────┐      │
│  │ White Tooltip      │      │  ◄─ High contrast
│  │ Dark text          │      │
│  │ Teal spotlight     │      │
│  └────────────────────┘      │
└──────────────────────────────┘
```

### Dark Mode Tour
```
┌──────────────────────────────┐
│  Overlay: Dark semi-opaque   │  ◄─ Dark theme
│                              │
│  ┌────────────────────┐      │
│  │ Dark Tooltip       │      │  ◄─ Inverted
│  │ Light text         │      │
│  │ Cyan spotlight     │      │
│  └────────────────────┘      │
└──────────────────────────────┘
```

## 🎭 Animation Timeline

### Tour Opening Sequence

```
Time:  0ms    100ms   200ms   300ms   400ms
       │      │       │       │       │
Overlay├──────►       │       │       │  Fade in (0 → 1)
       │              │       │       │
Spotlight      ├──────►       │       │  Scale + fade (0.9 → 1)
       │              │       │       │
Tooltip        │       ├──────────────►  Spring animation
       │              │       │       │
       └──────────────┴───────┴───────┘
             Total: ~400ms
```

### Step Transition

```
Time:  0ms    150ms   300ms
       │      │       │
Old Step├─────►       │  Fade out
       │              │
New Step       ├──────►  Fade in + reposition
       │              │
Spotlight├────────────►  Smooth move to new target
       │              │
       └──────────────┘
     Total: ~300ms
```

## 📊 Accessibility Indicators

### Focus Order
```
1. [Close Button ×]
2. [Show me later]
3. [◄ Back]
4. [Action Button]  (if present)
5. [Next ►]
... then wraps back to [Close Button]
```

### Screen Reader Announcements
```
On Open:
  "Dialog. Welcome to Stellarbill!
   Let's take a quick tour...
   Step 1 of 5"

On Navigation:
  "Step 2 of 5.
   Key Metrics at a Glance.
   Monitor your subscription performance..."

On Completion:
  "Tour complete! You're all set!"
```

## 🎨 Visual Hierarchy

### Z-Index Stack
```
Layer 5: Tooltip        (z-index: 401)
Layer 4: Spotlight Ring (z-index: 401)
Layer 3: Overlay        (z-index: 400)
Layer 2: Page Content   (z-index: 0-10)
Layer 1: Background     (z-index: -1)
```

### Visual Weight
```
Heaviest:    Primary button (gradient + shadow)
Medium:      Title text (semibold, large)
Lighter:     Content text (regular, medium)
Lightest:    Progress label (small, muted)
```

## 🎨 Custom Action Button

### With Action
```
┌─────────────────────────────────┐
│ Title                          ╳│
│                                 │
│ Content with custom action...   │
│                                 │
│ ●━━━  3 of 5                    │
│                                 │
│ [Later] [◄ Back] [Try It] [►]  │  ◄─ Custom action
└─────────────────────────────────┘
```

### Without Action
```
┌─────────────────────────────────┐
│ Title                          ╳│
│                                 │
│ Standard content...             │
│                                 │
│ ●━━━  3 of 5                    │
│                                 │
│ [Later] [◄ Back] [Next ►]      │  ◄─ Standard layout
└─────────────────────────────────┘
```

---

## 📸 Screenshot Locations

To see the actual implementation:
1. Run `npm run dev`
2. Navigate to `http://localhost:5173/dashboard`
3. Or run `npm run storybook` for interactive demos

---

**This visual guide complements the code implementation and serves as a reference for designers and developers.**
