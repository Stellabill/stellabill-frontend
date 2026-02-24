# Revenue Chart API Integration Guide

## Current Implementation
The RevenueChart component currently uses mock data generated client-side. To integrate with your backend API:

## API Integration Steps

### 1. Update the component to fetch real data:

```typescript
// Add to RevenueChart.tsx
import { useEffect } from 'react';
import { apiClient } from '../api/client';

// Replace generateMockData with API call
useEffect(() => {
  async function fetchRevenueData() {
    try {
      const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
      const response = await apiClient.get(`/api/revenue?days=${days}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      // Fallback to mock data
      setData(generateMockData(days));
    }
  }
  
  fetchRevenueData();
}, [timeRange]);
```

### 2. Expected API Response Format:

```json
{
  "data": [
    {
      "date": "Jan 1",
      "revenue": 450
    },
    {
      "date": "Jan 2",
      "revenue": 520
    }
  ]
}
```

### 3. API Endpoint Specification:

- **Endpoint**: `GET /api/revenue`
- **Query Parameters**:
  - `days` (required): Number of days (7, 30, or 90)
- **Response**: Array of objects with `date` (string) and `revenue` (number)

## Features Implemented

✅ Dark theme with #1a1a1a background
✅ Time range selector (7D/30D/90D) with light blue active state
✅ SVG-based line chart with light blue (#60a5fa) line and markers
✅ Hover tooltips showing exact revenue values
✅ Responsive design with horizontal scroll on small screens
✅ Accessible with ARIA labels and keyboard navigation
✅ Grid lines for better readability
✅ Y-axis with revenue values, X-axis with dates
✅ Smooth transitions and hover effects

## Customization

To adjust colors, modify `RevenueChart.css`:
- Line color: `.revenue-line { stroke: #60a5fa; }`
- Background: `.revenue-chart-container { background: #1a1a1a; }`
- Active button: `.time-range-btn.active { background: #60a5fa; }`
