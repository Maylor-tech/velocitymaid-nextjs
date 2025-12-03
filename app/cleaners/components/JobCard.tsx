'use client';

import StatusBadge from './StatusBadge';
import LocationBadge from './LocationBadge';

export interface CleanerJob {
  id: string;
  sessionId: string;
  customerName: string;
  address: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  serviceLocation: 'new_jersey' | 'vermont';
  status: 'pending' | 'assigned' | 'confirmed' | 'on_the_way' | 'completed' | 'cancelled';
  specialInstructions?: string;
  phone?: string;
  totalPrice?: number;
}

interface JobCardProps {
  job: CleanerJob;
  onStatusUpdate?: (jobId: string, newStatus: string) => void;
}

export default function JobCard({ job, onStatusUpdate }: JobCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    // If already formatted, return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    return timeStr;
  };

  const canMarkOnTheWay = job.status === 'confirmed' || job.status === 'assigned';
  const canMarkCompleted = job.status === 'on_the_way' || job.status === 'confirmed';

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{job.customerName}</h3>
            <LocationBadge location={job.serviceLocation} />
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-gray-600 mb-1">{job.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-gray-500 block mb-1">Date & Time</span>
          <span className="font-medium text-gray-900">{formatDate(job.preferredDate)}</span>
          <span className="text-gray-600 ml-2">{formatTime(job.preferredTime)}</span>
        </div>
        <div>
          <span className="text-gray-500 block mb-1">Service</span>
          <span className="font-medium text-gray-900">{job.serviceType}</span>
        </div>
      </div>

      {job.specialInstructions && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs font-medium text-yellow-800 mb-1">Special Instructions:</p>
          <p className="text-sm text-yellow-900">{job.specialInstructions}</p>
        </div>
      )}

      {job.phone && (
        <div className="mb-4 text-sm text-gray-600">
          <span className="font-medium">Customer Phone:</span> {job.phone}
        </div>
      )}

      {job.totalPrice && (
        <div className="mb-4 text-sm">
          <span className="text-gray-500">Total:</span>
          <span className="ml-2 font-semibold text-gray-900">${job.totalPrice.toFixed(2)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {canMarkOnTheWay && (
          <button
            onClick={() => onStatusUpdate?.(job.id, 'on_the_way')}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            Mark as On The Way
          </button>
        )}
        {canMarkCompleted && (
          <button
            onClick={() => onStatusUpdate?.(job.id, 'completed')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            Mark as Completed
          </button>
        )}
        {job.status === 'completed' && (
          <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center font-medium text-sm">
            ✓ Completed
          </div>
        )}
        {job.status === 'cancelled' && (
          <div className="flex-1 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-center font-medium text-sm">
            Cancelled
          </div>
        )}
      </div>
    </div>
  );
}



