import { seriesVar } from '@/tokens/chartPalette';
import type { DataPoint, SeriesData } from './RevenueChart';

export function generateMockData(days: number): DataPoint[] {
  const data: DataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const baseRevenue = 400 + (days - i) * (800 / days);
    const variance = Math.random() * 200 - 100;
    const revenue = Math.max(0, baseRevenue + variance);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(revenue)
    });
  }

  return data;
}

export function generateMockSeries(days: number): SeriesData[] {
  const baseData = generateMockData(days);

  return [
    {
      id: 'revenue',
      name: 'Total Revenue',
      color: seriesVar(0),
      visible: true,
      data: baseData
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions',
      color: seriesVar(1),
      visible: true,
      data: baseData.map(d => ({
        ...d,
        revenue: Math.round(d.revenue * 0.7 + Math.random() * 100 - 50)
      }))
    },
    {
      id: 'oneTime',
      name: 'One-time Payments',
      color: seriesVar(2),
      visible: true,
      data: baseData.map(d => ({
        ...d,
        revenue: Math.round(d.revenue * 0.3 + Math.random() * 150 - 75)
      }))
    }
  ];
}
