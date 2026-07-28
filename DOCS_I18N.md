# Stellabill I18n Guidelines

This document outlines the rules and conventions for translating microcopy within the Stellabill application. Adhering to these rules ensures that our app remains accessible, easy to translate, and robust against text expansion.

## 1. No Concatenation
Never build sentences by concatenating translated strings together. Sentence structure varies significantly across languages.

**Bad:**
```tsx
{t('Welcome')} + ' ' + userName + ' ' + {t('to Dashboard')}
```

**Good:**
```tsx
{t('dashboard.welcomeMessage', { name: userName })}
// en.json: "Welcome {name} to Dashboard"
```

## 2. Use Named Placeholders
When inserting variables into strings, always use named placeholders instead of indices. This provides context to translators.

**Bad:**
```json
"balance": "Your balance is {0}"
```

**Good:**
```json
"balance": "Your balance is {amount}"
```

## 3. ICU Pluralization Rules
We use `i18next-icu` to support advanced ICU message formatting, which is the industry standard for pluralization and gender forms.

Provide translations for the exact categories your target languages support: `zero`, `one`, `two`, `few`, `many`, and `other`. English typically only needs `one` and `other` (sometimes `zero` is handled as `other`, or explicitly if desired).

**Example in en.json:**
```json
{
  "activeSubscriptions": "{count, plural, =0 {No active subscriptions} one {1 active subscription} other {{count} active subscriptions}}"
}
```
**Usage:**
```tsx
{t('activeSubscriptions', { count: activeCount })}
```

## 4. Length-Expansion Preview Mode
Translating English text into languages like German or Russian often results in text expansion of up to 30%. To ensure our UI components can handle this, we've implemented a length-expansion preview mode.

**How to use:**
Append `?debug_i18n=true` to the URL. The application will automatically append expansion characters to every translated string to simulate a +30% length increase. Use this mode to verify that components wrap gracefully and do not overflow or cause layout shifts.

## 5. Accessibility (WCAG 2.1 AA)
When writing copy for ARIA labels or screen-reader only text, group them logically in `en.json`.
- `aria.openMenu`: "Open menu"
- `aria.closeModal`: "Close modal"

Ensure that dynamically generated strings pronounce correctly on screen readers. Use explicit punctuation within the translation string to enforce proper screen reader cadence.

## 6. Locale switcher

The shared application header includes an accessible locale switcher. Locale entries are grouped by region and include the native language name, English language name, and region. Flags are intentionally not used as the only cue because they represent countries rather than languages and are ambiguous for multi-region languages.

### Interaction contract

- The trigger always exposes the active locale in its accessible name and shows its BCP-47 code (or `AUTO`) visually.
- `Auto · Browser language` is the default. It uses the browser's preferred language and falls back to English.
- Open the menu with the trigger, search by native name, English name, locale code, or region, then use `↑`/`↓`, `Home`, `End`, and `Enter` to select. `Escape` closes and restores focus.
- Region headings remain sticky while the results list scrolls. The list has a labelled `combobox`/`listbox` relationship for assistive technology.
- Selecting an RTL locale updates the document direction. Long native names wrap instead of clipping, and the menu becomes a full-width mobile sheet within the viewport.

When adding a translation bundle, add its resource to `src/i18n/config.ts` and keep the locale catalog in `src/i18n/locales.ts` as the single source for the switcher's display metadata.
