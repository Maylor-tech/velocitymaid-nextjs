'use client';

interface PerformanceChartProps {
  data: Array<{ date: string; count: number }>;
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Jobs Completed (Last 30 Days)</h2>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Jobs Completed (Last 30 Days)</h2>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-20 text-xs text-gray-600 text-right">
              {formatDate(item.date)}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="bg-blue-500 rounded h-6 flex items-center justify-end pr-2 min-w-[20px]"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              >
                {item.count > 0 && (
                  <span className="text-white text-xs font-medium">{item.count}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



