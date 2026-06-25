# Command Palette

A global, keyboard-first command palette that lets users **jump to pages**, **run
actions** (create plan, issue refund, pause subscription), and **recall recent
items** — without leaving the keyboard.

- Component: [`src/components/CommandPalette.tsx`](../src/components/CommandPalette.tsx)
- Styles: [`src/styles/command-palette.css`](../src/styles/command-palette.css)
- Wired into the app shell: [`src/components/Layout.tsx`](../src/components/Layout.tsx)
- Tests: [`src/components/CommandPalette.test.tsx`](../src/components/CommandPalette.test.tsx)

This palette extends the navigation-search work from the previous batch; its focus
is **actions**, **keyboard ergonomics**, and **result grouping**.

## Opening & dismissing

| Interaction | Behaviour |
| --- | --- |
| `⌘K` / `Ctrl+K` | Toggles the palette open/closed (global, registered in `Layout`). |
| Sidebar **Search…** button | Opens the palette — discoverable for pointer/touch users. |
| `Esc` | Dismisses the palette. |
| Click on the backdrop | Dismisses the palette. |

The `mod+k` listener calls `preventDefault()` so it never collides with browser
defaults, and the trigger button advertises the shortcut via
`aria-keyshortcuts="Meta+K Control+K"`.

## Result grouping

Results are bucketed and always rendered in a fixed order:

1. **Pages** — every primary/developer destination in the app shell.
2. **Actions** — verbs the user can run (Create plan, Issue refund, Pause subscription).
3. **Recent** — the last five selections, persisted to `localStorage`
   (`sb:recent-commands`) and surfaced for fast recall.

Filtering matches the visible label **and** an item's `hint`/`keywords`, so
synonyms (e.g. "customers" → Subscriptions) resolve. Empty groups are hidden.

## States

| State | What the user sees |
| --- | --- |
| **Results** | Grouped `listbox` with the first option pre-highlighted. |
| **No results** | "No results" panel echoing the query; combobox collapses (`aria-expanded="false"`). |
| **Slow load** | Spinner + "Searching…" with `aria-busy="true"` (driven by the `isLoading` prop for async sources). |

## Keyboard model

| Key | Action |
| --- | --- |
| `↓` / `↑` | Move the active option; wraps at both ends. |
| `Home` / `End` | Jump to the first / last option. |
| `Enter` | Run the active option, then close. |
| `Esc` | Close. |
| `Tab` / `Shift+Tab` | Cycles within the trapped focus scope. |

Navigation never moves DOM focus off the input — the active option is tracked with
`aria-activedescendant`, per the APG combobox guidance.

## Accessibility (WCAG 2.1 AA)

- **Combobox pattern** — the input is `role="combobox"` with `aria-autocomplete="list"`,
  `aria-expanded`, `aria-controls` pointing at the `role="listbox"`, and
  `aria-activedescendant` referencing the highlighted `role="option"`.
- **Grouping** — each bucket is a `role="group"` labelled by its heading via
  `aria-labelledby`.
- **Dialog semantics** — the panel is `role="dialog"` + `aria-modal="true"` +
  `aria-label="Command palette"`.
- **Focus trap & return** — reuses the shared
  [`useModalFocus`](../src/hooks/useModalFocus.ts) hook documented in
  [`DOCS_MODAL_ACCESSIBILITY.md`](../DOCS_MODAL_ACCESSIBILITY.md): focus moves to the
  input on open, is trapped while open, and is restored to the trigger on close.
- **Result count** — a polite `role="status"` live region announces
  "N results available." / "No results for …" as the query changes.
- **Visible focus** — `:focus-visible` rings on the input and trigger use the shared
  `--sidebar-focus-ring` token.
- **Reduced motion** — the loading spinner respects `prefers-reduced-motion`.

### axe notes

Manual review against the combobox ruleset: input role/state attributes are present
and correctly cross-referenced, every option has an `id` matching the
`aria-activedescendant`, group headings are associated, and contrast for text on the
`#14142a` surface meets AA. No `aria-*` references dangle (verified against rendered
ids in the test suite).

## Responsive

- **Desktop/tablet** — centred dialog (max-width 640px) anchored near the top, with a
  keyboard-legend footer.
- **Mobile (≤768px)** — promotes to a full-screen sheet (no rounded corners, footer
  hidden) so the on-screen keyboard and result list coexist comfortably.

## Reuse

`CommandPalette` is presentation-only and data-driven. Provide an `items: CommandItem[]`
array; each item declares its `group`, an optional `hint`/`keywords`/`icon`, and a
`perform()` callback. `Layout` builds the catalog from the route table and records
selections through `onSelect`, but any surface can mount the palette with its own
command set.

```tsx
<CommandPalette
  isOpen={open}
  onClose={() => setOpen(false)}
  items={items}            // CommandItem[] grouped into Pages / Actions / Recent
  onSelect={recordRecent}  // optional — fires before close
  isLoading={false}        // optional — renders the slow-load state
/>
```

## Tests

`CommandPalette.test.tsx` covers the combobox/listbox wiring, grouping, label/keyword
filtering, the no-results and slow-load states, full keyboard traversal (arrows/Home/End/Enter
with wrap-around), pointer selection, backdrop dismissal, the live-region count, and
focus return to the trigger on close. Coverage: 100% statements/functions/lines.

```bash
npm test src/components/CommandPalette.test.tsx
```
