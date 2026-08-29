# Gift Subscription Flow Design

## Overview

This document outlines the complete design for the gift subscription purchase and redemption flow in Stellabill. The flow allows users to purchase subscription plans as gifts for others, customize messages, generate shareable codes, and enable recipients to redeem those codes.

## User Journey

### 1. Giver Flow
1. **Browse Plans** → User views available plans on `/browse-plans`
2. **Select Gift** → Clicks "Send as gift" button on a plan card
3. **Customize Gift** → Fills in recipient info and personal message
4. **Review & Purchase** → Confirms details and completes transaction
5. **Share Code** → Receives gift code and sharing options

### 2. Recipient Flow
1. **Receive Gift** → Gets gift code via email, social, or direct link
2. **Redeem Code** → Enters code on redemption page
3. **Confirm Redemption** → Reviews gift details and activates
4. **Welcome** → Lands on success page with subscription details

## Design Principles

- **Accessible (WCAG 2.1 AA)**: Full keyboard navigation, screen reader support, proper ARIA attributes
- **Responsive**: Mobile-first design that scales to desktop
- **Consistent**: Follows existing Stellabill design patterns and components
- **Celebratory**: Uses joyful yet professional visuals appropriate for gifting
- **Clear**: Provides transparency at every step with explicit CTAs

## Screen Designs

### 1. Plan Card with Gift Affordance

**Location**: `src/components/PlanCard.tsx` (enhanced)

**Changes**:
- Add "Send as gift" button below the "Subscribe" button
- Use gift icon (Lucide React `Gift`)
- Subtle visual differentiation from primary subscribe action
- Hover state with gift-themed gradient

**Visual Design**:
```
┌─────────────────────────────────┐
│  📰  Stellar News               │
│                                  │
│  Premium Access                  │
│                                  │
│  10 USDC / Monthly              │
│  Billed every month             │
│                                  │
│  Get unlimited access...        │
│                                  │
│  ┌───────────────────────────┐  │
│  │     Subscribe             │  │  ← Primary action
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  🎁  Send as gift         │  │  ← Gift action
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 2. Gift Purchase Modal (Step 1: Recipient Information)

**Component**: `src/components/GiftPurchaseModal.tsx` (new)

**Fields**:
- Recipient Name (optional, text input)
- Recipient Email (required, email input)
- Gift Duration (select: 1 month, 3 months, 6 months, 12 months)
- Personal Message (optional, textarea, max 300 chars)
- Delivery Method (select: Email immediately, Email on specific date, Get code to share)

**Visual Design**:
```
┌──────────────────────────────────────────────┐
│  🎁                                   ✕      │
│  Send Premium Access as a gift               │
│  Give someone unlimited access...            │
│                                              │
│  ◉──────○──────○                           │
│  Gift Details  Review  Complete              │
│                                              │
│  Recipient Information                       │
│  ┌────────────────────────────────────────┐ │
│  │ Recipient name (optional)              │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ recipient@email.com *                  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Gift Duration                               │
│  ┌────────────────────────────────────────┐ │
│  │ 12 months               ▼              │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Personal Message (optional)                 │
│  ┌────────────────────────────────────────┐ │
│  │ I thought you'd enjoy this...          │ │
│  │                                        │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│  0 / 300                                     │
│                                              │
│  Delivery                                    │
│  ┌────────────────────────────────────────┐ │
│  │ Email immediately           ▼          │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ┌──────────┐  ┌─────────────────────────┐ │
│  │ Cancel   │  │  Review gift  →         │ │
│  └──────────┘  └─────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 3. Gift Purchase Modal (Step 2: Review)

**Visual Design**:
```
┌──────────────────────────────────────────────┐
│  🎁                                   ✕      │
│  Send Premium Access as a gift               │
│                                              │
│  ○──────◉──────○                           │
│  Gift Details  Review  Complete              │
│                                              │
│  Gift Summary                                │
│  ┌────────────────────────────────────────┐ │
│  │  Plan           Premium Access         │ │
│  │  Recipient      jane@example.com       │ │
│  │  Duration       12 months              │ │
│  │  Delivery       Email immediately      │ │
│  │  ─────────────────────────────────     │ │
│  │  Total          120 USDC               │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Your Message                                │
│  ┌────────────────────────────────────────┐ │
│  │  "I thought you'd enjoy this           │ │
│  │   subscription. Happy coding!"         │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ℹ️  The recipient will receive a unique    │
│  redemption code and instructions.           │
│                                              │
│  ┌──────────┐  ┌─────────────────────────┐ │
│  │ ← Back   │  │  Confirm purchase       │ │
│  └──────────┘  └─────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 4. Gift Code Confirmation (Step 3: Complete)

**Visual Design**:
```
┌──────────────────────────────────────────────┐
│  ✓                                    ✕      │
│  Gift sent successfully!                     │
│                                              │
│  ○──────○──────◉                           │
│  Gift Details  Review  Complete              │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │                                        │ │
│  │       GIFT-ABC123-XYZ789               │ │
│  │                                        │ │
│  │  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │  Copy    │  │  Share  →        │  │ │
│  │  └──────────┘  └──────────────────┘  │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  📧  We've sent redemption instructions      │
│      to jane@example.com                     │
│                                              │
│  Share this gift                             │
│  ┌────────────────────────────────────────┐ │
│  │  📧 Email    💬 Message    🔗 Link     │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  What's next                                 │
│  • The recipient can redeem using the code   │
│  • They'll get 12 months of Premium Access   │
│  • The subscription starts immediately       │
│    after redemption                          │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │           Done                          │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 5. Redemption Entry Page

**Component**: `src/pages/RedeemGift.tsx` (new)
**Route**: `/redeem-gift`

**Visual Design**:
```
┌────────────────────────────────────────────────┐
│  [Navbar]                                      │
├────────────────────────────────────────────────┤
│                                                │
│              🎁                                │
│                                                │
│         Redeem Your Gift                       │
│                                                │
│    Enter the code from your gift to unlock     │
│         your subscription                      │
│                                                │
│    ┌────────────────────────────────────────┐ │
│    │ GIFT-                                  │ │
│    └────────────────────────────────────────┘ │
│                                                │
│    ┌────────────────────────────────────────┐ │
│    │         Redeem gift  →                 │ │
│    └────────────────────────────────────────┘ │
│                                                │
│    Don't have a code? Browse plans             │
│                                                │
│    ─────────────────────────────────────────  │
│                                                │
│    How it works                                │
│    1. Enter your gift code above              │
│    2. Review the subscription details          │
│    3. Activate your gift subscription          │
│                                                │
└────────────────────────────────────────────────┘
```

### 6. Redemption Confirmation Modal

**Component**: `src/components/RedeemConfirmModal.tsx` (new)

**Visual Design**:
```
┌──────────────────────────────────────────────┐
│  🎁                                   ✕      │
│  Confirm Your Gift Subscription              │
│                                              │
│  Gift From: Sarah Johnson                    │
│  (or "Anonymous" if no name provided)        │
│                                              │
│  Your Gift Subscription                      │
│  ┌────────────────────────────────────────┐ │
│  │                                        │ │
│  │  📰 Premium Access                     │ │
│  │  Stellar News                          │ │
│  │                                        │ │
│  │  Duration    12 months                 │ │
│  │  Value       120 USDC                  │ │
│  │  Starts      Immediately upon redemption│ │
│  │  Expires     Aug 29, 2027              │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Personal Message                            │
│  ┌────────────────────────────────────────┐ │
│  │  "I thought you'd enjoy this           │ │
│  │   subscription. Happy coding!"         │ │
│  │   — Sarah                              │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ℹ️  By redeeming, you accept the terms      │
│      and your subscription begins immediately│
│                                              │
│  ┌──────────┐  ┌─────────────────────────┐ │
│  │ Cancel   │  │  Activate subscription  │ │
│  └──────────┘  └─────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Component Architecture

### New Components

1. **GiftPurchaseModal.tsx**
   - Three-step modal for gift purchase flow
   - Form validation with inline errors
   - Loading states for submission
   - Success state with share options

2. **RedeemGift.tsx** (Page)
   - Code entry form
   - Validation for code format
   - Error handling (invalid, expired, already redeemed)
   - Connects to RedeemConfirmModal

3. **RedeemConfirmModal.tsx**
   - Displays gift details
   - Shows gifter name and message
   - Confirms subscription start date
   - Success leads to GiftRedeemSuccess

### Updated Components

1. **PlanCard.tsx**
   - Add `onSendGift` callback prop
   - Add "Send as gift" button
   - Add gift-themed styling

2. **BrowsePlans.tsx**
   - Handle gift purchase modal state
   - Pass gift handler to PlanCard

## API Integration Points

### Endpoints Required

```typescript
// Gift Purchase
POST /api/gifts/purchase
Request: {
  planId: string;
  recipientEmail: string;
  recipientName?: string;
  duration: number; // months
  message?: string;
  deliveryMethod: 'email' | 'manual';
  deliveryDate?: string;
}
Response: {
  giftCode: string;
  giftId: string;
  expiresOn: string;
  recipientEmail: string;
}

// Gift Validation
GET /api/gifts/validate/:code
Response: {
  valid: boolean;
  gift?: {
    planId: string;
    planName: string;
    merchant: string;
    duration: number;
    gifterName?: string;
    message?: string;
    value: number;
    currency: string;
    expiresOn: string;
  };
  error?: 'invalid' | 'expired' | 'redeemed' | 'network';
}

// Gift Redemption
POST /api/gifts/redeem
Request: {
  code: string;
  recipientWalletAddress?: string;
}
Response: {
  success: boolean;
  subscriptionId: string;
  startsOn: string;
  expiresOn: string;
}
```

## Accessibility Requirements

### Keyboard Navigation
- All interactive elements accessible via Tab/Shift+Tab
- Escape closes modals
- Enter submits forms
- Arrow keys navigate radio/select options

### Screen Reader Support
- Proper ARIA labels on all form fields
- Live regions for dynamic content (errors, success messages)
- Role="dialog" with aria-modal="true" on modals
- Descriptive alt text and aria-labels

### Visual Accessibility
- 4.5:1 contrast ratio minimum for text
- Focus indicators visible (2px outline)
- No color-only information (icons + text)
- Reduced motion support

### Form Accessibility
- Labels associated with inputs
- Error messages linked via aria-describedby
- Required fields marked with aria-required
- Validation errors announced

## Responsive Breakpoints

- **Mobile**: < 640px
  - Single column layout
  - Stacked buttons
  - Full-width modals with bottom sheets on mobile
  
- **Tablet**: 640px - 1024px
  - Two-column plan grid
  - Modal max-width: 600px
  
- **Desktop**: > 1024px
  - Three-column plan grid
  - Modal max-width: 700px

## Error Handling

### Validation Errors
- **Empty email**: "Please enter a recipient email address"
- **Invalid email**: "Please enter a valid email address"
- **Invalid code format**: "Please enter a valid gift code (e.g., GIFT-ABC123-XYZ789)"
- **Message too long**: "Message must be 300 characters or less (currently X)"

### Server Errors
- **Invalid code**: "This gift code is not recognized. Please check and try again."
- **Expired code**: "This gift code expired on [date]. Please contact the sender."
- **Redeemed code**: "This gift has already been redeemed."
- **Network error**: "Unable to connect. Please check your connection and try again."
- **Purchase failed**: "Gift purchase failed. Your payment was not processed. Please try again."

## Edge Cases

1. **Anonymous Gift**: Recipient name field is optional; display "A friend" or "Someone special" if not provided
2. **Expired Code**: Show expiration date and suggest browsing plans
3. **Already Redeemed**: Inform user and offer to browse plans
4. **Mobile Share Sheet**: Use native share API when available on mobile devices
5. **Invalid Code Format**: Validate code format client-side before API call
6. **Concurrent Redemption**: Handle race condition if code is redeemed by multiple users simultaneously

## Testing Requirements

### Unit Tests
- Form validation logic
- Code format validation
- Date calculations
- Error message generation

### Component Tests
- Modal open/close behavior
- Form submission
- Step navigation
- Success state rendering

### Integration Tests
- Complete gift purchase flow
- Complete redemption flow
- Error states
- API error handling

### Accessibility Tests
- Keyboard navigation
- Screen reader announcements
- Focus management
- ARIA attributes

### Visual Regression Tests
- Plan card with gift button
- Gift modal all steps
- Redemption page
- Mobile responsive views

## Implementation Phases

### Phase 1: Core Components (Week 1)
- [ ] GiftPurchaseModal (all steps)
- [ ] Update PlanCard with gift affordance
- [ ] Basic styling and layout
- [ ] Unit tests

### Phase 2: Redemption Flow (Week 1)
- [ ] RedeemGift page
- [ ] RedeemConfirmModal
- [ ] Code validation
- [ ] Unit and integration tests

### Phase 3: Integration & Polish (Week 2)
- [ ] API integration
- [ ] Error handling
- [ ] Loading states
- [ ] Share functionality
- [ ] Mobile optimizations

### Phase 4: Accessibility & Testing (Week 2)
- [ ] Full accessibility audit
- [ ] Screen reader testing
- [ ] Keyboard navigation testing
- [ ] Visual regression tests
- [ ] Coverage > 95%

## Success Metrics

- Gift purchase completion rate > 80%
- Redemption rate > 70%
- Average time to complete gift purchase < 2 minutes
- Error rate < 5%
- Zero critical accessibility violations
- Test coverage > 95%

## Design Tokens

### Colors
- **Primary Gradient**: `linear-gradient(135deg, #22d3ee 0%, #14b8a6 100%)`
- **Success**: `#10b981`
- **Warning**: `#fbbf24`
- **Error**: `#ef4444`
- **Gift Accent**: `#a855f7` (purple for gift-specific elements)

### Typography
- **Heading XL**: 3.5rem / 800 weight
- **Heading L**: 2rem / 700 weight
- **Heading M**: 1.25rem / 700 weight
- **Body L**: 1.125rem / 400 weight
- **Body M**: 1rem / 400 weight
- **Body S**: 0.875rem / 400 weight

### Spacing
- **Section Gap**: 2.5rem
- **Card Padding**: 2rem
- **Element Gap**: 1rem
- **Tight Gap**: 0.5rem

### Borders
- **Radius L**: 16px
- **Radius M**: 12px
- **Radius S**: 8px
- **Border**: 1px solid rgba(255, 255, 255, 0.1)

## Notes for Developers

1. **Modal Focus Management**: Use existing `useModalFocus` hook
2. **Form State**: Consider using React Hook Form for complex validation
3. **API Mocking**: Mock API responses in development until backend ready
4. **Code Format**: Enforce "GIFT-XXXXXX-YYYYYY" format
5. **Share API**: Use Web Share API with fallback to copy-to-clipboard
6. **Animation**: Use Framer Motion for celebratory animations (already in dependencies)
7. **Icons**: Use Lucide React icons (already in dependencies)
8. **Testing**: Use Vitest + Testing Library (already configured)

## References

- [DOCS_MODAL_ACCESSIBILITY.md](../DOCS_MODAL_ACCESSIBILITY.md)
- [DOCS_ERROR_HANDLING.md](../DOCS_ERROR_HANDLING.md)
- [TopUpModal.tsx](../src/components/TopUpModal.tsx) - Similar multi-step pattern
- [WalletConnectModal.tsx](../src/components/WalletConnectModal.tsx) - Modal styling reference
