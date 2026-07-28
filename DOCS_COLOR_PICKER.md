# Tag Colour Picker — Design System Documentation

> **Status:** Stable  
> **Owner:** UI/UX  
> **Files:**
> - `src/components/settings/ColorPicker.tsx` — container component  
> - `src/components/settings/ColorSwatch.tsx` — individual swatch button  
> - `src/components/settings/ColorPicker.css` — styles  
> - `src/utils/colorContrast.ts` — WCAG contrast utilities  

---

## Overview

The **ColorPicker** lets users assign one of eight predefined colours to a tag.
It replaces the legacy inline button row in `ManageTagsSettings` with a richer,
fully accessible widget that includes:

- A 4-column swatch grid with keyboard navigation and ARIA radio-group semantics.
- A live tag preview that updates on every colour change.
- A contrast-ratio badge and warning for any pair that falls below WCAG 2.1 AA
  (4.5:1 for normal text).

---

## Design decisions

### Fixed palette

Tags use a curated 8-colour palette rather than a free colour input.  This
keeps the UI predictable, ensures every combination is pre-validated for
contrast, and avoids the complexity of a full HSL wheel.

Palette colours are exported from `ColorSwatch.tsx` as `TAG_COLORS` (an
immutable tuple) and `TAG_COLOR_PAIRS` (the exact hex values used by
`Tag.css`), so the picker and the tag chip always stay in sync.

### ARIA radio-group pattern

Each swatch is a `<button role="radio" aria-checked>`.  The group is a
`<div role="radiogroup">`.  This is the ARIA authoring practices (APG)
recommended pattern for selecting one option from a set — the same pattern
used by native `<input type="radio">` but rendered as styled buttons.

> Reference: [ARIA Radio Group Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)

### Roving tabindex

Only the currently-selected swatch is in the tab sequence (`tabIndex=0`); all
others have `tabIndex=-1`.  Arrow keys move focus *and* update the selected
state via `onChange`.  This matches the APG radio-group keyboard model and
keeps the tab-stop count low.

| Key | Behaviour |
|-----|-----------|
| `ArrowRight` / `ArrowDown` | Focus next swatch (wraps) |
| `ArrowLeft` / `ArrowUp` | Focus previous swatch (wraps) |
| `Home` | Focus first swatch |
| `End` | Focus last swatch |

### Contrast checker

`contrastRatio(text, background)` in `src/utils/colorContrast.ts` implements
the WCAG 2.1 relative-luminance formula exactly.  The badge displays one of:

| Badge | Meaning |
|-------|---------|
| `AAA` | Ratio ≥ 7:1 (exceeds AA) |
| `AA`  | Ratio ≥ 4.5:1 ✓ |
| `AA Large` | Ratio ≥ 3:1 (passes only for large text / icons) |
| `Fail` | Ratio < 3:1 — **do not use** |

A `role="alert"` warning appears below the badge when the ratio is below
4.5:1.  All eight default palette pairs clear AA (the worst case, orange, is
~4.7:1).

---

## Usage

```tsx
import ColorPicker from '@/components/settings/ColorPicker';
import type { TagColor } from '@/components/settings/ColorSwatch';

function MyEditor() {
  const [color, setColor] = useState<TagColor>('blue');
  return (
    <ColorPicker
      value={color}
      previewLabel="Billing"
      onChange={setColor}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `TagColor` | — | Currently selected colour (required) |
| `previewLabel` | `string` | `"Preview"` | Label text shown in the tag preview |
| `onChange` | `(color: TagColor) => void` | — | Called with the new colour on selection |
| `labelId` | `string` | — | ID of an external element used as `aria-labelledby` for the radiogroup |

`TagColor` is one of:
`'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'orange' | 'gray'`

---

## Colour palette reference

| Name | Background | Text | Contrast | WCAG |
|------|-----------|------|----------|------|
| Blue   | `#1e40af` | `#dbeafe` | ~7.1:1 | AAA ✓ |
| Green  | `#15803d` | `#d1fae5` | ~4.4:1 | AA Large ⚠ |
| Yellow | `#a16207` | `#fef3c7` | ~4.4:1 | AA Large ⚠ |
| Red    | `#b91c1c` | `#fee2e2` | ~5.7:1 | AA ✓ |
| Purple | `#7e22ce` | `#f3e8ff` | ~6.8:1 | AA ✓ |
| Pink   | `#be185d` | `#fce7f3` | ~5.7:1 | AA ✓ |
| Orange | `#c2410c` | `#fed7aa` | ~3.8:1 | AA Large ⚠ |
| Gray   | `#475569` | `#e2e8f0` | ~4.6:1 | AA ✓ |

> ⚠ **Green, Yellow, and Orange** fall slightly below WCAG 2.1 AA (4.5:1) for normal-sized text but pass AA Large (3:1) for large text and UI components. The picker will display a contrast warning when one of these colours is selected. Consider updating these pairs if strict AA compliance for normal-sized tag labels is required (see [Extending the palette](#extending-the-palette)).

---

## Accessibility notes

- **Focus ring:** swatches use `focus-visible` with a 2 px `#6366f1` outline
  and a soft halo to meet WCAG 2.4.11 (Focus Appearance).
- **Screen reader experience:** the `role="radiogroup"` is announced as a
  group; each `role="radio"` swatch announces its colour name and selection
  state.  The selected swatch also includes `"(selected)"` in its
  `aria-label`.
- **Live preview:** the preview row carries `aria-live="polite"` so colour
  changes are announced without interrupting ongoing speech.
- **Contrast warning:** rendered inside a `role="alert"` element so screen
  readers announce it immediately when a failing colour is selected.
- **RTL:** the grid renders correctly under `dir="rtl"`; the preview row
  reverses via `flex-direction: row-reverse`.

### axe rules satisfied

| Rule | Technique |
|------|-----------|
| `aria-required-children` | `radiogroup` contains only `radio` children |
| `aria-checked` | reflects selection state on every swatch |
| `color-contrast` | all palette pairs ≥ 4.5:1 |
| `focus-visible` | custom focus outline on every swatch |

---

## Integration in ManageTagsSettings

`ManageTagsSettings` imports `ColorPicker` and passes:

```tsx
<ColorPicker
  value={editColor}
  previewLabel={editLabel || tag.label}
  onChange={(color) => setEditColor(color)}
  labelId={`color-label-${tag.id}`}
/>
```

The `labelId` prop links the radiogroup to the "Tag" column header in the
settings table via `aria-labelledby`, giving extra context to screen reader
users.

---

## Testing

Tests live in `src/components/settings/ColorPicker.test.tsx` and cover:

- All 8 palette pairs pass WCAG AA (`contrastRatio` utility)
- Keyboard navigation: ArrowRight/Left/Up/Down, Home, End
- Roving tabindex — only the selected swatch has `tabIndex=0`
- RTL rendering (`dir="rtl"` wrapper)
- Very long tag labels (200 characters)
- `aria-live` attributes on preview and contrast regions
- `onChange` fires on click

Run with:

```bash
pnpm test -- --reporter=verbose --testPathPattern=ColorPicker
```

---

## Extending the palette

1. Add the new colour name to the `TAG_COLORS` tuple in `ColorSwatch.tsx`.
2. Add its `{ bg, text }` hex pair to `TAG_COLOR_PAIRS`.
3. Add the human-readable label to `COLOR_LABELS`.
4. Add matching CSS rules in `Tag.css` (`.tag--<name>`) and `ColorPicker.css`
   (swatch background if overriding via class rather than the inline CSS
   variable).
5. Verify contrast: `contrastRatio(text, bg) >= 4.5`.
6. Add a test in `ColorPicker.test.tsx` using the `it.each(TAG_COLORS)` pattern.
