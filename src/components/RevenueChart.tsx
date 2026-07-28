import { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import './RevenueChart.css';

export type TimeRange = '7D' | '30D' | '90D';

export interface DataPoint {
  date: string;
  revenue: number;
}

export interface SeriesData {
  id: string;
  name: string;
  data: DataPoint[];
  color: string;
  visible: boolean;
}

export interface RevenueChartProps {
  initialTimeRange?: TimeRange;
  data?: DataPoint[];
  series?: SeriesData[];
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

// Mock series generator
function generateMockSeries(days: number): SeriesData[] {
  const baseData = generateMockData(days);
  
  return [
    {
      id: 'revenue',
      name: 'Total Revenue',
      color: 'var(--chart-series-1)',
      visible: true,
      data: baseData
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions',
      color: 'var(--chart-series-2)', 
      visible: true,
      data: baseData.map(d => ({
        ...d,
        revenue: Math.round(d.revenue * 0.7 + Math.random() * 100 - 50)
      }))
    },
    {
      id: 'oneTime',
      name: 'One-time Payments',
      color: 'var(--chart-series-3)',
      visible: true,
      data: baseData.map(d => ({
        ...d,
        revenue: Math.round(d.revenue * 0.3 + Math.random() * 150 - 75)
      }))
    }
  ];
}

export default function RevenueChart({
  initialTimeRange = '30D',
  data: customData,
  series: customSeries,
  ariaLabel = 'Revenue over time'
}: RevenueChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({});
  
  const data = useMemo(() => {
    if (customData) return customData;
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    return generateMockData(days);
  }, [timeRange, customData]);

  const series = useMemo(() => {
    if (customSeries) return customSeries;
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    return generateMockSeries(days);
  }, [timeRange, customSeries]);

  // Apply visibility state to series
  const visibleSeries = useMemo(() => {
    return series.map(s => ({
      ...s,
      visible: seriesVisibility[s.id] !== undefined ? seriesVisibility[s.id] : s.visible
    }));
  }, [series, seriesVisibility]);

  const toggleSeriesVisibility = (seriesId: string) => {
    setSeriesVisibility(prev => ({
      ...prev,
      [seriesId]: prev[seriesId] !== undefined ? !prev[seriesId] : !series.find(s => s.id === seriesId)?.visible
    }));
  };

  // Dataset summary statistics for screen readers
  const summary = useMemo(() => {
    const activeSeries = visibleSeries.filter(s => s.visible);
    if (!data.length || !activeSeries.length) return 'No revenue data available.';
    
    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    const seriesNames = activeSeries.map(s => s.name).join(', ');
    
    return `Revenue chart summary from ${startDate} to ${endDate}: ${data.length} data points showing ${seriesNames}. Use Left and Right arrow keys to explore individual data points. Press Escape to dismiss tooltip.`;
  }, [data, visibleSeries]);
  
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
      <InteractiveLegend 
        series={visibleSeries}
        onToggleSeries={toggleSeriesVisibility}
      />
      <LineChart data={data} series={visibleSeries} />
    </div>
  );
}

interface InteractiveLegendProps {
  series: SeriesData[];
  onToggleSeries: (seriesId: string) => void;
}

function InteractiveLegend({ series, onToggleSeries }: InteractiveLegendProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset refs array when series length changes
  useEffect(() => {
    chipRefs.current = chipRefs.current.slice(0, series.length);
  }, [series.length]);

  const handleToggle = (seriesId: string, seriesName: string, isVisible: boolean) => {
    onToggleSeries(seriesId);
    const newState = isVisible ? 'hidden' : 'shown';
    setAnnouncement(`${seriesName} series ${newState}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (series.length === 0) return;

    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = Math.min(series.length - 1, index + 1);
        break;
      case 'ArrowLeft': 
      case 'ArrowUp':
        nextIndex = Math.max(0, index - 1);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = series.length - 1;
        break;
      case ' ':
      case 'Enter': {
        e.preventDefault();
        const currentSeries = series[index];
        handleToggle(currentSeries.id, currentSeries.name, currentSeries.visible);
        return;
      }
      default:
        return;
    }

    if (nextIndex !== null && nextIndex !== index) {
      e.preventDefault();
      setFocusedIndex(nextIndex);
      chipRefs.current[nextIndex]?.focus();
    }
  };

  const visibleCount = series.filter(s => s.visible).length;
  const allHidden = visibleCount === 0;

  return (
    <div className="legend-container">
      {/* Live region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        data-testid="legend-live-region"
      >
        {announcement}
      </div>
      
      <div 
        className="legend-chips"
        role="group" 
        aria-label={`Chart legend with ${series.length} series`}
      >
        {series.map((seriesItem, index) => {
          const isRovingTabTarget = focusedIndex !== null ? focusedIndex === index : index === 0;
          const isVisible = seriesItem.visible;
          const isOnlyVisible = isVisible && visibleCount === 1;
          
          return (
            <button
              key={seriesItem.id}
              ref={(el) => { chipRefs.current[index] = el; }}
              type="button"
              className={`legend-chip ${isVisible ? 'legend-chip--visible' : 'legend-chip--hidden'} ${isOnlyVisible ? 'legend-chip--only-visible' : ''}`}
              onClick={() => handleToggle(seriesItem.id, seriesItem.name, isVisible)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => {
                // Only reset focus if moving outside the legend
                setTimeout(() => {
                  const newFocus = document.activeElement;
                  if (!chipRefs.current.includes(newFocus as HTMLButtonElement)) {
                    setFocusedIndex(null);
                  }
                }, 0);
              }}
              tabIndex={isRovingTabTarget ? 0 : -1}
              aria-pressed={isVisible}
              aria-describedby={isOnlyVisible ? 'legend-only-visible-hint' : undefined}
              aria-label={`${seriesItem.name} series, ${isVisible ? 'visible' : 'hidden'}`}
              disabled={isOnlyVisible}
              style={{
                '--series-color': seriesItem.color
              } as React.CSSProperties}
            >
              <span 
                className={`legend-chip__indicator ${isVisible ? 'legend-chip__indicator--visible' : 'legend-chip__indicator--hidden'}`}
                aria-hidden="true"
              />
              <span className="legend-chip__label">
                {seriesItem.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {allHidden && (
        <div className="legend-warning" role="alert">
          All series are hidden. At least one series must be visible.
        </div>
      )}
      
      <div id="legend-only-visible-hint" className="sr-only">
        This is the only visible series and cannot be hidden. Show another series first to hide this one.
      </div>
    </div>
  );
}

interface LineChartProps {
  data: DataPoint[];
  series: SeriesData[];
}

export function LineChart({ data, series }: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ seriesId: string; index: number } | null>(null);
  const [focusedPoint, setFocusedPoint] = useState<{ seriesId: string; index: number } | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pointRefs = useRef<Map<string, (SVGCircleElement | null)[]>>(new Map());

  const visibleSeries = series.filter(s => s.visible);
  const allSeries = series;

  // Reset refs when data or series changes (track refs for ALL series)
  useEffect(() => {
    const newMap = new Map();
    allSeries.forEach(s => {
      newMap.set(s.id, new Array(data.length).fill(null));
    });
    pointRefs.current = newMap;
  }, [data.length, allSeries]);

  // Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate scales across ALL series (including hidden) for stable y-axis
  const maxRevenue = useMemo(() => {
    if (!allSeries.length || !data.length) return 100;
    const allValues = allSeries.flatMap(s => s.data.map(d => d.revenue));
    return Math.max(...allValues);
  }, [allSeries, data]);
  
  const yMax = Math.max(400, Math.ceil(maxRevenue / 400) * 400);
  const yTicks = 5;
  const yStep = yMax / (yTicks - 1);
  
  // Calculate points for each series (ALL series including hidden)
  const seriesPoints = useMemo(() => {
    if (data.length === 0) return [];
    
    return allSeries.map(seriesItem => {
      const points = data.map((_, i) => {
        const seriesDataPoint = seriesItem.data[i];
        if (!seriesDataPoint) return null;
        
        let x: number;
        if (data.length === 1) {
          x = padding.left + chartWidth / 2;
        } else {
          x = padding.left + (i / (data.length - 1)) * chartWidth;
        }
        const y = padding.top + chartHeight - (seriesDataPoint.revenue / yMax) * chartHeight;
        
        return { x, y, ...seriesDataPoint, seriesId: seriesItem.id, pointIndex: i };
      }).filter(Boolean);
      
      return {
        ...seriesItem,
        points
      };
    });
  }, [data, allSeries, yMax, chartWidth, chartHeight, padding.left, padding.top]);

  // Active point (keyboard focus takes precedence, fallback to hover)
  const activePoint = focusedPoint || hoveredPoint;

  // Announce active point changes via aria-live
  useEffect(() => {
    if (focusedPoint && data[focusedPoint.index]) {
      const seriesItem = visibleSeries.find(s => s.id === focusedPoint.seriesId);
      const dataPoint = seriesItem?.data[focusedPoint.index];
      if (seriesItem && dataPoint) {
        let trendNotice = '';
        if (focusedPoint.index > 0) {
          const prevDataPoint = seriesItem.data[focusedPoint.index - 1];
          if (prevDataPoint) {
            const diff = dataPoint.revenue - prevDataPoint.revenue;
            if (diff > 0) {
              trendNotice = `, up $${diff.toLocaleString()} from previous`;
            } else if (diff < 0) {
              trendNotice = `, down $${Math.abs(diff).toLocaleString()} from previous`;
            } else {
              trendNotice = ', unchanged from previous';
            }
          }
        }
        setAnnouncement(
          `${seriesItem.name}: ${dataPoint.date}, $${dataPoint.revenue.toLocaleString()}${trendNotice}. Point ${focusedPoint.index + 1} of ${data.length}.`
        );
      }
    }
  }, [focusedPoint, data, visibleSeries]);
  
  // X-axis labels
  const xLabelIndices = useMemo(() => {
    if (data.length <= 7) return data.map((_, i) => i);
    if (data.length <= 30) {
      return data.map((_, i) => i).filter(i => i % 3 === 0 || i === data.length - 1);
    }
    return data.map((_, i) => i).filter(i => i % 10 === 0 || i === data.length - 1);
  }, [data]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<SVGCircleElement>, seriesId: string, pointIndex: number) => {
    if (data.length === 0) return;

    const isRTL = svgRef.current?.closest('[dir="rtl"]') !== null || document.dir === 'rtl';
    let nextPoint: { seriesId: string; index: number } | null = null;

    switch (e.key) {
      case 'ArrowRight':
        nextPoint = {
          seriesId,
          index: isRTL ? Math.max(0, pointIndex - 1) : Math.min(data.length - 1, pointIndex + 1)
        };
        break;
      case 'ArrowLeft':
        nextPoint = {
          seriesId,
          index: isRTL ? Math.min(data.length - 1, pointIndex + 1) : Math.max(0, pointIndex - 1)
        };
        break;
      case 'ArrowUp': {
        const currentSeriesIndex = visibleSeries.findIndex(s => s.id === seriesId);
        const nextSeriesIndex = Math.max(0, currentSeriesIndex - 1);
        nextPoint = {
          seriesId: visibleSeries[nextSeriesIndex].id,
          index: pointIndex
        };
        break;
      }
      case 'ArrowDown': {
        const currentSeriesIndexDown = visibleSeries.findIndex(s => s.id === seriesId);
        const nextSeriesIndexDown = Math.min(visibleSeries.length - 1, currentSeriesIndexDown + 1);
        nextPoint = {
          seriesId: visibleSeries[nextSeriesIndexDown].id,
          index: pointIndex
        };
        break;
      }
      case 'Home':
        nextPoint = { seriesId, index: 0 };
        break;
      case 'End':
        nextPoint = { seriesId, index: data.length - 1 };
        break;
      case 'Escape':
        e.preventDefault();
        setFocusedPoint(null);
        pointRefs.current.get(seriesId)?.[pointIndex]?.blur();
        return;
      default:
        return;
    }

    if (nextPoint) {
      e.preventDefault();
      setFocusedPoint(nextPoint);
      if (nextPoint.seriesId !== seriesId || nextPoint.index !== pointIndex) {
        pointRefs.current.get(nextPoint.seriesId)?.[nextPoint.index]?.focus();
      }
    }
  };

  // Tooltip calculations
  const tooltipCoords = useMemo(() => {
    if (!activePoint || !data[activePoint.index]) return null;
    
    const seriesItem = seriesPoints.find(s => s.id === activePoint.seriesId);
    const point = seriesItem?.points.find(p => p.pointIndex === activePoint.index);
    if (!point) return null;
    
    const tooltipWidth = 120;
    const tooltipHeight = 60;
    
    let x = point.x;
    let y = point.y - tooltipHeight - 12;

    // Boundary clamping
    const minX = padding.left + tooltipWidth / 2;
    const maxX = width - padding.right - tooltipWidth / 2;
    if (x < minX) x = minX;
    if (x > maxX) x = maxX;

    if (y < padding.top) {
      y = point.y + 16;
    }

    return { 
      x, y, width: tooltipWidth, height: tooltipHeight, 
      pointX: point.x, pointY: point.y,
      seriesName: seriesItem.name,
      value: point.revenue,
      date: point.date
    };
  }, [activePoint, seriesPoints, data, padding.left, padding.right, padding.top, width]);
  
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
        aria-label="Multi-series revenue data visualization"
        aria-describedby="revenue-chart-summary-desc"
      >
        <title>Revenue over time - Multiple series</title>
        <desc>Interactive multi-series line chart showing revenue trends. Navigate between series using up/down arrows and between data points using left/right arrows.</desc>
        
        {/* Patterns for hidden series — defined for ALL series so toggling works cleanly */}
        <defs>
          {allSeries.map(seriesItem => (
            <pattern 
              key={`pattern-${seriesItem.id}`}
              id={`pattern-${seriesItem.id}`}
              patternUnits="userSpaceOnUse" 
              width="4" 
              height="4"
            >
              <rect width="4" height="4" fill={seriesItem.color} opacity="0.2"/>
              <path d="M0,4 L4,0 M-1,1 L1,-1 M3,5 L5,3" stroke="var(--chart-series-pattern-ink)" strokeWidth="0.5"/>
            </pattern>
          ))}
        </defs>
        
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
          if (!data[i]) return null;
          const x = data.length === 1 
            ? padding.left + chartWidth / 2
            : padding.left + (i / (data.length - 1)) * chartWidth;
            
          return (
            <text
              key={`x-label-${i}`}
              x={x}
              y={height - padding.bottom + 22}
              className="axis-label"
              textAnchor="middle"
            >
              {data[i].date}
            </text>
          );
        })}
        
        {/* Lines for each series */}
        {seriesPoints.map(seriesItem => {
          if (seriesItem.points.length <= 1) return null;
          
          const pathData = seriesItem.points.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
          ).join(' ');
          
          return (
            <path
              key={`line-${seriesItem.id}`}
              d={pathData}
              className={`revenue-line ${!seriesItem.visible ? 'revenue-line--hidden' : ''}`}
              fill="none"
              stroke={seriesItem.color}
              style={{
                strokeDasharray: !seriesItem.visible ? '5,5' : 'none',
                opacity: !seriesItem.visible ? 0.5 : 1
              }}
            />
          );
        })}

        {/* Drop guide line for active point */}
        {activePoint && tooltipCoords && (
          <line
            x1={tooltipCoords.pointX}
            y1={tooltipCoords.pointY}
            x2={tooltipCoords.pointX}
            y2={height - padding.bottom}
            className="active-drop-line"
          />
        )}
        
        {/* Data points for each series (hidden series are non-interactive with pattern fill) */}
        {seriesPoints.map(seriesItem =>
          seriesItem.points.map((point, i) => {
            const isVisible = seriesItem.visible;
            const isActivePoint = isVisible && activePoint?.seriesId === seriesItem.id && activePoint?.index === point.pointIndex;
            const isFocusedPoint = isVisible && focusedPoint?.seriesId === seriesItem.id && focusedPoint?.index === point.pointIndex;
            
            // Roving tabindex: only visible series participate. First point of first visible series
            // is initial tab target; otherwise the focused point is tab target.
            const isRovingTabTarget = isVisible && (focusedPoint 
              ? isFocusedPoint 
              : seriesItem.id === visibleSeries[0]?.id && i === 0);

            return (
              <g 
                key={`point-group-${seriesItem.id}-${i}`} 
                className={`data-point-group ${!isVisible ? 'data-point-group--hidden' : ''}`}
                style={!isVisible ? { pointerEvents: 'none' } : undefined}
              >
                {isActivePoint && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={10}
                    className="data-point-pulse"
                    fill={seriesItem.color}
                  />
                )}
                <circle
                  ref={(el) => {
                    const seriesRefs = pointRefs.current.get(seriesItem.id) || [];
                    seriesRefs[i] = el;
                    pointRefs.current.set(seriesItem.id, seriesRefs);
                  }}
                  cx={point.x}
                  cy={point.y}
                  r={isActivePoint ? 6 : 4}
                  className={`data-point ${isActivePoint ? 'active' : ''} ${isFocusedPoint ? 'focused' : ''} ${!isVisible ? 'data-point--hidden' : ''}`}
                  fill={isVisible ? seriesItem.color : `url(#pattern-${seriesItem.id})`}
                  stroke={isVisible ? 'var(--chart-point-stroke)' : seriesItem.color}
                  strokeWidth={isVisible ? 2 : 1}
                  style={{ opacity: isVisible ? 1 : 0.55 }}
                  onMouseEnter={isVisible ? () => setHoveredPoint({ seriesId: seriesItem.id, index: point.pointIndex }) : undefined}
                  onMouseLeave={isVisible ? () => setHoveredPoint(null) : undefined}
                  onFocus={isVisible ? () => setFocusedPoint({ seriesId: seriesItem.id, index: point.pointIndex }) : undefined}
                  onKeyDown={isVisible ? (e) => handleKeyDown(e, seriesItem.id, point.pointIndex) : undefined}
                  role={isVisible ? 'button' : undefined}
                  tabIndex={isRovingTabTarget ? 0 : -1}
                  aria-label={isVisible ? `${seriesItem.name}: ${point.date}, $${point.revenue.toLocaleString()} (Point ${point.pointIndex + 1} of ${data.length})` : undefined}
                  aria-describedby={isActivePoint ? "chart-active-tooltip" : undefined}
                />
              </g>
            );
          })
        )}
        
        {/* Tooltip */}
        {activePoint && tooltipCoords && (
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
              y={tooltipCoords.y + 16}
              className="tooltip-text tooltip-series"
              textAnchor="middle"
            >
              {tooltipCoords.seriesName}
            </text>
            <text
              x={tooltipCoords.x}
              y={tooltipCoords.y + 32}
              className="tooltip-text"
              textAnchor="middle"
            >
              ${tooltipCoords.value.toLocaleString()}
            </text>
            <text
              x={tooltipCoords.x}
              y={tooltipCoords.y + 48}
              className="tooltip-date"
              textAnchor="middle"
            >
              {tooltipCoords.date}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
