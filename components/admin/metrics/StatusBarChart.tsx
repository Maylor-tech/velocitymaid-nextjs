interface StatusBarChartProps {
  data: Array<{ status: string; count: number }>;
}

export default function StatusBarChart({ data }: StatusBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-vm-muted">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    assigned: 'bg-vm-navy',
    in_progress: 'bg-purple-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  const formatStatus = (status: string): string => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        const color = statusColors[item.status.toLowerCase()] || 'bg-gray-500';

        return (
          <div key={item.status} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-vm-text">
                {formatStatus(item.status)}
              </span>
              <span className="text-vm-muted font-semibold">{item.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className={`${color} h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2`}
                style={{ width: `${percentage}%` }}
              >
                {percentage > 10 && (
                  <span className="text-white text-xs font-medium">
                    {item.count}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


















