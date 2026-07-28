import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RevenueChart from './RevenueChart';

const mockSampleData = [
  { date: 'Jan 1', revenue: 500 },
  { date: 'Jan 2', revenue: 750 },
  { date: 'Jan 3', revenue: 600 },
  { date: 'Jan 4', revenue: 900 },
  { date: 'Jan 5', revenue: 1200 },
];

describe('RevenueChart — Basic Rendering', () => {
  it('renders chart region with title and time range selector', () => {
    render(<RevenueChart />);
    expect(screen.getByRole('region', { name: /revenue over time/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /revenue over time/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90D' })).toBeInTheDocument();
  });

  it('defaults to 30D active button and renders 30 data points', () => {
    render(<RevenueChart />);
    const btn30D = screen.getByRole('button', { name: '30D' });
    expect(btn30D).toHaveAttribute('aria-pressed', 'true');
    const points = screen.getAllByRole('button', { name: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ });
    expect(points.length).toBe(30);
  });

  it('switches time range when buttons are clicked', () => {
    render(<RevenueChart />);
    const btn7D = screen.getByRole('button', { name: '7D' });
    fireEvent.click(btn7D);
    expect(btn7D).toHaveAttribute('aria-pressed', 'true');
    const points7D = screen.getAllByRole('button', { name: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ });
    expect(points7D.length).toBe(7);

    const btn90D = screen.getByRole('button', { name: '90D' });
    fireEvent.click(btn90D);
    expect(btn90D).toHaveAttribute('aria-pressed', 'true');
    const points90D = screen.getAllByRole('button', { name: /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/ });
    expect(points90D.length).toBe(90);
  });

  it('accepts custom data via props', () => {
    render(<RevenueChart data={mockSampleData} />);
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });
    expect(points.length).toBe(5);
    expect(screen.getByRole('button', { name: /Jan 1: \$500/ })).toBeInTheDocument();
  });

  it('renders screen reader summary description', () => {
    render(<RevenueChart data={mockSampleData} />);
    const summaryEl = document.getElementById('revenue-chart-summary-desc');
    expect(summaryEl).toBeInTheDocument();
    expect(summaryEl?.textContent).toContain('Revenue chart summary from Jan 1 to Jan 5');
    expect(summaryEl?.textContent).toContain('Highest revenue is $1,200');
    expect(summaryEl?.textContent).toContain('lowest revenue is $500');
  });
});

describe('RevenueChart — Tooltip & Focus Traversal', () => {
  it('renders tooltip on hover', () => {
    render(<RevenueChart data={mockSampleData} />);
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });
    
    // Initially no tooltip
    expect(screen.queryByRole('tooltip')).toBeNull();

    // Hover second point
    fireEvent.mouseEnter(points[1]);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('$750');
    expect(tooltip).toHaveTextContent('Jan 2');

    // Mouse leave removes tooltip
    fireEvent.mouseLeave(points[1]);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('renders tooltip on focus and updates aria-live announcement', () => {
    render(<RevenueChart data={mockSampleData} />);
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });
    
    // Focus third point
    fireEvent.focus(points[2]);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('$600');
    expect(tooltip).toHaveTextContent('Jan 3');

    // Live region check
    const liveRegion = screen.getByTestId('chart-live-region');
    expect(liveRegion.textContent).toContain('Jan 3: $600');
    expect(liveRegion.textContent).toContain('down $150 from previous');
    expect(liveRegion.textContent).toContain('Data point 3 of 5');
  });

  it('navigates with ArrowRight and ArrowLeft keys', () => {
    render(<RevenueChart data={mockSampleData} />);
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });
    
    // Roving tabIndex: first point is 0, others -1
    expect(points[0]).toHaveAttribute('tabindex', '0');
    expect(points[1]).toHaveAttribute('tabindex', '-1');

    // Focus first point
    fireEvent.focus(points[0]);
    expect(points[0]).toHaveAttribute('tabindex', '0');

    // Press ArrowRight -> moves to point 1
    fireEvent.keyDown(points[0], { key: 'ArrowRight' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$750');

    // Press ArrowLeft -> moves back to point 0
    fireEvent.keyDown(points[1], { key: 'ArrowLeft' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$500');
  });

  it('supports Home and End keys for rapid navigation', () => {
    render(<RevenueChart data={mockSampleData} />);
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });

    fireEvent.focus(points[0]);

    // Press End -> jump to last point
    fireEvent.keyDown(points[0], { key: 'End' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$1,200');

    // Press Home -> jump to first point
    fireEvent.keyDown(points[4], { key: 'Home' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$500');
  });

  it('supports ArrowUp and ArrowDown keys', () => {
    render(<RevenueChart data={mockSampleData} />);
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });

    fireEvent.focus(points[0]);

    // ArrowUp increases index
    fireEvent.keyDown(points[0], { key: 'ArrowUp' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$750');

    // ArrowDown decreases index
    fireEvent.keyDown(points[1], { key: 'ArrowDown' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$500');
  });

  it('dismisses tooltip on Escape key press', () => {
    render(<RevenueChart data={mockSampleData} />);
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });

    fireEvent.focus(points[2]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.keyDown(points[2], { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('RevenueChart — RTL & Boundary Edge Cases', () => {
  it('reverses ArrowRight and ArrowLeft in RTL layout', () => {
    render(
      <div dir="rtl">
        <RevenueChart data={mockSampleData} />
      </div>
    );
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });

    fireEvent.focus(points[1]);

    // In RTL, ArrowRight moves to previous point (0)
    fireEvent.keyDown(points[1], { key: 'ArrowRight' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$500');

    // In RTL, ArrowLeft moves to next point (1)
    fireEvent.keyDown(points[0], { key: 'ArrowLeft' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$750');
  });

  it('handles single data point gracefully', () => {
    const singleData = [{ date: 'Jan 1', revenue: 1000 }];
    render(<RevenueChart data={singleData} />);
    const points = screen.getAllByRole('button', { name: /Jan 1: \$1,000/ });
    expect(points.length).toBe(1);

    fireEvent.focus(points[0]);
    expect(screen.getByRole('tooltip')).toHaveTextContent('$1,000');
  });

  it('handles empty data array gracefully', () => {
    render(<RevenueChart data={[]} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
    const summary = document.getElementById('revenue-chart-summary-desc');
    expect(summary?.textContent).toBe('No revenue data available.');
  });

  it('clamps navigation at dataset boundaries', () => {
    render(<RevenueChart data={mockSampleData} />);
    const points = screen.getAllByRole('button', { name: /Jan \d: \$/ });

    fireEvent.focus(points[0]);

    // Press ArrowLeft at first point -> stays at index 0
    fireEvent.keyDown(points[0], { key: 'ArrowLeft' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$500');

    // Focus last point and press ArrowRight -> stays at last point
    fireEvent.focus(points[4]);
    fireEvent.keyDown(points[4], { key: 'ArrowRight' });
    expect(screen.getByRole('tooltip')).toHaveTextContent('$1,200');
  });
});
