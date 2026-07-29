# Stellabill Brand Pack Guidelines

Stellabill's brand is built on a dark, technical, and cosmic aesthetic, reflecting its position in the Stellar blockchain ecosystem.

## Merchant brand asset uploader

The Brand Pack now includes a merchant-focused uploader for logo assets. It is designed for review workflows where a brand mark must be checked across header, receipt, and social-share layouts before publication.

### Requirements
- Accept transparent PNG files and SVG assets.
- Validate a minimum size of 512x512 pixels before the asset is promoted to the crop stage.
- Reject SVG content that includes scripts or other unsafe markup.
- Provide a safe-area overlay, crop guidance, and preview tiles for each usage context.

### Accessibility guidance
- The uploader supports drag and drop, browse, and keyboard access.
- Crop handles can be adjusted with arrow keys and the Shift modifier for larger nudges.
- Status messaging and validation errors should be announced through the live region and alert patterns.

## Logo Usage

The logo consists of a stylized "S" in a square box with a linear gradient.

### Variants
- **Full Logo**: Used in headers and navigation. Includes the icon and the name.
- **Icon-only**: Used as favicons, avatars, or where space is limited.

### Primary Colors
- **Cyan**: `#22d3ee` (Main accent)
- **Emerald/Teal**: `#14b8a6` (Gradient endpoint)
- **Primary Background**: `#020617` (Deep slate/navy)

### Clear-space & Sizing
- **Small (sm)**: 32px icon, 16px text. Use in dense UI like sidebar footers.
- **Medium (md)**: 40px icon, 20px text. Default for top navigation.
- **Large (lg)**: 56px icon, 28px text. Use in landing page hero sections.

---

## Iconography

We use **Lucide Icons** with a consistent set of constraints:
- **Stroke Width**: Default to `2` for better visibility in dark mode.
- **Color**: Default `currentColor`, used with `slate-400` for secondary and `cyan-400` for active states.
- **Standard Sizes**: `20px` for standard UI, `16px` for small text-aligned icons.

---

## Illustrations

Illustrations should be **abstract and geometric**, emphasizing the "Stellar" theme through:
- Circular and orbital patterns.
- Subtle linear gradients.
- High transparency layers (`fillOpacity="0.1"`).
- Brand accent colors for details.

### Empty States
Use predefined illustrations for common empty states:
- `EmptyDashboard`: Orbital circles and central diamond.
- `NoTransactions`: Schematic card representation with plus indicator.

---

## Typography

- **Headings**: Inter, bold, tracking `-0.02em`.
- **UI Text**: Inter, medium, tracking `-0.01em`.
