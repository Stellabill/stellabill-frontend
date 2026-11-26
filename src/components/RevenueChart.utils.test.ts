
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CHART_DIMENSIONS,
  getChartScale,
  getSeriesPoints,
  getXLabelIndices
} from './RevenueChart.utils';
import type { DataPoint, SeriesData } from './RevenueChart';

const sampleData: DataPoint[] = [
  { date: 'Jan 1', revenue: 200 },
  { date: 'Jan 2', revenue: 400 }
];

const sampleSeries: SeriesData[] = [
  {
    id: 'revenue',
    name: 'Revenue',
    color: '#000',
    visible: true,
    data: sampleData
  }
];

describe('getChartScale', () => {
  it('calculates the chart scale from all series', () => {
    const result = getChartScale([
      ...sampleSeries,
      {
        id: 'subscriptions',
        name: 'Subscriptions',
        color: '#111',
        visible: false,
        data: [{ date: 'Jan 1', revenue: 1200 }]
      }
    ]);

    expect(result).toEqual({
      maxRevenue: 1200,
      yMax: 1200,
      yTicks: 5,
      yStep: 300
    });
  });

  it('uses the default scale when there is no data', () => {
    expect(getChartScale([])).toEqual({
      maxRevenue: 100,
      yMax: 400,
      yTicks: 5,
      yStep: 100
    });
  });
});

describe('getSeriesPoints', () => {
  it('calculates coordinates for each data point', () => {
    const result = getSeriesPoints(
      sampleData,
      sampleSeries,
      DEFAULT_CHART_DIMENSIONS,
      400
    );

    expect(result[0].points).toHaveLength(2);
    expect(result[0].points[0]).toMatchObject({
      date: 'Jan 1',
      revenue: 200,
      x: 60,
      y: 145,
      seriesId: 'revenue',
      pointIndex: 0
    });
    expect(result[0].points[1].x).toBe(770);
  });

  it('centres a single data point horizontally', () => {
    const singlePoint = [{ date: 'Jan 1', revenue: 200 }];
    const result = getSeriesPoints(
      singlePoint,
      [{ ...sampleSeries[0], data: singlePoint }],
      DEFAULT_CHART_DIMENSIONS,
      400
    );

    expect(result[0].points[0].x).toBe(415);
  });

  it('omits points that do not exist in a series', () => {
    const shorterSeries: SeriesData[] = [
      {
        ...sampleSeries[0],
        data: [sampleData[0]]
      }
    ];

    const result = getSeriesPoints(sampleData, shorterSeries);

    expect(result[0].points).toHaveLength(1);
  });
});

describe('getXLabelIndices', () => {
  it('returns every index when there are seven or fewer points', () => {
    expect(getXLabelIndices(4)).toEqual([0, 1, 2, 3]);
  });

  it('returns every third index for datasets up to 30 points', () => {
    expect(getXLabelIndices(10)).toEqual([0, 3, 6, 9]);
  });

  it('returns every tenth index for datasets above 30 points', () => {
    expect(getXLabelIndices(31)).toEqual([0, 10, 20, 30]);
  });

  it('returns an empty array for an empty dataset', () => {
    expect(getXLabelIndices(0)).toEqual([]);
  });
});

