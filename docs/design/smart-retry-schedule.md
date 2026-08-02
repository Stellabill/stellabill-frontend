# Smart-Retry Schedule Visualization -- Design Spec

Visual timeline showing retry attempts with status indicators and next scheduled retry.
- Timeline: horizontal/vertical bar with retry dots
- States: success green, failed red, pending grey, skipped yellow
- Hover: tooltip with attempt details
- Accessibility: role=progressbar with aria-valuenow
- Responsive: horizontal on desktop, vertical on mobile