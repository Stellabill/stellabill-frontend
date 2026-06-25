# Dark mode theme tokens

Stellabill now exposes a first-class semantic theme layer in `src/styles/tokens.css`.
Light is the default theme. Dark mode is enabled by setting `data-theme="dark"` on
`document.documentElement`; when there is no saved manual preference, the app follows
`prefers-color-scheme`.

## Token pairs

| Semantic token | Light value | Dark value | Usage |
| --- | --- | --- | --- |
| `--color-surface-canvas` | `#f8fafc` | `#00060f` | App/browser canvas |
| `--color-surface-page` | `#f1f5f9` | `#020617` | Page backgrounds |
| `--color-surface-card` | `#ffffff` | `#0a0f16` | Cards, tables, panels |
| `--color-surface-elevated` | `#ffffff` | `#0f172a` | Modals, chart containers, raised surfaces |
| `--color-surface-control` | `#ffffff` | `rgba(148, 163, 184, 0.10)` | Buttons, inputs, tabs |
| `--color-border-subtle` | `#e2e8f0` | `rgba(148, 163, 184, 0.16)` | Hairline borders |
| `--color-border-default` | `#cbd5e1` | `rgba(148, 163, 184, 0.28)` | Interactive borders |
| `--color-border-strong` | `#94a3b8` | `rgba(203, 213, 225, 0.42)` | Hover/focus-adjacent borders |
| `--color-text-primary` | `#0f172a` | `#f8fafc` | Main headings and body text |
| `--color-text-secondary` | `#334155` | `#cbd5e1` | Secondary headings and table cells |
| `--color-text-muted` | `#475569` | `#94a3b8` | Supporting labels and metadata |
| `--color-text-subtle` | `#64748b` | `#64748b` | Lowest-emphasis readable copy |
| `--color-brand-primary` | `#067d99` | `#22d3ee` | Primary brand accent |
| `--color-brand-accent` | `#0f766e` | `#2dd4bf` | Secondary brand accent |
| `--color-brand-on` | `#ffffff` | `#02131a` | Text/icons on brand buttons |
| `--color-focus-ring` | `#0891b2` | `#22d3ee` | Keyboard focus indicators |

## Contrast notes

WCAG 2.1 AA requires 4.5:1 for normal text and 3:1 for large text/non-text focus indicators.
The token combinations below were checked while implementing the theme.

| Pair | Contrast |
| --- | ---: |
| Light primary text `#0f172a` on canvas `#f8fafc` | 17.06:1 |
| Light secondary text `#334155` on card `#ffffff` | 10.35:1 |
| Light muted text `#475569` on card `#ffffff` | 7.58:1 |
| Light subtle text `#64748b` on card `#ffffff` | 4.76:1 |
| Light brand text `#067d99` on card `#ffffff` | 4.77:1 |
| Light brand-on text `#ffffff` on brand `#067d99` | 4.77:1 |
| Light success badge text on success bg | 6.78:1 |
| Light warning badge text on warning bg | 6.37:1 |
| Light danger badge text on danger bg | 6.80:1 |
| Dark primary text `#f8fafc` on page `#020617` | 19.28:1 |
| Dark secondary text `#cbd5e1` on card `#0a0f16` | 12.94:1 |
| Dark muted text `#94a3b8` on card `#0a0f16` | 7.49:1 |
| Dark brand text `#7dd3e0` on card `#0a0f16` | 11.22:1 |
| Dark brand-on text `#02131a` on brand `#22d3ee` | 10.46:1 |
| Dark success badge text on composited success bg | 11.47:1 |
| Dark warning badge text on composited warning bg | 11.26:1 |
| Dark danger badge text on composited danger bg | 9.23:1 |

## Runtime behavior

- `src/hooks/useTheme.ts` reads `localStorage.stellabill-theme-preference`.
- If the key is absent, the app follows `prefers-color-scheme` and updates when the OS theme changes.
- Clicking `ThemeToggle` writes an explicit `light` or `dark` preference and sets `data-theme`.
- The toggle is a native button with `aria-pressed`, clear accessible labels, and visible focus rings in both themes.

## Implementation rules

1. Use semantic tokens (`--color-surface-*`, `--color-text-*`, `--color-border-*`, `--color-brand-*`) instead of hardcoded colors.
2. Use elevation tokens (`--shadow-*`) for raised surfaces rather than raw box-shadows.
3. Validate any new foreground/background combination against WCAG 2.1 AA before adding it.
4. Keep focus indicators at least 3:1 against adjacent colours in both themes.
