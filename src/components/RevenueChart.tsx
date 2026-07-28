import { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import './RevenueChart.css';

export type TimeRange = '7D' | '30D' | '90D';

export interface DataPoint {
  date: string;
  revenue: number;
}

export interface RevenueChartProps {
  initialTimeRange?: TimeRange;
  data?: DataPoint[];
  ariaLabel?: string;
}

// Mock data generator
function generateMockData(days: number): DataPoint[] {
  const data: DataPoint[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate increasing trend with some variance
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

export default function RevenueChart({
  initialTimeRange = '30D',
  data: customData,
  ariaLabel = 'Revenue over time'
}: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  
  const data = useMemo(() => {
    if (customData) return customData;
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    return generateMockData(days);
  }, [timeRange, customData]);

  // Dataset summary statistics for screen readers
  const summary = useMemo(() => {
    if (!data.length) return 'No revenue data available.';
    const revenues = data.map(d => d.revenue);
    const maxRev = Math.max(...revenues);
    const minRev = Math.min(...revenues);
    const totalRev = revenues.reduce((a, b) => a + b, 0);
    const avgRev = Math.round(totalRev / data.length);
    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    const maxPoint = data.find(d => d.revenue === maxRev);
    const minPoint = data.find(d => d.revenue === minRev);

    return `Revenue chart summary from ${startDate} to ${endDate}: ${data.length} total data points. Highest revenue is $${maxRev.toLocaleString()} on ${maxPoint?.date}, lowest revenue is $${minRev.toLocaleString()} on ${minPoint?.date}. Average revenue is $${avgRev.toLocaleString()}. Use Left and Right arrow keys to explore individual data points. Press Escape to dismiss tooltip.`;
  }, [data]);
  
  return (
    <div className="revenue-chart-container" role="region" aria-label={ariaLabel}>
      <div className="revenue-chart-header">
        <h2 className="revenue-chart-title" id="revenue-chart-title">Revenue over time</h2>
        <p id="revenue-chart-summary-desc" className="sr-only">
          {summary}
        </p>
        <div className="time-range-selector" role="group" aria-label="Select time range">
          {(['7D', '30D', '90D'] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
              aria-pressed={timeRange === range}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <LineChart data={data} />
    </div>
  );
}

interface LineChartProps {
  data: DataPoint[];
}

export function LineChart({ data }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointRefs = useRef<(SVGCircleElement | null)[]>([]);

  // Reset refs array when data length changes
  useEffect(() => {
    pointRefs.current = pointRefs.current.slice(0, data.length);
  }, [data.length]);

  // Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate scales
  const maxRevenue = data.length > 0 ? Math.max(...data.map(d => d.revenue)) : 100;
  const yMax = Math.max(400, Math.ceil(maxRevenue / 400) * 400); // Round up to nearest 400
  const yTicks = 5;
  const yStep = yMax / (yTicks - 1);
  
  // Calculate points
  const points = useMemo(() => {
    if (data.length === 0) return [];
    if (data.length === 1) {
      return [{
        x: padding.left + chartWidth / 2,
        y: padding.top + chartHeight - (data[0].revenue / yMax) * chartHeight,
        ...data[0]
      }];
    }
    return data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (d.revenue / yMax) * chartHeight;
      return { x, y, ...d };
    });
  }, [data, yMax, chartWidth, chartHeight, padding.left, padding.top]);

  // Active point index (keyboard focus takes precedence, fallback to hover)
  const activeIndex = focusedIndex !== null ? focusedIndex : hoveredIndex;

  // Announce active point changes via aria-live
  useEffect(() => {
    if (focusedIndex !== null && points[focusedIndex]) {
      const point = points[focusedIndex];
      let trendNotice = '';
      if (focusedIndex > 0) {
        const prevRevenue = points[focusedIndex - 1].revenue;
        const diff = point.revenue - prevRevenue;
        if (diff > 0) {
          trendNotice = `, up $${diff.toLocaleString()} from previous`;
        } else if (diff < 0) {
          trendNotice = `, down $${Math.abs(diff).toLocaleString()} from previous`;
        } else {
          trendNotice = ', unchanged from previous';
        }
      }
      setAnnouncement(
        `${point.date}: $${point.revenue.toLocaleString()}${trendNotice}. Data point ${focusedIndex + 1} of ${data.length}.`
      );
    }
  }, [focusedIndex, points, data.length]);
  
  // Create path
  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');
  
  // X-axis labels (show subset based on data length)
  const xLabelIndices = useMemo(() => {
    if (data.length <= 7) return data.map((_, i) => i);
    if (data.length <= 30) {
      return data.map((_, i) => i).filter(i => i % 3 === 0 || i === data.length - 1);
    }
    return data.map((_, i) => i).filter(i => i % 10 === 0 || i === data.length - 1);
  }, [data]);

  // Keyboard navigation handler
  const handleKeyDown = (e: KeyboardEvent<SVGCircleElement>, index: number) => {
    if (data.length === 0) return;

    // Detect RTL context
    const isRTL = svgRef.current?.closest('[dir="rtl"]') !== null || document.dir === 'rtl';

    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
        nextIndex = isRTL ? Math.max(0, index - 1) : Math.min(data.length - 1, index + 1);
        break;
      case 'ArrowLeft':
        nextIndex = isRTL ? Math.min(data.length - 1, index + 1) : Math.max(0, index - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.min(data.length - 1, index + 1);
        break;
      case 'ArrowDown':
        nextIndex = Math.max(0, index - 1);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = data.length - 1;
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedIndex(null);
        pointRefs.current[index]?.blur();
        return;
      default:
        return;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      setFocusedIndex(nextIndex);
      if (nextIndex !== index) {
        pointRefs.current[nextIndex]?.focus();
      }
    }
  };

  // Tooltip position calculations (stable positioning, boundary awareness)
  const tooltipCoords = useMemo(() => {
    if (activeIndex === null || !points[activeIndex]) return null;
    const pt = points[activeIndex];
    
    const tooltipWidth = 100;
    const tooltipHeight = 44;
    
    let x = pt.x;
    let y = pt.y - tooltipHeight - 12; // place above point by default

    // Horizontal boundary clamping
    const minX = padding.left + tooltipWidth / 2;
    const maxX = width - padding.right - tooltipWidth / 2;
    if (x < minX) x = minX;
    if (x > maxX) x = maxX;

    // Vertical boundary flipping (if near top edge)
    if (y < padding.top) {
      y = pt.y + 16; // place below point
    }

    return { x, y, width: tooltipWidth, height: tooltipHeight, pointX: pt.x, pointY: pt.y };
  }, [activeIndex, points, padding.left, padding.right, padding.top, width]);
  
  return (
    <div className="chart-wrapper">
      {/* Live region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        data-testid="chart-live-region"
      >
        {announcement}
      </div>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="line-chart"
        role="img"
        aria-label="Revenue data visualization"
        aria-describedby="revenue-chart-summary-desc"
      >
        <title>Revenue over time</title>
        <desc>Interactive line chart showing revenue trends over the selected time period. Navigate data points using arrow keys.</desc>
        
        {/* Grid lines */}
        {Array.from({ length: yTicks }).map((_, i) => {
          const y = padding.top + (i / (yTicks - 1)) * chartHeight;
          return (
            <line
              key={`grid-${i}`}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              className="grid-line"
            />
          );
        })}
        
        {/* Y-axis labels */}
        {Array.from({ length: yTicks }).map((_, i) => {
          const value = yMax - (i * yStep);
          const y = padding.top + (i / (yTicks - 1)) * chartHeight;
          return (
            <text
              key={`y-label-${i}`}
              x={padding.left - 10}
              y={y}
              className="axis-label"
              textAnchor="end"
              dominantBaseline="middle"
            >
              ${value.toLocaleString()}
            </text>
          );
        })}
        
        {/* X-axis labels */}
        {xLabelIndices.map((i) => {
          const point = points[i];
          if (!point) return null;
          return (
            <text
              key={`x-label-${i}`}
              x={point.x}
              y={height - padding.bottom + 22}
              className="axis-label"
              textAnchor="middle"
            >
              {data[i].date}
            </text>
          );
        })}
        
        {/* Line */}
        {points.length > 1 && (
          <path
            d={pathData}
            className="revenue-line"
            fill="none"
          />
        )}

        {/* Drop Guide Line for Active Point */}
        {activeIndex !== null && points[activeIndex] && (
          <line
            x1={points[activeIndex].x}
            y1={points[activeIndex].y}
            x2={points[activeIndex].x}
            y2={height - padding.bottom}
            className="active-drop-line"
          />
        )}
        
        {/* Data points */}
        {points.map((point, i) => {
          const isActive = activeIndex === i;
          const isFocused = focusedIndex === i;
          const isRovingTabTarget = focusedIndex !== null ? isFocused : i === 0;

          return (
            <g key={`point-group-${i}`} className="data-point-group">
              {isActive && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={10}
                  className="data-point-pulse"
                />
              )}
              <circle
                ref={(el) => { pointRefs.current[i] = el; }}
                cx={point.x}
                cy={point.y}
                r={isActive ? 6 : 4}
                className={`data-point ${isActive ? 'active' : ''} ${isFocused ? 'focused' : ''}`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={(e) => {
                  const relatedTarget = e.relatedTarget as Node | null;
                  if (relatedTarget && svgRef.current?.contains(relatedTarget)) {
                    return;
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, i)}
                role="button"
                tabIndex={isRovingTabTarget ? 0 : -1}
                aria-label={`${point.date}: $${point.revenue.toLocaleString()} (Point ${i + 1} of ${data.length})`}
                aria-describedby={isActive ? "chart-active-tooltip" : undefined}
                data-index={i}
              />
            </g>
          );
        })}
        
        {/* Tooltip Overlay */}
        {activeIndex !== null && tooltipCoords && (
          <g className="tooltip" id="chart-active-tooltip" role="tooltip">
            <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
            <rect
              x={tooltipCoords.x - tooltipCoords.width / 2}
              y={tooltipCoords.y}
              width={tooltipCoords.width}
              height={tooltipCoords.height}
              rx={6}
              className="tooltip-bg"
              filter="url(#tooltip-shadow)"
            />
            <text
              x={tooltipCoords.x}
              y={tooltipCoords.y + 18}
              className="tooltip-text"
              textAnchor="middle"
            >
              ${points[activeIndex].revenue.toLocaleString()}
            </text>
            <text
              x={tooltipCoords.x}
              y={tooltipCoords.y + 34}
              className="tooltip-date"
              textAnchor="middle"
            >
              {data[activeIndex].date}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
