Dunning accessibility notes (WCAG 2.1 AA)

- Banner: Use role="region" and an accessible heading. Provide `aria-live="polite"` so assistive tech announces status changes without interrupting.
- Colors: Ensure contrast ratio >= 4.5:1 for body text and 3:1 for larger text. Banner accent should not reduce readability.
- Focus: Primary CTA should be keyboard-focusable and visible. When navigating from a notification entry to the subscription flow, set focus to the first interactive element.
- Dismissal: Dismiss for now is allowed but should not permanently hide an unresolved failure — prefer session-scoped dismissals. Provide an accessible way to redisplay (via NotificationsCenter).
- Screen reader timeline: The retry schedule should be an ordered list with clear labels and status for each attempt (e.g., "Mar 26 — Next attempt").
- Smart retry visualization: Present each retry as a chip in a horizontal timeline with the attempt label, elapsed/upcoming state, delta, method, and success probability. The "Why these times?" action should expose a dialog with the heuristic summary and support keyboard dismissal.
- Next attempt announcement: Expose the next scheduled attempt in an `aria-live` region so assistive tech announces it when the schedule changes.

Testing suggestions:
- Run axe-core in storybook or against the rendered SubscriptionDetail page.
- Test with NVDA/VoiceOver for live region announcements, focus behavior, and keyboard dismissal of the explanation dialog.
