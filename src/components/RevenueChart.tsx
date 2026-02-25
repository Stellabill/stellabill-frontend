import { useState, useMemo } from 'react';
import './RevenueChart.css';

type TimeRange = '7D' | '30D' | '90D';

interface DataPoint {
  date: string;
  revenue: number;
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

export default function RevenueChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');
  
  const data = useMemo(() => {
    const days = timeRange === '7D' ? 7 : timeRange === '30D' ? 30 : 90;
    return generateMockData(days);
  }, [timeRange]);
  
  return (
    <div className="revenue-chart-container">
      <div className="revenue-chart-header">
        <h2 className="revenue-chart-title">Revenue over time</h2>
        <div className="time-range-selector">
          {(['7D', '30D', '90D'] as TimeRange[]).map((range) => (
            <button
              key={range}
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

function LineChart({ data }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Chart dimensions
  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate scales
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const yMax = Math.ceil(maxRevenue / 400) * 400; // Round up to nearest 400
  const yTicks = 5;
  const yStep = yMax / (yTicks - 1);
  
  // Calculate points
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.revenue / yMax) * chartHeight;
    return { x, y, ...d };
  });
  
  // Create path
  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');
  
  // X-axis labels (show subset based on data length)
  const xLabelIndices = useMemo(() => {
    if (data.length <= 7) return data.map((_, i) => i);
    if (data.length <= 30) {
      // Show every 3rd label
      return data.map((_, i) => i).filter(i => i % 3 === 0 || i === data.length - 1);
    }
    // Show every 10th label for 90 days
    return data.map((_, i) => i).filter(i => i % 10 === 0 || i === data.length - 1);
  }, [data.length]);
  
  return (
    <div className="chart-wrapper">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="line-chart"
        role="img"
        aria-label="Revenue over time line chart"
      >
        <title>Revenue over time</title>
        <desc>Line chart showing revenue trends over the selected time period</desc>
        
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
              ${value}
            </text>
          );
        })}
        
        {/* X-axis labels */}
        {xLabelIndices.map((i) => {
          const point = points[i];
          return (
            <text
              key={`x-label-${i}`}
              x={point.x}
              y={height - padding.bottom + 20}
              className="axis-label"
              textAnchor="middle"
            >
              {data[i].date}
            </text>
          );
        })}
        
        {/* Line */}
        <path
          d={pathData}
          className="revenue-line"
          fill="none"
        />
        
        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x}
            cy={point.y}
            r={4}
            className="data-point"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            role="button"
            tabIndex={0}
            aria-label={`${point.date}: $${point.revenue}`}
          />
        ))}
        
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <g className="tooltip">
            <rect
              x={points[hoveredIndex].x - 40}
              y={points[hoveredIndex].y - 40}
              width={80}
              height={30}
              rx={4}
              className="tooltip-bg"
            />
            <text
              x={points[hoveredIndex].x}
              y={points[hoveredIndex].y - 30}
              className="tooltip-text"
              textAnchor="middle"
            >
              ${points[hoveredIndex].revenue}
            </text>
            <text
              x={points[hoveredIndex].x}
              y={points[hoveredIndex].y - 15}
              className="tooltip-date"
              textAnchor="middle"
            >
              {data[hoveredIndex].date}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
