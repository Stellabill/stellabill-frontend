# Password Strength Meter — Design Specification

## Overview
A real-time password strength meter with actionable guidance that helps users create strong passwords during registration and password change flows.

## Visual Design

### Strength Indicator Bar
- **Position**: Directly below password input field (8px gap)
- **Dimensions**: Full input width, 6px height, border-radius 3px
- **Color Scale** (left to right fill):
  - *Very Weak* (0-20%): Red #EF4444
  - *Weak* (20-40%): Orange #F97316
  - *Fair* (40-60%): Yellow #EAB308
  - *Good* (60-80%): Blue #3B82F6
  - *Strong* (80-100%): Green #22C55E
- **Animation**: Width transition 300ms ease-out on score change

### Score Label
- **Position**: Right of the bar
- **Typography**: 12px, semi-bold, matching bar color
- **Labels**: "Very Weak" / "Weak" / "Fair" / "Good" / "Strong"

### Requirement Checklist
- **Position**: Below strength bar (12px gap)
- **Layout**: Vertical list, 8px item spacing
- **Typography**: 13px, checklist items with ✓/✗ icons
- **Items**:
  - At least 8 characters
  - Contains uppercase letter
  - Contains lowercase letter
  - Contains number
  - Contains special character
  - Not a common password
- **Completed**: Green checkmark, green text (#16A34A)
- **Incomplete**: Grey cross, grey text (#6B7280)
- **Animation**: Items turn green with a subtle pop (scale 1→1.1→1) when satisfied

### Guidance Text
- **Position**: Below checklist
- **Typography**: 13px, italic, #6B7280
- **Content**: Contextual hint based on weakest criterion (e.g., "Try adding a special character like !@#$%")

## Scoring Algorithm
```
base_score = min(length * 4, 40)
+ has_upper ? 10 : 0
+ has_lower ? 10 : 0
+ has_digit ? 10 : 0
+ has_special ? 10 : 0
+ has_mixed_case ? 5 : 0
+ length >= 12 ? 15 : 0
- repeated_chars * 2
- sequential * 3
max_score = 100
```

## Accessibility
- `aria-valuemin="0" aria-valuemax="100" aria-valuenow="{score}"` on bar
- `aria-label="Password strength: {label}, {score} out of 100"`
- Checklist items: `role="list"` with `aria-label` per item
- Guidance text: `aria-live="polite"` for dynamic updates
- Focus: Meter is after input in tab order

## Edge Cases
- Empty field: Bar at 0%, no checklist shown
- Paste event: Trigger re-evaluation
- Password manager autofill: Trigger re-evaluation
- Very long password (>64 chars): Truncate visual, still score full length
- RTL languages: Mirror layout

## Dependencies
- `zxcvbn` or `zxcvbn-ts` library for entropy-based scoring (alternative to basic rules)
- Debounce input events at 150ms
