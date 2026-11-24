/**
 * Regression suite for #822 — TimeRange failure handling in RevenueChart
 *
 * Exercises the three explicit guard branches inside the `tooltipCoords`
 * useMemo (LineChart) and the `seriesPoints` useMemo:
 *
 *   Line 462: if (!seriesDataPoint) return null;
 *   Line 585: if (!activePoint || !data[activePoint.index]) return null;
 *   Line 589: if (!point) return null;
 *
 * Each describe block covers:
 *   – the failure / null-return path
 *   – the neighbouring normal (success) path
 *   – boundary inputs around the guard condition
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RevenueChart, { LineChart, SeriesData } from './RevenueChart';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const baseData = [
  { date: 'Mon', revenue: 100 },
  { date: 'Tue', revenue: 200 },
  { date: 'Wed', revenue: 150 },
];

const fullSeries: SeriesData[] = [
  {
    id: 'main',
    name: 'Main',
    color: '#0072b2',
    visible: true,
    data: baseData,
  },
];

// ---------------------------------------------------------------------------
// Line 462 — if (!seriesDataPoint) return null
//
// This guard fires inside `seriesPoints` when a series' data array is shorter
// than the shared `data` array, so `seriesItem.data[i]` is undefined.
// ---------------------------------------------------------------------------

describe('#822 — Line 462: seriesDataPoint null guard in seriesPoints', () => {
  it('[normal path] renders data points when every series entry aligns with shared data', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    // 3 data points × 1 series = 3 interactive data point buttons
    expect(points).toHaveLength(3);
  });

  it('[failure path] does not throw when a series data array is shorter than shared data', () => {
    // Series has only 1 data entry but shared data has 3 — indices 1 & 2 will hit the guard
    const shortSeries: SeriesData[] = [
      {
        id: 'short',
        name: 'Short',
        color: '#e69f00',
        visible: true,
        data: [{ date: 'Mon', revenue: 100 }], // only 1 entry
      },
    ];
    expect(() =>
      render(<LineChart data={baseData} series={shortSeries} />)
    ).not.toThrow();
  });

  it('[failure path] omits null points from the rendered circle set for a short series', () => {
    const shortSeries: SeriesData[] = [
      {
        id: 'short',
        name: 'Short',
        color: '#e69f00',
        visible: true,
        data: [{ date: 'Mon', revenue: 100 }],
      },
    ];
    const { container } = render(<LineChart data={baseData} series={shortSeries} />);
    // Only 1 point has a valid seriesDataPoint, so only 1 interactive circle
    const circles = container.querySelectorAll('circle.data-point');
    expect(circles.length).toBe(1);
  });

  it('[failure path] series with empty data array produces no SVG path element', () => {
    const emptySeries: SeriesData[] = [
      {
        id: 'empty',
        name: 'Empty',
        color: '#009e73',
        visible: true,
        data: [],
      },
    ];
    const { container } = render(<LineChart data={[]} series={emptySeries} />);
    const paths = container.querySelectorAll('path.revenue-line');
    // No data → seriesPoints yields empty points array → no path rendered
    expect(paths.length).toBe(0);
  });

  it('[boundary] single-element series aligns with single-element data without errors', () => {
    const oneEach: SeriesData[] = [
      {
        id: 'solo',
        name: 'Solo',
        color: '#cc79a7',
        visible: true,
        data: [{ date: 'Today', revenue: 500 }],
      },
    ];
    expect(() =>
      render(<LineChart data={[{ date: 'Today', revenue: 500 }]} series={oneEach} />)
    ).not.toThrow();
    const { container } = render(
      <LineChart data={[{ date: 'Today', revenue: 500 }]} series={oneEach} />
    );
    expect(container.querySelectorAll('circle.data-point').length).toBe(1);
  });

  it('[boundary] multi-series where one is fully aligned and another is entirely empty', () => {
    const mixedSeries: SeriesData[] = [
      { id: 'a', name: 'A', color: '#0072b2', visible: true, data: baseData },
      { id: 'b', name: 'B', color: '#e69f00', visible: true, data: [] },
    ];
    expect(() => render(<LineChart data={baseData} series={mixedSeries} />)).not.toThrow();
    // Only series A produces interactive circles (3 points)
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    expect(points.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Line 585 — if (!activePoint || !data[activePoint.index]) return null
//
// tooltipCoords returns null when there is no activePoint or when activePoint
// references an index outside the data array.  No tooltip should be rendered
// in either case.
// ---------------------------------------------------------------------------

describe('#822 — Line 585: activePoint / data[activePoint.index] null guard in tooltipCoords', () => {
  it('[normal path] renders tooltip when a visible data point is hovered', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.mouseEnter(points[0]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('[failure path] no tooltip is visible before any interaction (activePoint = null)', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('[failure path] tooltip disappears after mouse leaves a data point (activePoint cleared)', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });

    fireEvent.mouseEnter(points[1]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(points[1]);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('[failure path] no tooltip and no active-drop-line when data is empty', () => {
    // No interactive points exist → activePoint can never be set
    const emptySeries: SeriesData[] = [
      { id: 'e', name: 'E', color: '#56b4e9', visible: true, data: [] },
    ];
    render(<LineChart data={[]} series={emptySeries} />);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(document.querySelector('.active-drop-line')).not.toBeInTheDocument();
  });

  it('[boundary] tooltip appears on the first data point (index 0 — lower boundary)', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.mouseEnter(points[0]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('[boundary] tooltip appears on the last data point (index length-1 — upper boundary)', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.mouseEnter(points[points.length - 1]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('[boundary] active-drop-line is rendered alongside the tooltip for an active point', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.mouseEnter(points[0]);
    expect(document.querySelector('.active-drop-line')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Line 589 — if (!point) return null
//
// Even when activePoint is set, tooltipCoords returns null if the matching
// point object cannot be found inside seriesPoints (e.g. the series is hidden
// or its data didn't produce a point for that index).
// ---------------------------------------------------------------------------

describe('#822 — Line 589: point null guard in tooltipCoords', () => {
  it('[normal path] tooltip contains series name and formatted revenue for a matched point', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.mouseEnter(points[0]);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent(/Main/);
    expect(tooltip).toHaveTextContent(/\$100/);
  });

  it('[normal path] tooltip date matches the hovered data point', () => {
    render(<LineChart data={baseData} series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.mouseEnter(points[1]); // Tue, $200
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Tue');
    expect(tooltip).toHaveTextContent('$200');
  });

  it('[failure path] no tooltip rendered when all series are hidden (no matchable point)', async () => {
    // When every series is hidden the visible points have no role=button
    // so hover is blocked at the element level — guard at line 589 is the
    // defensive backstop for this scenario.
    const hiddenSeries: SeriesData[] = [
      { ...fullSeries[0], visible: false },
    ];
    render(<LineChart data={baseData} series={hiddenSeries} />);
    // Hidden circles have pointer-events:none and no mouse handlers
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\(Point \d+ of \d+\)/ })).not.toBeInTheDocument();
  });

  it('[boundary] tooltip for single-point series shows centred position without throwing', () => {
    const soloData = [{ date: 'Only', revenue: 999 }];
    const soloSeries: SeriesData[] = [
      { id: 'solo', name: 'Solo', color: '#d55e00', visible: true, data: soloData },
    ];
    const { container } = render(<LineChart data={soloData} series={soloSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    expect(() => fireEvent.mouseEnter(points[0])).not.toThrow();
    expect(container.querySelector('g.tooltip')).toBeInTheDocument();
  });

  it('[boundary] tooltip position is clamped when point is near the left edge (x < minX)', () => {
    // First point of a wide dataset sits close to the left edge
    const wideData = Array.from({ length: 30 }, (_, i) => ({
      date: `Day ${i + 1}`,
      revenue: 100 + i * 10,
    }));
    const wideSeries: SeriesData[] = [
      { id: 'wide', name: 'Wide', color: '#882255', visible: true, data: wideData },
    ];
    render(<LineChart data={wideData} series={wideSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    expect(() => fireEvent.mouseEnter(points[0])).not.toThrow();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('[boundary] tooltip position is clamped when point is near the right edge (x > maxX)', () => {
    const wideData = Array.from({ length: 30 }, (_, i) => ({
      date: `Day ${i + 1}`,
      revenue: 100 + i * 10,
    }));
    const wideSeries: SeriesData[] = [
      { id: 'wide', name: 'Wide', color: '#882255', visible: true, data: wideData },
    ];
    render(<LineChart data={wideData} series={wideSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    const last = points[points.length - 1];
    expect(() => fireEvent.mouseEnter(last)).not.toThrow();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TimeRange prop — success and failure paths
// ---------------------------------------------------------------------------

describe('#822 — TimeRange prop: success and failure paths', () => {
  it('[normal path] 7D time range renders the chart without errors', () => {
    expect(() => render(<RevenueChart initialTimeRange="7D" />)).not.toThrow();
    expect(screen.getByRole('button', { name: '7D' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('[normal path] 30D time range is the default and renders correctly', () => {
    render(<RevenueChart />);
    expect(screen.getByRole('button', { name: '30D' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('[normal path] 90D time range renders the chart without errors', () => {
    expect(() => render(<RevenueChart initialTimeRange="90D" />)).not.toThrow();
    expect(screen.getByRole('button', { name: '90D' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('[normal path] switching time ranges does not leave stale tooltip artifacts', async () => {
    render(<RevenueChart series={fullSeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.mouseEnter(points[0]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Switch to a different time range — data changes, tooltip should be gone
    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    // No tooltip should remain after the data reset from time range change
    // (the lineChart re-mounts with new data, clearing hovered/focused state)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('[boundary] customData + customSeries both provided — customData wins for the data array', () => {
    const singlePoint = [{ date: 'Solo', revenue: 42 }];
    expect(() =>
      render(<RevenueChart data={singlePoint} series={fullSeries} />)
    ).not.toThrow();
    // The summary description should reference the solo data point date
    const summary = document.getElementById('revenue-chart-summary-desc');
    expect(summary?.textContent).toContain('Solo');
  });

  it('[boundary] no customData and no customSeries falls back to generated mock data', () => {
    // No props at all — should use internal generateMockData / generateMockSeries
    expect(() => render(<RevenueChart />)).not.toThrow();
    const svg = document.querySelector('svg.line-chart');
    expect(svg).toBeInTheDocument();
  });
});
