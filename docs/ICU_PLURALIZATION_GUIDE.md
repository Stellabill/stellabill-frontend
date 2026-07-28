# ICU Pluralization & Gendered-Copy Guide

> **Design-system pattern** · WCAG 2.1 AA · RTL-safe · i18next-icu

This guide documents the standard approach for handling plurals, gendered pronouns, and ordinal forms in Stellabill UI copy. All count-dependent and gender-dependent strings **must** use ICU MessageFormat syntax — never string concatenation.

---

## Why ICU MessageFormat?

| Problem | Concatenation | ICU MessageFormat |
|---|---|---|
| English "1 subscriptions" | ❌ Broken grammar | ✅ `one {1 subscription}` |
| Arabic (6 plural forms) | ❌ Impossible | ✅ `zero`, `one`, `two`, `few`, `many`, `other` |
| Gendered pronouns | ❌ "He/She liked" hacks | ✅ `{gender, select, ...}` |
| Ordinals (1st, 2nd, 3rd) | ❌ Ad-hoc suffix logic | ✅ `{rank, selectordinal, ...}` |
| RTL / BiDi formatting | ❌ Breaks layout | ✅ Handled by ICU runtime |

---

## Quick-Start Cheatsheet

### Plural

Map an integer `count` to the correct grammatical form.

**Intent:** "Show how many items exist"

```json
"{count, plural, =0 {No items} one {1 item} other {{count} items}}"
```

| `count` | Output |
|---|---|
| 0 | No items |
| 1 | 1 item |
| 5 | 5 items |
| 1000 | 1,000 items |

**Usage in React:**
```tsx
import { useTranslation } from 'react-i18next';

function ItemCount({ count }: { count: number }) {
  const { t } = useTranslation();
  return <span>{t('items.count', { count })}</span>;
}
```

### Select (Gender / Role)

Choose copy based on a string value like `gender`.

**Intent:** "Use the right pronoun"

```json
"{gender, select, male {He liked} female {She liked} other {They liked}} your post"
```

| `gender` | Output |
|---|---|
| `male` | He liked your post |
| `female` | She liked your post |
| `nonbinary` | They liked your post |
| (missing) | They liked your post |

> [!IMPORTANT]
> Always include an `other` branch as the fallback — it covers unexpected values and non-binary identities.

### Select Ordinal

Format rank/position suffixes correctly.

**Intent:** "Show ranking position"

```json
"You finished {rank, selectordinal, one {{rank}st} two {{rank}nd} few {{rank}rd} other {{rank}th}}"
```

| `rank` | Output |
|---|---|
| 1 | You finished 1st |
| 2 | You finished 2nd |
| 3 | You finished 3rd |
| 4 | You finished 4th |
| 11 | You finished 11th |
| 22 | You finished 22nd |

### Combined (Gender + Plural)

Nest `select` and `plural` for complex sentences.

```json
"{gender, select, male {He has} female {She has} other {They have}} {count, plural, one {1 invoice} other {{count} invoices}}"
```

| `gender` | `count` | Output |
|---|---|---|
| `male` | 1 | He has 1 invoice |
| `female` | 3 | She has 3 invoices |
| `other` | 0 | They have 0 invoices |

---

## CLDR Plural Categories Reference

Different languages require different plural categories. English needs only `one` and `other`, but your ICU strings should be ready for translation.

| Category | English example | Used by |
|---|---|---|
| `zero` | — | Arabic, Latvian, Welsh |
| `one` | 1 | English, French, German, Spanish |
| `two` | — | Arabic, Hebrew, Slovenian |
| `few` | — | Czech, Polish, Russian, Arabic |
| `many` | — | Arabic, Polish, Russian |
| `other` | 0, 2, 3, … | **All languages** (required) |

> [!WARNING]
> The `other` category is **mandatory** in every plural block. ICU parsers will throw at runtime if it is missing.

---

## Stellabill Conventions

### Naming

| Pattern | Key naming convention | Example |
|---|---|---|
| Plural count | `*.count` or descriptive noun | `subscriptions.subscriptionCount` |
| Gendered copy | `*.gendered` | `activity.userAction` |
| Ordinal | `*.ordinal` | `leaderboard.rank` |
| ARIA live region | `*.liveRegion` | `notifications.liveRegion` |

### Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| `t('items.count', { count })` | `` `${count} items` `` |
| `t('user.greeting', { gender })` | `count === 1 ? 'item' : 'items'` |
| Use `=0` for explicit zero | Omit the `other` branch |
| Keep full sentences in one key | Split sentences across keys |
| Test with 0, 1, 2, 5, 21 | Test only with 1 and 2 |

---

## Accessibility (WCAG 2.1 AA)

### Live Regions

For dynamically changing counts (e.g., unread notifications), use `aria-live="polite"` with ICU-formatted strings:

```tsx
<span aria-live="polite">
  {t('notifications.liveRegion', { count: unreadCount })}
</span>
```

This ensures screen readers announce grammatically correct updates like "1 unread billing notification" instead of "1 unread billing notifications".

### ARIA Labels

Always use ICU for aria-labels that include counts:

```tsx
<button aria-label={t('notifications.triggerLabel', { count: unreadCount })}>
```

### Screen Reader Testing Matrix

| Scenario | Expected announcement |
|---|---|
| 0 unread | "All billing notifications are read" |
| 1 unread | "1 unread billing notification" |
| 5 unread | "5 unread billing notifications" |

---

## Responsive Considerations

- ICU-formatted strings may be **longer** than English in other locales (e.g., German +30%)
- Use the `?debug_i18n=true` query parameter to test with pseudo-locale expansion
- Ensure containers use `overflow-wrap: break-word` and flexible widths
- Test badge overflow: numbers > 9 should show `9+`

---

## RTL / BiDi Support

- ICU MessageFormat handles BiDi isolation automatically
- Embedded numbers in RTL text are wrapped in Unicode directional isolates
- Test with `dir="rtl"` on the root element to verify layout
- Avoid manual Unicode control characters — let the ICU library handle them

---

## Edge Cases to Test

| Count | English category | Test expectation |
|---|---|---|
| `0` | `other` (or `=0`) | "No items" or "0 items" |
| `1` | `one` | "1 item" (singular) |
| `2` | `other` | "2 items" |
| `5` | `other` | "5 items" |
| `11` | `other` | "11 items" (not "11st") |
| `21` | `other` | "21 items" |
| `100` | `other` | "100 items" |
| `1000000` | `other` | "1,000,000 items" |
| `-1` | `one` | Graceful handling |

---

## ESLint Enforcement

A custom ESLint rule `no-count-concatenation` flags string template literals that concatenate counts with nouns. See `eslint.config.js` for configuration.

Flagged patterns:
- `` `${count} subscription` ``
- `` `${count} item${count === 1 ? '' : 's'}` ``
- `count + ' notifications'`

Allowed patterns:
- `t('subscriptions.subscriptionCount', { count })`
- `t('notifications.unreadCount', { count: unreadCount })`

---

## Migration Checklist

When converting existing concatenated strings to ICU:

1. [ ] Identify the concatenation pattern
2. [ ] Create an ICU MessageFormat string in `en.json`
3. [ ] Replace inline string with `t()` call
4. [ ] Add `=0`, `one`, `other` branches (minimum)
5. [ ] Update ARIA attributes if the string is used in accessibility contexts
6. [ ] Add/update tests to cover 0, 1, and plural cases
7. [ ] Run `?debug_i18n=true` to verify text expansion
8. [ ] Run axe or similar tool for accessibility regression
