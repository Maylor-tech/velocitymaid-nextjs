'use client';

import type { ComplaintStatus } from '@/utils/complaintData';

type ServiceRegion = 'new_jersey' | 'vermont' | null;

interface ComplaintFiltersProps {
  status: ComplaintStatus | 'all';
  region: ServiceRegion;
  onStatusChange: (status: ComplaintStatus | 'all') => void;
  onRegionChange: (region: ServiceRegion) => void;
}

export default function ComplaintFilters({
  status,
  region,
  onStatusChange,
  onRegionChange,
}: ComplaintFiltersProps) {
  const statusOptions: Array<{ id: ComplaintStatus | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'closed', label: 'Closed' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-vm-text mb-4">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-vm-text mb-2">Status</label>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onStatusChange(option.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  status === option.id
                    ? 'bg-vm-navy text-white shadow-md'
                    : 'bg-gray-200 text-vm-text hover:bg-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-vm-text mb-2">Region</label>
          <div className="flex gap-2">
            <button
              onClick={() => onRegionChange(null)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                region === null
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'bg-gray-200 text-vm-text hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onRegionChange('new_jersey')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                region === 'new_jersey'
                  ? 'bg-vm-navy text-white shadow-md'
                  : 'bg-gray-200 text-vm-text hover:bg-gray-300'
              }`}
            >
              New Jersey
            </button>
            <button
              onClick={() => onRegionChange('vermont')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                region === 'vermont'
                  ? 'bg-vm-success text-white shadow-md'
                  : 'bg-gray-200 text-vm-text hover:bg-gray-300'
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




