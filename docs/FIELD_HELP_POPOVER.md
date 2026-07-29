# Inline Field Help Popover

Use `FieldHelpPopover` for secondary field guidance that helps a user decide what to enter without permanently increasing form height.

## Pattern

- Place the info icon directly after the field label by using `FieldLabelWithHelp`.
- Keep content short: one sentence or a compact list of consequences.
- The popover opens by mouse click, `Enter`, or `Space`.
- Focus moves into the popover while open and is trapped until dismissal.
- Dismiss with `Escape`, outside click, or the `Got it` button.
- The popover shifts to the start or end edge when centered placement would overflow the viewport. On small screens, it anchors above the viewport bottom.
- RTL documents mirror overflow alignment by reading `document.dir`.

## When To Use

Use the help popover for contextual explanations, billing consequences, and examples that are useful on demand but not required every time.

Use inline hint text when the guidance is essential for every user before input, such as accepted file formats or irreversible business rules.

Use required-field and validation errors inline below the field. Errors must stay visible, use `aria-invalid`, and be referenced with `aria-describedby` when supported by the field.

## Example

```tsx
<FieldLabelWithHelp
  htmlFor="billing-cycle"
  helpTitle="Billing cycle"
  help={<p>Sets the default renewal cadence for this account.</p>}
>
  Billing Cycle
</FieldLabelWithHelp>
```

## Accessibility Notes

- Trigger buttons use `aria-haspopup="dialog"`, `aria-expanded`, and a specific screen-reader label.
- Open popovers render as `role="dialog"` with `aria-labelledby`.
- The close button receives initial focus and the existing modal focus hook traps `Tab`/`Shift+Tab`.
- `Escape` closes the popover and the explicit close action restores focus to the icon trigger.
- The component avoids hover-only disclosure, so keyboard and touch users receive the same content.

## Verification

Run the unit test:

```bash
npm run test -- src/components/common/FieldHelpPopover.test.tsx --run
```

Run lint before release:

```bash
npm run lint
```
