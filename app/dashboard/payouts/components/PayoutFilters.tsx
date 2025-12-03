'use client';

import type { PayoutStatus } from '@/utils/payoutData';

type ServiceRegion = 'new_jersey' | 'vermont' | null;

interface PayoutFiltersProps {
  periodStart: string;
  periodEnd: string;
  status: PayoutStatus | 'all';
  branch: ServiceRegion;
  onPeriodChange: (start: string, end: string) => void;
  onStatusChange: (status: PayoutStatus | 'all') => void;
  onBranchChange: (branch: ServiceRegion) => void;
}

export default function PayoutFilters({
  periodStart,
  periodEnd,
  status,
  branch,
  onPeriodChange,
  onStatusChange,
  onBranchChange,
}: PayoutFiltersProps) {
  const statusOptions: Array<{ id: PayoutStatus | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'paid', label: 'Paid' },
  ];

  // Get last N weeks
  const getLastWeekRange = (weeksAgo: number) => {
    const now = new Date();
    const day = now.getDay();
    const daysToLastMonday = day === 0 ? 6 : day - 1;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysToLastMonday - (7 * weeksAgo));
    lastMonday.setHours(0, 0, 0, 0);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);
    return {
      start: lastMonday.toISOString().split('T')[0],
      end: lastSunday.toISOString().split('T')[0],
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4].map((weeks) => {
              const range = getLastWeekRange(weeks);
              const isSelected = periodStart === range.start && periodEnd === range.end;
              return (
                <button
                  key={weeks}
                  onClick={() => onPeriodChange(range.start, range.end)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {weeks === 0 ? 'This Week' : `${weeks} Week${weeks !== 1 ? 's' : ''} Ago`}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onStatusChange(option.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  status === option.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <div className="flex gap-2">
            <button
              onClick={() => onBranchChange(null)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                branch === null
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onBranchChange('new_jersey')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                branch === 'new_jersey'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              New Jersey
            </button>
            <button
              onClick={() => onBranchChange('vermont')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                branch === 'vermont'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Vermont
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



