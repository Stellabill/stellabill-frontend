# Subscription Card API Integration Guide

## Current Implementation
The Subscriptions page currently displays mock data with two sample subscription cards. To integrate with your backend API:

## API Integration Steps

### 1. Update Subscriptions.tsx to fetch real data:

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/api/customer/subscriptions');
        setSubscriptions(response.data);
      } catch (err) {
        console.error('Failed to fetch subscriptions:', err);
        setError('Failed to load subscriptions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubscriptions();
  }, []);

  // ... rest of component
}
```

### 2. Expected API Response Format:

```json
{
  "data": [
    {
      "id": "SUB-001",
      "planName": "Premium Access",
      "merchant": "Stellar News",
      "status": "active",
      "price": 10,
      "currency": "USDC",
      "interval": "month",
      "prepaidBalance": 30,
      "coverage": 3,
      "nextChargeDate": "Mar 15, 2026",
      "icon": "📰"
    }
  ]
}
```

### 3. API Endpoint Specification:

- **Endpoint**: `GET /api/customer/subscriptions`
- **Authentication**: Required (customer token)
- **Response**: Array of subscription objects

### 4. Subscription Object Fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique subscription identifier (e.g., "SUB-001") |
| `planName` | string | Name of the subscription plan |
| `merchant` | string | Merchant/business name |
| `status` | 'active' \| 'paused' \| 'cancelled' | Current subscription status |
| `price` | number | Subscription price amount |
| `currency` | string | Currency code (e.g., "USDC") |
| `interval` | string | Billing interval (e.g., "month", "year") |
| `prepaidBalance` | number | Current prepaid balance amount |
| `coverage` | number | Number of payments covered by balance |
| `nextChargeDate` | string | Next charge date (formatted string) |
| `icon` | string (optional) | Emoji or icon identifier |

## Features Implemented

✅ Dark theme card design (#1a1a1a background)
✅ Plan icon, name, and merchant display
✅ Status badge with color coding (green=active, yellow=paused, red=cancelled)
✅ Price display with currency and interval
✅ Subscription ID display
✅ Prepaid balance in teal pill
✅ Coverage calculation (~X payments)
✅ Next charge date display
✅ Manage button linking to detail page
✅ External link icon for opening in new tab
✅ Responsive grid layout (2 columns → 1 column on mobile)
✅ Loading and empty states
✅ Hover effects and transitions
✅ Accessible with ARIA labels and semantic HTML

## Routing Setup

The cards link to `/subscriptions/:id` for the detail page. Ensure this route is configured:

```typescript
// In your router configuration
<Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
```

## Customization

### Status Colors
Modify in `SubscriptionCard.css`:
```css
.subscription-status-badge.active { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.subscription-status-badge.paused { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
.subscription-status-badge.cancelled { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
```

### Balance Pill Color
```css
.balance-pill { background: rgba(20, 184, 166, 0.15); color: #14b8a6; }
```

### Grid Layout
```css
.subscriptions-grid {
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}
```

## Error Handling

Add error state display in Subscriptions.tsx:

```typescript
{error && (
  <div className="subscriptions-error">
    <p>{error}</p>
    <button onClick={fetchSubscriptions}>Retry</button>
  </div>
)}
```
