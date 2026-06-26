'use client';

export type JobStatus = 'pending' | 'assigned' | 'confirmed' | 'on_the_way' | 'completed' | 'cancelled';

interface StatusBadgeProps {
  status: JobStatus;
}

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-vm-text',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-vm-warning-bg text-yellow-800',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-vm-cyan-tint text-blue-800',
  },
  on_the_way: {
    label: 'On The Way',
    className: 'bg-purple-100 text-purple-800',
  },
  completed: {
    label: 'Completed',
    className: 'bg-vm-success-bg text-vm-success',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-vm-danger-bg text-red-800',
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




