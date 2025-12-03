'use client';

import LocationBadge from './LocationBadge';

export interface Job {
  sessionId: string;
  customerName: string;
  phone: string;
  email: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  serviceLocation: string;
  totalPrice: number;
  status: 'scheduled' | 'confirmed' | 'assigned' | 'completed' | 'cancelled';
  assignedCleanerPhone?: string;
  assignedCleanerName?: string;
  confirmationSent?: boolean;
  reminderSent?: boolean;
  createdAt: string;
}

interface JobCardProps {
  job: Job;
}

const statusColors = {
  scheduled: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  assigned: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function JobCard({ job }: JobCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    // If already formatted, return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    // Otherwise, try to format
    return timeStr;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{job.customerName}</h3>
            <LocationBadge location={job.serviceLocation} />
          </div>
          <p className="text-sm text-gray-600">{job.address}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
          {statusLabels[job.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-500">Date:</span>
          <span className="ml-2 font-medium">{formatDate(job.preferredDate)}</span>
        </div>
        <div>
          <span className="text-gray-500">Time:</span>
          <span className="ml-2 font-medium">{formatTime(job.preferredTime)}</span>
        </div>
        <div>
          <span className="text-gray-500">Service:</span>
          <span className="ml-2 font-medium">{job.serviceType}</span>
        </div>
        <div>
          <span className="text-gray-500">Price:</span>
          <span className="ml-2 font-medium">${job.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {job.assignedCleanerName && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Cleaner:</span> {job.assignedCleanerName}
          </p>
        </div>
      )}

      {!job.assignedCleanerPhone && job.status !== 'completed' && job.status !== 'cancelled' && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-orange-600 font-medium">⚠️ Needs Assignment</span>
        </div>
      )}

      <div className="mt-2 flex gap-2 text-xs text-gray-500">
        {job.confirmationSent && <span>✓ Confirmed</span>}
        {job.reminderSent && <span>✓ Reminder Sent</span>}
      </div>
    </div>
  );
}



