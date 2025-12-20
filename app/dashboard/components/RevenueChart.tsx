'use client';

import { RevenueData } from '@/utils/dashboardQueries';

interface RevenueChartProps {
  data: RevenueData[];
  region: 'new_jersey' | 'vermont' | null;
}

export default function RevenueChart({ data, region }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.total), 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue (Last 7 Days)</h2>
      
      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No revenue data available</p>
      ) : (
        <div className="space-y-4">
          {data.map((day) => (
            <div key={day.date} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{formatDate(day.date)}</span>
                <span className="text-gray-600">${day.total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 h-6">
                {region !== 'vermont' && day.newJersey > 0 && (
                  <div
                    className="bg-blue-500 rounded flex items-center justify-end pr-2"
                    style={{ width: `${(day.newJersey / maxRevenue) * 100}%` }}
                  >
                    {day.newJersey > maxRevenue * 0.1 && (
                      <span className="text-white text-xs font-medium">
                        ${day.newJersey.toFixed(0)}
                      </span>
                    )}
                  </div>
                )}
                {region !== 'new_jersey' && day.vermont > 0 && (
                  <div
                    className="bg-green-500 rounded flex items-center justify-end pr-2"
                    style={{ width: `${(day.vermont / maxRevenue) * 100}%` }}
                  >
                    {day.vermont > maxRevenue * 0.1 && (
                      <span className="text-white text-xs font-medium">
                        ${day.vermont.toFixed(0)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {region === null && (
                <div className="flex gap-4 text-xs text-gray-600">
                  <span>NJ: ${day.newJersey.toFixed(2)}</span>
                  <span>VT: ${day.vermont.toFixed(2)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-4 text-sm">
        {region === null && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-600">New Jersey</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">Vermont</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}




