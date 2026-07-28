# RevenueSplitByPlanPanel — API notes

## Endpoint (proposed)

`GET /api/merchant/revenue-by-plan`

### Query

| Param | Type | Description |
| --- | --- | --- |
| `period` | `string` | e.g. `month`, `week`, `custom` |
| `from` / `to` | ISO date | Optional custom range |
| `compare` | `previous` | Include previous-period totals (default) |

### Response

```json
{
  "currency": "USDC",
  "periodLabel": "this month",
  "previousPeriodLabel": "vs last month",
  "plans": [
    {
      "planId": "plan_pro",
      "planName": "Pro",
      "revenue": 19200,
      "previousRevenue": 17600
    }
  ]
}
```

Map `plans` directly to `<RevenueSplitByPlanPanel plans={…} />`.

## Client wiring sketch

```tsx
const { data } = await apiClient.get('/api/merchant/revenue-by-plan?period=month');
<RevenueSplitByPlanPanel
  plans={data.plans}
  periodLabel={data.periodLabel}
  previousPeriodLabel={data.previousPeriodLabel}
/>
```

Until the endpoint ships, Dashboard and MerchantDashboard use local mock slices.
