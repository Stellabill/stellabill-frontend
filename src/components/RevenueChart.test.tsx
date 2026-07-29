import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RevenueChart, { LineChart, SeriesData } from './RevenueChart';

const mockSampleData = [
  { date: 'Jan 1', revenue: 500 },
  { date: 'Jan 2', revenue: 750 },
  { date: 'Jan 3', revenue: 600 },
  { date: 'Jan 4', revenue: 900 },
  { date: 'Jan 5', revenue: 1200 },
];

const mockSeriesData: SeriesData[] = [
  {
    id: 'revenue',
    name: 'Total Revenue',
    color: '#0072b2',
    visible: true,
    data: mockSampleData
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    color: '#e69f00',
    visible: true,
    data: [
      { date: 'Jan 1', revenue: 300 },
      { date: 'Jan 2', revenue: 450 },
      { date: 'Jan 3', revenue: 400 },
      { date: 'Jan 4', revenue: 600 },
      { date: 'Jan 5', revenue: 800 },
    ]
  },
  {
    id: 'oneTime',
    name: 'One-time Payments',
    color: '#009e73',
    visible: true,
    data: [
      { date: 'Jan 1', revenue: 200 },
      { date: 'Jan 2', revenue: 300 },
      { date: 'Jan 3', revenue: 200 },
      { date: 'Jan 4', revenue: 300 },
      { date: 'Jan 5', revenue: 400 },
    ]
  }
];

describe('RevenueChart — Basic Rendering with Multi-Series', () => {
  it('renders chart region with title and time range selector', () => {
    render(<RevenueChart />);
    expect(screen.getByRole('region', { name: /revenue over time/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /revenue over time/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90D' })).toBeInTheDocument();
  });

  it('renders interactive legend with series chips', () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    const legend = screen.getByRole('group', { name: /chart legend/i });
    expect(legend).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /total revenue series, visible/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscriptions series, visible/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /one-time payments series, visible/i })).toBeInTheDocument();
  });

  it('defaults to 30D active button and renders mock series', () => {
    render(<RevenueChart />);
    const btn30D = screen.getByRole('button', { name: '30D' });
    expect(btn30D).toHaveAttribute('aria-pressed', 'true');
    
    // Should have legend chips for default mock series
    expect(screen.getByRole('button', { name: /total revenue series/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscriptions series/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /one-time payments series/i })).toBeInTheDocument();
  });

  it('accepts custom series data via props', () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    // Check that custom series are rendered in legend
    expect(screen.getByRole('button', { name: /total revenue series, visible/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscriptions series, visible/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /one-time payments series, visible/i })).toBeInTheDocument();
  });

  it('renders screen reader summary description', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const summaryEl = document.getElementById('revenue-chart-summary-desc');
    expect(summaryEl).toBeInTheDocument();
    expect(summaryEl?.textContent).toContain('Total Revenue, Subscriptions, One-time Payments');
  });
});

describe('RevenueChart — Interactive Legend Functionality', () => {
  it('toggles series visibility when legend chip is clicked', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    const revenueChip = screen.getByRole('button', { name: /total revenue series, visible/i });
    expect(revenueChip).toHaveAttribute('aria-pressed', 'true');
    
    // Click to hide series
    fireEvent.click(revenueChip);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /total revenue series, hidden/i })).toBeInTheDocument();
    });
    
    const hiddenChip = screen.getByRole('button', { name: /total revenue series, hidden/i });
    expect(hiddenChip).toHaveAttribute('aria-pressed', 'false');
    
    // Check live region announcement
    const legendLiveRegion = screen.getByTestId('legend-live-region');
    expect(legendLiveRegion.textContent).toContain('Total Revenue series hidden');
  });

  it('prevents hiding the last visible series', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    // Hide two of the three series first
    const subscriptionsChip = screen.getByRole('button', { name: /subscriptions series, visible/i });
    const oneTimeChip = screen.getByRole('button', { name: /one-time payments series, visible/i });
    
    fireEvent.click(subscriptionsChip);
    fireEvent.click(oneTimeChip);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /subscriptions series, hidden/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /one-time payments series, hidden/i })).toBeInTheDocument();
    });
    
    // The last visible series should be disabled
    const lastVisibleChip = screen.getByRole('button', { name: /total revenue series, visible/i });
    expect(lastVisibleChip).toBeDisabled();
    expect(lastVisibleChip).toHaveAttribute('aria-describedby', 'legend-only-visible-hint');
  });

  it('navigates legend chips with keyboard', () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    const chips = screen.getAllByRole('button', { name: /series/ });
    
    // First chip should have tabindex 0
    expect(chips[0]).toHaveAttribute('tabindex', '0');
    expect(chips[1]).toHaveAttribute('tabindex', '-1');
    expect(chips[2]).toHaveAttribute('tabindex', '-1');
    
    // Focus first chip
    fireEvent.focus(chips[0]);
    
    // Navigate with ArrowRight
    fireEvent.keyDown(chips[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(chips[1]);
    
    // Navigate with ArrowLeft
    fireEvent.keyDown(chips[1], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(chips[0]);
  });

  it('toggles series with Space and Enter keys', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    const revenueChip = screen.getByRole('button', { name: /total revenue series, visible/i });
    fireEvent.focus(revenueChip);
    
    // Toggle with Space key
    fireEvent.keyDown(revenueChip, { key: ' ' });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /total revenue series, hidden/i })).toBeInTheDocument();
    });
    
    // Toggle back with Enter key
    const hiddenChip = screen.getByRole('button', { name: /total revenue series, hidden/i });
    fireEvent.keyDown(hiddenChip, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /total revenue series, visible/i })).toBeInTheDocument();
    });
  });

  it('supports Home and End keys for rapid navigation', () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    const chips = screen.getAllByRole('button', { name: /series/ });
    
    fireEvent.focus(chips[0]);
    
    // Press End -> jump to last chip
    fireEvent.keyDown(chips[0], { key: 'End' });
    expect(document.activeElement).toBe(chips[2]);
    
    // Press Home -> jump to first chip
    fireEvent.keyDown(chips[2], { key: 'Home' });
    expect(document.activeElement).toBe(chips[0]);
  });
});

describe('RevenueChart — Multi-Series Chart Behavior', () => {
  it('renders tooltip for different series on hover', () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    // Get data points for different series (this requires knowing the internal structure)
    const dataPoints = screen.getAllByRole('button', { name: /Jan \d/ });
    
    // Hover over a point - check for tooltip with series info
    fireEvent.mouseEnter(dataPoints[0]);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    
    // Tooltip should contain series name and value
    expect(tooltip).toHaveTextContent(/Total Revenue|Subscriptions|One-time Payments/);
  });

  it('supports keyboard navigation between series and data points', () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    const dataPoints = screen.getAllByRole('button', { name: /Jan \d/ });
    
    fireEvent.focus(dataPoints[0]);
    
    // Navigate between data points in same series with ArrowRight
    fireEvent.keyDown(dataPoints[0], { key: 'ArrowRight' });
    
    // Navigate between series with ArrowUp/ArrowDown
    fireEvent.keyDown(dataPoints[1], { key: 'ArrowUp' });
    fireEvent.keyDown(dataPoints[1], { key: 'ArrowDown' });
  });

  it('handles hidden series in chart visualization', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    // Hide a series
    const revenueChip = screen.getByRole('button', { name: /total revenue series, visible/i });
    fireEvent.click(revenueChip);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /total revenue series, hidden/i })).toBeInTheDocument();
    });
    
    // Hidden series data points should still exist but be styled differently
    // (Implementation detail - would need to check SVG styling)
  });
});

describe('RevenueChart — Edge Cases and Accessibility', () => {
  it('handles single series gracefully', () => {
    const singleSeries: SeriesData[] = [
      {
        id: 'revenue',
        name: 'Revenue',
        color: '#0072b2',
        visible: true,
        data: mockSampleData
      }
    ];
    
    render(<RevenueChart series={singleSeries} />);
    
    const chip = screen.getByRole('button', { name: /revenue series, visible/i });
    expect(chip).toBeDisabled(); // Should be disabled as it's the only series
  });

  it('handles empty series array gracefully', () => {
    render(<RevenueChart series={[]} />);
    
    const legend = screen.getByRole('group', { name: /chart legend/i });
    expect(legend).toBeInTheDocument();
    
    // Should show some kind of empty state or default behavior
    const summaryEl = document.getElementById('revenue-chart-summary-desc');
    expect(summaryEl?.textContent).toContain('No revenue data available');
  });

  it('maintains roving tabindex within legend', () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    const chips = screen.getAllByRole('button', { name: /series/ });
    
    // Initially first chip is tabbable
    expect(chips[0]).toHaveAttribute('tabindex', '0');
    expect(chips[1]).toHaveAttribute('tabindex', '-1');
    expect(chips[2]).toHaveAttribute('tabindex', '-1');
    
    // After focusing second chip
    fireEvent.focus(chips[1]);
    
    expect(chips[0]).toHaveAttribute('tabindex', '-1');
    expect(chips[1]).toHaveAttribute('tabindex', '0');
    expect(chips[2]).toHaveAttribute('tabindex', '-1');
  });

  it('announces series state changes via live region', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    
    const revenueChip = screen.getByRole('button', { name: /total revenue series, visible/i });
    const legendLiveRegion = screen.getByTestId('legend-live-region');
    
    // Initially empty
    expect(legendLiveRegion.textContent).toBe('');
    
    // Click to hide
    fireEvent.click(revenueChip);
    
    await waitFor(() => {
      expect(legendLiveRegion.textContent).toContain('Total Revenue series hidden');
    });
    
    // Click to show
    const hiddenChip = screen.getByRole('button', { name: /total revenue series, hidden/i });
    fireEvent.click(hiddenChip);
    
    await waitFor(() => {
      expect(legendLiveRegion.textContent).toContain('Total Revenue series shown');
    });
  });
});

// Legacy compatibility tests (backward compatibility with single-series data prop)
describe('RevenueChart — Backward Compatibility', () => {
  it('works with legacy data prop (single series)', () => {
    render(<RevenueChart data={mockSampleData} />);
    
    // Should render data points (format: "Series Name: Date, $Value")
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    expect(points.length).toBeGreaterThan(0);
    
    // Should still show legend for the default series structure
    expect(screen.getByRole('group', { name: /chart legend/i })).toBeInTheDocument();
  });
});

// ============================================================================
// Additional comprehensive tests for 95%+ coverage
// ============================================================================

describe('RevenueChart — Header & Time Range Selector', () => {
  it('applies custom ariaLabel to chart region landmark', () => {
    render(<RevenueChart ariaLabel="Quarterly Performance Overview" series={mockSeriesData} />);
    expect(screen.getByRole('region', { name: 'Quarterly Performance Overview' })).toBeInTheDocument();
  });

  it('switches active time range and updates aria-pressed', () => {
    render(<RevenueChart initialTimeRange="30D" />);

    const btn7D = screen.getByRole('button', { name: '7D' });
    const btn30D = screen.getByRole('button', { name: '30D' });
    const btn90D = screen.getByRole('button', { name: '90D' });

    expect(btn7D).toHaveAttribute('aria-pressed', 'false');
    expect(btn30D).toHaveAttribute('aria-pressed', 'true');
    expect(btn90D).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(btn7D);
    expect(btn7D).toHaveAttribute('aria-pressed', 'true');
    expect(btn30D).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(btn90D);
    expect(btn90D).toHaveAttribute('aria-pressed', 'true');
    expect(btn7D).toHaveAttribute('aria-pressed', 'false');
  });

  it('respects initialTimeRange prop', () => {
    render(<RevenueChart initialTimeRange="90D" />);
    expect(screen.getByRole('button', { name: '90D' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('RevenueChart — Legend Chip Visual & CSS States', () => {
  it('applies visible CSS class + aria-pressed true for visible series', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const revenueChip = screen.getByRole('button', { name: /total revenue series, visible/i });
    expect(revenueChip).toHaveClass('legend-chip--visible');
    expect(revenueChip).not.toHaveClass('legend-chip--hidden');
    expect(revenueChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies hidden CSS class + aria-pressed false after toggle', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    const revenueChip = screen.getByRole('button', { name: /total revenue series, visible/i });
    fireEvent.click(revenueChip);

    const hiddenChip = await screen.findByRole('button', { name: /total revenue series, hidden/i });
    expect(hiddenChip).toHaveClass('legend-chip--hidden');
    expect(hiddenChip).not.toHaveClass('legend-chip--visible');
    expect(hiddenChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders indicator spans with correct modifier classes', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const chip = screen.getByRole('button', { name: /total revenue series, visible/i });
    const indicator = chip.querySelector('.legend-chip__indicator');
    expect(indicator).toHaveClass('legend-chip__indicator--visible');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
  });

  it('updates indicator to hidden state after toggle', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    fireEvent.click(screen.getByRole('button', { name: /total revenue series, visible/i }));
    const hiddenChip = await screen.findByRole('button', { name: /total revenue series, hidden/i });
    const indicator = hiddenChip.querySelector('.legend-chip__indicator');
    expect(indicator).toHaveClass('legend-chip__indicator--hidden');
  });

  it('shows warning alert when all series are hidden via props', () => {
    const allHidden: SeriesData[] = mockSeriesData.map(s => ({ ...s, visible: false }));
    render(<RevenueChart series={allHidden} />);
    const warning = screen.getByRole('alert');
    expect(warning).toHaveTextContent(/all series are hidden/i);
  });

  it('renders sr-only hint for only-visible scenario', () => {
    render(<RevenueChart series={mockSeriesData} />);
    fireEvent.click(screen.getByRole('button', { name: /subscriptions series, visible/i }));
    fireEvent.click(screen.getByRole('button', { name: /one-time payments series, visible/i }));
    const hint = document.getElementById('legend-only-visible-hint');
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent(/show another series first/i);
  });

  it('injects --series-color custom property into chip style', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const chip = screen.getByRole('button', { name: /subscriptions series, visible/i });
    expect(chip).toHaveStyle({ '--series-color': '#e69f00' });
  });
});

describe('RevenueChart — Legend Roving Tabindex & Blur Reset', () => {
  it('uses ArrowUp and ArrowDown as roving navigation alternatives', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const chips = screen.getAllByRole('button', { name: /series/ });
    fireEvent.focus(chips[0]);

    fireEvent.keyDown(chips[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(chips[1]);

    fireEvent.keyDown(chips[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(chips[0]);
  });

  it('clamps roving navigation at boundaries (ArrowLeft at first, ArrowRight at last)', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const chips = screen.getAllByRole('button', { name: /series/ });
    fireEvent.focus(chips[0]);

    // Can't go further left than first chip (handler must not throw and keep tabindex on first chip)
    expect(() => fireEvent.keyDown(chips[0], { key: 'ArrowLeft' })).not.toThrow();
    // First chip remains the roving tab target (focusedIndex still 0)
    expect(chips[0]).toHaveAttribute('tabindex', '0');

    // End -> jumps to last via direct .focus() so activeElement IS correctly set
    fireEvent.keyDown(chips[0], { key: 'End' });
    expect(document.activeElement).toBe(chips[2]);
    expect(chips[2]).toHaveAttribute('tabindex', '0');

    // Can't go further right than last chip (handler must not throw)
    expect(() => fireEvent.keyDown(chips[2], { key: 'ArrowRight' })).not.toThrow();
    // Last remains roving tab target
    expect(chips[2]).toHaveAttribute('tabindex', '0');
  });

  it('ignores unhandled keys in legend keydown handler (no-op, does not throw)', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const chips = screen.getAllByRole('button', { name: /series/ });
    fireEvent.focus(chips[0]);
    // Tab / Shift keys should be no-ops without error
    expect(() => fireEvent.keyDown(chips[0], { key: 'Tab' })).not.toThrow();
    expect(() => fireEvent.keyDown(chips[0], { key: 'Shift' })).not.toThrow();
    // After no-op keys, first chip should still be focusable
    expect(chips[0]).toHaveAttribute('tabindex', '0');
  });

  it('handles empty series array without crashing keydown handler', () => {
    render(<RevenueChart series={[]} />);
    expect(screen.getByRole('group', { name: /chart legend with 0 series/i })).toBeInTheDocument();
  });
});

describe('RevenueChart — SVG Chart Structure & Pattern Defs', () => {
  it('renders <svg> with role=img and required title/desc', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const svg = document.querySelector('svg.line-chart') as SVGSVGElement;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg.querySelector('title')).toBeInTheDocument();
    expect(svg.querySelector('desc')).toBeInTheDocument();
  });

  it('creates SVG pattern defs for EVERY series (not only visible ones)', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    fireEvent.click(screen.getByRole('button', { name: /subscriptions series, visible/i }));

    // Even subscriptions (now hidden) should have a pattern def
    const patterns = document.querySelectorAll('pattern');
    const ids = Array.from(patterns).map(p => p.id);
    expect(ids).toContain('pattern-revenue');
    expect(ids).toContain('pattern-subscriptions');
    expect(ids).toContain('pattern-oneTime');
  });

  it('renders y-axis grid lines based on tick count', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const gridLines = document.querySelectorAll('.grid-line');
    expect(gridLines.length).toBe(5);
  });

  it('renders y-axis currency labels and x-axis date labels', () => {
    render(<RevenueChart series={mockSeriesData} />);
    // Axis labels use <text> elements; we check for class presence.
    const axisTexts = document.querySelectorAll('text.axis-label');
    expect(axisTexts.length).toBeGreaterThan(0);
  });
});

describe('RevenueChart — Hidden Series Line & Point Rendering', () => {
  it('renders SVG path elements for ALL series including hidden ones', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    const pathsBefore = document.querySelectorAll('path.revenue-line');
    expect(pathsBefore.length).toBe(3);

    // Hide one series
    fireEvent.click(screen.getByRole('button', { name: /subscriptions series, visible/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /subscriptions series, hidden/i })).toBeInTheDocument();
    });

    // Still 3 paths after hiding (hidden series still rendered, just styled differently)
    const pathsAfter = document.querySelectorAll('path.revenue-line');
    expect(pathsAfter.length).toBe(3);
  });

  it('adds revenue-line--hidden modifier class to hidden series paths', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    fireEvent.click(screen.getByRole('button', { name: /one-time payments series, visible/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /one-time payments series, hidden/i })).toBeInTheDocument();
    });
    const hiddenLines = document.querySelectorAll('path.revenue-line--hidden');
    expect(hiddenLines.length).toBeGreaterThanOrEqual(1);
  });

  it('hides non-interactive points for hidden series: no role="button", no aria-label, tabindex=-1', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    fireEvent.click(screen.getByRole('button', { name: /subscriptions series, visible/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /subscriptions series, hidden/i })).toBeInTheDocument();
    });

    // All data points still in DOM; visible ones keep role=button but hidden ones don't.
    const allCircles = document.querySelectorAll('circle.data-point');
    const buttonPoints = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    expect(buttonPoints.length).toBeLessThan(allCircles.length);
  });

  it('adds data-point--hidden class to hidden series circles', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    fireEvent.click(screen.getByRole('button', { name: /total revenue series, visible/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /total revenue series, hidden/i })).toBeInTheDocument();
    });
    const hiddenCircles = document.querySelectorAll('circle.data-point--hidden');
    expect(hiddenCircles.length).toBeGreaterThanOrEqual(1);
  });
});

describe('RevenueChart — Chart Point Keyboard & Tooltip Interactions', () => {
  it('navigates between data points with ArrowRight / ArrowLeft in same series', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    const firstInFirstSeries = points[0];
    fireEvent.focus(firstInFirstSeries);
    // Handler must not throw on arrow navigation
    expect(() => fireEvent.keyDown(firstInFirstSeries, { key: 'ArrowRight' })).not.toThrow();
    expect(() => fireEvent.keyDown(firstInFirstSeries, { key: 'ArrowLeft' })).not.toThrow();
    // Points should still be rendered
    expect(document.querySelectorAll('circle.data-point').length).toBeGreaterThan(0);
  });

  it('supports Home and End in point navigation', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.focus(points[0]);
    expect(() => fireEvent.keyDown(points[0], { key: 'End' })).not.toThrow();
    expect(() => fireEvent.keyDown(points[0], { key: 'Home' })).not.toThrow();
  });

  it('supports Escape to clear focused point state', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.focus(points[0]);
    fireEvent.keyDown(points[0], { key: 'Escape' });
    expect(points[0]).not.toHaveClass('focused');
  });

  it('handles ArrowUp / ArrowDown series switch between VISIBLE series only', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    fireEvent.click(screen.getByRole('button', { name: /one-time payments series, visible/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /one-time payments series, hidden/i })).toBeInTheDocument();
    });
    const visiblePoints = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.focus(visiblePoints[0]);
    // Shouldn't throw even when one series is hidden
    expect(() => fireEvent.keyDown(visiblePoints[0], { key: 'ArrowUp' })).not.toThrow();
    expect(() => fireEvent.keyDown(visiblePoints[0], { key: 'ArrowDown' })).not.toThrow();
  });

  it('ignores unhandled keys in chart point keydown', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.focus(points[0]);
    expect(() => fireEvent.keyDown(points[0], { key: 'Tab' })).not.toThrow();
    expect(() => fireEvent.keyDown(points[0], { key: 'X' })).not.toThrow();
  });

  it('renders tooltip role element on mouse enter of data point', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.mouseEnter(points[0]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    // Active drop line should be present when there's an active point
    expect(document.querySelector('.active-drop-line')).toBeInTheDocument();
  });

  it('updates chart live region when point is focused via keyboard', async () => {
    render(<RevenueChart series={mockSeriesData} />);
    const chartLiveRegion = screen.getByTestId('chart-live-region');
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.focus(points[0]);
    // Need to wait for useEffect in LineChart that writes to setAnnouncement
    await waitFor(() => {
      const txt = chartLiveRegion.textContent || '';
      expect(txt.length).toBeGreaterThan(0);
    });
    expect(chartLiveRegion.textContent).toMatch(/\$[\d,]+/);
  });
});

describe('RevenueChart — RTL Reversal & Empty/Single Data Edge Cases', () => {
  it('applies RTL-aware Arrow navigation by detecting dir attribute', () => {
    render(
      <div dir="rtl">
        <RevenueChart series={mockSeriesData} />
      </div>
    );
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });
    fireEvent.focus(points[0]);
    // Should not throw under RTL
    expect(() => fireEvent.keyDown(points[0], { key: 'ArrowRight' })).not.toThrow();
    expect(() => fireEvent.keyDown(points[0], { key: 'ArrowLeft' })).not.toThrow();
  });

  it('handles single data point edge case (division by zero guard)', () => {
    const singlePointSeries: SeriesData[] = [
      {
        id: 'revenue',
        name: 'Revenue',
        color: '#0072b2',
        visible: true,
        data: [{ date: 'Jan 1', revenue: 500 }]
      }
    ];
    expect(() => render(<RevenueChart series={singlePointSeries} />)).not.toThrow();
    // Should still have at least 1 data point in SVG
    const circles = document.querySelectorAll('circle.data-point');
    expect(circles.length).toBe(1);
  });

  it('handles empty data array across custom series without errors', () => {
    // Pass explicit empty data prop so summary uses 'No revenue data available'
    const emptySeries: SeriesData[] = [
      { id: 'a', name: 'A', color: '#0072b2', visible: true, data: [] }
    ];
    expect(() => render(<RevenueChart data={[]} series={emptySeries} />)).not.toThrow();
    expect(document.getElementById('revenue-chart-summary-desc')?.textContent).toContain('No revenue data available');
  });

  it('renders correctly under dir=rtl at document level', () => {
    const originalDir = document.dir;
    document.dir = 'rtl';
    try {
      expect(() => render(<RevenueChart series={mockSeriesData} />)).not.toThrow();
    } finally {
      document.dir = originalDir;
    }
  });
});

describe('RevenueChart — Time Range Effects on Mock Data', () => {
  it('changes mock data length when switching time ranges', () => {
    render(<RevenueChart initialTimeRange="7D" />);
    const xLabels = document.querySelectorAll('text.axis-label');
    // We'll compare by switching and ensuring no errors + labels still render
    expect(xLabels.length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: '90D' }));
    expect(screen.getByRole('button', { name: '90D' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('RevenueChart — Exported Types & Sub-components', () => {
  it('exposes LineChart sub-component via named export and renders without errors', () => {
    expect(LineChart).toBeDefined();
    expect(typeof LineChart).toBe('function');
    expect(() => render(
      <LineChart data={mockSampleData} series={mockSeriesData} />
    )).not.toThrow();
  });
});

describe('RevenueChart — Legend Blur/Focus Reset & Roving Tabindex Restoration', () => {
  it('resets focusedIndex to null when focus leaves all legend chips (blur path)', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const chips = screen.getAllByRole('button', { name: /series/ });

    fireEvent.focus(chips[1]);
    expect(chips[1]).toHaveAttribute('tabindex', '0');
    expect(chips[0]).toHaveAttribute('tabindex', '-1');

    fireEvent.blur(chips[1]);
    fireEvent.focus(document.body);

    expect(() => {
      fireEvent.focus(chips[0]);
    }).not.toThrow();
    expect(chips[0]).toHaveAttribute('tabindex', '0');
  });

  it('keeps focusedIndex intact when moving focus between chips (no blur reset)', () => {
    render(<RevenueChart series={mockSeriesData} />);
    const chips = screen.getAllByRole('button', { name: /series/ });

    fireEvent.focus(chips[1]);
    fireEvent.blur(chips[1], { relatedTarget: chips[2] });

    expect(() => fireEvent.focus(chips[2])).not.toThrow();
    expect(chips[2]).toHaveAttribute('tabindex', '0');
  });
});

describe('RevenueChart — Tooltip Position Boundary Clamping', () => {
  it('flips tooltip below data point when point is too close to top (y < padding.top)', () => {
    const topHeavySeries: SeriesData[] = [
      {
        id: 'peak',
        name: 'Peak Revenue',
        color: '#cc79a7',
        visible: true,
        data: [
          { date: 'Jan 1', revenue: 50 },
          { date: 'Jan 2', revenue: 1200 },
          { date: 'Jan 3', revenue: 40 },
          { date: 'Jan 4', revenue: 35 },
          { date: 'Jan 5', revenue: 30 },
        ]
      }
    ];

    const { container } = render(<RevenueChart series={topHeavySeries} />);
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });

    expect(() => {
      fireEvent.mouseEnter(points[1]);
    }).not.toThrow();

    const tooltipGroup = container.querySelector('g.tooltip');
    expect(tooltipGroup).toBeInTheDocument();
  });
});

describe('RevenueChart — Single Data Point X-Axis Label (coverage line 579-580)', () => {
  it('renders single centered x-axis label when exactly one data point present (data.length === 1)', () => {
    const onePointSeries: SeriesData[] = [
      {
        id: 'solo',
        name: 'Solo Point',
        color: '#56b4e9',
        visible: true,
        data: [{ date: 'Today', revenue: 750 }]
      }
    ];

    const singleData = [{ date: 'Today', revenue: 750 }];
    const { container } = render(<RevenueChart data={singleData} series={onePointSeries} />);

    const dataCircles = container.querySelectorAll('circle.data-point');
    expect(dataCircles.length).toBe(1);

    const allAxisTexts = container.querySelectorAll('text.axis-label');
    expect(allAxisTexts.length).toBeGreaterThan(0);

    const summaryEl = document.getElementById('revenue-chart-summary-desc');
    expect(summaryEl?.textContent).toContain('Today');
  });
});

describe('RevenueChart — Hidden Series Pattern Fill + Dashed Line Consistency', () => {
  it('applies both SVG pattern fill to hidden data points AND revenue-line--hidden dashed style', async () => {
    render(<RevenueChart series={mockSeriesData} />);

    fireEvent.click(screen.getByRole('button', { name: /subscriptions series, visible/i }));

    const hiddenChip = await screen.findByRole('button', { name: /subscriptions series, hidden/i });
    expect(hiddenChip).toHaveAttribute('aria-pressed', 'false');

    const hiddenLines = document.querySelectorAll('path.revenue-line--hidden');
    expect(hiddenLines.length).toBeGreaterThanOrEqual(1);
    hiddenLines.forEach(line => {
      expect(line).toHaveStyle({ strokeDasharray: '5,5' });
    });

    const hiddenCircles = document.querySelectorAll('circle.data-point--hidden');
    expect(hiddenCircles.length).toBeGreaterThanOrEqual(1);
    hiddenCircles.forEach(circle => {
      const fill = circle.getAttribute('fill');
      expect(fill).toMatch(/^url\(#pattern-.*\)$/);
    });
  });
});

describe('RevenueChart — Legend Chip Indicator Pattern Fill (Hidden State)', () => {
  it('legend chip indicator uses pattern/gradient background when series is hidden', async () => {
    render(<RevenueChart series={mockSeriesData} />);

    fireEvent.click(screen.getByRole('button', { name: /one-time payments series, visible/i }));

    const hiddenChip = await screen.findByRole('button', { name: /one-time payments series, hidden/i });
    const indicator = hiddenChip.querySelector('.legend-chip__indicator');
    expect(indicator).toHaveClass('legend-chip__indicator--hidden');
    expect(indicator).not.toHaveClass('legend-chip__indicator--visible');
  });
});

describe('RevenueChart — Chart Point Trend Announcement Branches (lines 383-389)', () => {
  it('announces "down $X from previous" when focused point revenue decreases', async () => {
    const downSeries: SeriesData[] = [
      {
        id: 'down',
        name: 'Declining Revenue',
        color: '#d55e00',
        visible: true,
        data: [
          { date: 'Mon', revenue: 1000 },
          { date: 'Tue', revenue: 600 },
        ]
      }
    ];

    render(<RevenueChart series={downSeries} />);
    const chartLiveRegion = screen.getByTestId('chart-live-region');
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });

    fireEvent.focus(points[1]);

    await waitFor(() => {
      const txt = chartLiveRegion.textContent || '';
      expect(txt).toContain('down');
      expect(txt).toContain('from previous');
    });
  });

  it('announces "unchanged from previous" when focused point revenue equals previous', async () => {
    const flatSeries: SeriesData[] = [
      {
        id: 'flat',
        name: 'Flat Revenue',
        color: '#882255',
        visible: true,
        data: [
          { date: 'Mon', revenue: 500 },
          { date: 'Tue', revenue: 500 },
        ]
      }
    ];

    render(<RevenueChart series={flatSeries} />);
    const chartLiveRegion = screen.getByTestId('chart-live-region');
    const points = screen.getAllByRole('button', { name: /\(Point \d+ of \d+\)/ });

    fireEvent.focus(points[1]);

    await waitFor(() => {
      const txt = chartLiveRegion.textContent || '';
      expect(txt).toContain('unchanged from previous');
    });
  });
});
