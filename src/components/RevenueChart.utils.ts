
import type { DataPoint, SeriesData } from './RevenueChart';

export interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ChartPoint extends DataPoint {
  x: number;
  y: number;
  seriesId: string;
  pointIndex: number;
}

export const DEFAULT_CHART_DIMENSIONS: ChartDimensions = {
  width: 800,
  height: 300,
  padding: { top: 30, right: 30, bottom: 40, left: 60 }
};

export function getChartScale(series: SeriesData[]) {
  const allValues = series.flatMap(item =>
    item.data.map(point => point.revenue)
  );

  const maxRevenue = allValues.length ? Math.max(...allValues) : 100;
  const yMax = Math.max(400, Math.ceil(maxRevenue / 400) * 400);
  const yTicks = 5;

  return {
    maxRevenue,
    yMax,
    yTicks,
    yStep: yMax / (yTicks - 1)
  };
}

export function getSeriesPoints(
  data: DataPoint[],
  series: SeriesData[],
  dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS,
  yMax = getChartScale(series).yMax
) {
  const { width, height, padding } = dimensions;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return series.map(seriesItem => ({
    ...seriesItem,
    points: data.flatMap((_, index) => {
      const point = seriesItem.data[index];
      if (!point) return [];

      const x = data.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (data.length - 1)) * chartWidth;

      const y = padding.top + chartHeight -
        (point.revenue / yMax) * chartHeight;

      const chartPoint: ChartPoint = {
        ...point,
        x,
        y,
        seriesId: seriesItem.id,
        pointIndex: index
      };

      return [chartPoint];
    })
  }));
}

export function getXLabelIndices(dataLength: number): number[] {
  if (dataLength <= 7) {
    return Array.from({ length: dataLength }, (_, index) => index);
  }

  const interval = dataLength <= 30 ? 3 : 10;

  return Array.from({ length: dataLength }, (_, index) => index)
    .filter(index => index % interval === 0 || index === dataLength - 1);
}
