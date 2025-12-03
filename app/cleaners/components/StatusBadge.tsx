'use client';

export type JobStatus = 'pending' | 'assigned' | 'confirmed' | 'on_the_way' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: JobStatus;
}

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-yellow-100 text-yellow-800',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-800',
  },
  on_the_way: {
    label: 'On The Way',
    className: 'bg-purple-100 text-purple-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-800',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}



