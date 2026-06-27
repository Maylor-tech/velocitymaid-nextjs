interface JobsTrendChartProps {
  data: Array<{ date: string; count: number }>;
}

export default function JobsTrendChart({ data }: JobsTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-vm-muted">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const barWidth = 100 / data.length;
  const padding = 2;

  return (
    <div className="space-y-4">
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg
          width="100%"
          height={chartHeight}
          className="overflow-visible"
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={chartHeight * ratio}
              x2="100"
              y2={chartHeight * ratio}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* Line path */}
          <polyline
            points={data
              .map(
                (d, i) =>
                  `${(i + 0.5) * barWidth},${chartHeight - (d.count / maxCount) * chartHeight}`
              )
              .join(' ')}
            fill="none"
            stroke="#4A6CF7"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const y = chartHeight - (d.count / maxCount) * chartHeight;
            return (
              <circle
                key={i}
                cx={(i + 0.5) * barWidth}
                cy={y}
                r="2"
                fill="#4A6CF7"
                className="hover:r-3 transition-all"
              />
            );
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-vm-muted mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-center" style={{ width: `${barWidth}%` }}>
            {formatDate(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

