'use client';

interface RevenueTrendChartProps {
  dates: string[];
  newJersey: number[];
  vermont: number[];
}

export default function RevenueTrendChart({ dates, newJersey, vermont }: RevenueTrendChartProps) {
  const maxRevenue = Math.max(
    ...newJersey,
    ...vermont,
    1
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (dates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Trends</h2>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Trends</h2>
      <div className="space-y-3">
        {dates.map((date, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{formatDate(date)}</span>
              <span className="text-gray-600">
                ${(newJersey[index] + vermont[index]).toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2 h-6">
              {newJersey[index] > 0 && (
                <div
                  className="bg-blue-500 rounded flex items-center justify-end pr-2"
                  style={{ width: `${(newJersey[index] / maxRevenue) * 100}%` }}
                >
                  {newJersey[index] > maxRevenue * 0.1 && (
                    <span className="text-white text-xs font-medium">
                      ${newJersey[index].toFixed(0)}
                    </span>
                  )}
                </div>
              )}
              {vermont[index] > 0 && (
                <div
                  className="bg-green-500 rounded flex items-center justify-end pr-2"
                  style={{ width: `${(vermont[index] / maxRevenue) * 100}%` }}
                >
                  {vermont[index] > maxRevenue * 0.1 && (
                    <span className="text-white text-xs font-medium">
                      ${vermont[index].toFixed(0)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-4 text-xs text-gray-600">
              <span>NJ: ${newJersey[index].toFixed(2)}</span>
              <span>VT: ${vermont[index].toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-600">New Jersey</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">Vermont</span>
        </div>
      </div>
    </div>
  );
}




