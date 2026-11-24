# ICU MessageFormat for pluralization and selection

The app uses `i18next-icu` through the shared i18n configuration in
`src/i18n/config.ts`. Put ICU messages in the locale JSON files and pass their
named values to `t()`; do not build translated messages by concatenating text.
Add each key to both `src/locales/en.json` and `src/locales/es.json`.

## Plurals

Use ICU plural rules to let the active locale choose the correct form. The
English `one` and `other` categories shown here are enough for this example;
other languages may need additional categories such as `few` or `many`.

```json
{
  "pricing": {
    "seats": {
      "selected": "{count, plural, one {# seat selected} other {# seats selected}}"
    }
  }
}
```

In a React component, pass the count as the `count` option:

```tsx
const { t } = useTranslation();

return <span>{t('pricing.seats.selected', { count })}</span>;
```

`#` is replaced with the current plural value. For example, the message above
produces “1 seat selected” for one and “3 seats selected” for three.

## Select

Use `select` for a message that changes based on a named string value. Always
include an `other` branch as the fallback.

```json
{
  "team": {
    "invitation": "{gender, select, female {She invited you} male {He invited you} other {They invited you}}"
  }
}
```

```tsx
const { t } = useTranslation();

return <p>{t('team.invitation', { gender })}</p>;
```

The `gender` value selects `female`, `male`, or `other`. Use values that make
sense for the product and locale; translators can adapt the wording in each
locale.

## Nesting plural and select

ICU selectors can be nested when a message depends on more than one value. This
example selects wording by `gender`, then pluralizes the number of seats:

```json
{
  "team": {
    "seatSummary": "{gender, select, female {{count, plural, =0 {She has no seats} one {She has one seat} other {She has # seats}}} male {{count, plural, =0 {He has no seats} one {He has one seat} other {He has # seats}}} other {{count, plural, =0 {They have no seats} one {They have one seat} other {They have # seats}}}}"
  }
}
```

```tsx
const { t } = useTranslation();

return <p>{t('team.seatSummary', { gender, count })}</p>;
```

The `=0` branch matches exactly zero; `one` and `other` follow the locale's
plural rules. In a nested message, `#` refers to the count handled by the
nearest plural selector.

## Replace count-and-suffix templates

Do not manually choose a suffix based on whether a count equals one:

```tsx
const label = `${count} seat${count !== 1 ? 's' : ''}`;
```

Store the whole phrase as an ICU message and let `t()` format it:

```json
{
  "pricing": {
    "seats": {
      "selected": "{count, plural, one {# seat selected} other {# seats selected}}"
    }
  }
}
```

```tsx
const label = t('pricing.seats.selected', { count });
```

This is the same pattern used by `pricing.seats.selected` in
`src/locales/en.json`. Keeping each complete phrase in the locale catalogue
allows translators to use the plural rules and sentence structure required by
their language.
