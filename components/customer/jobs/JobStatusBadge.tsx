import { Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface JobStatusBadgeProps {
  status: string;
}

export default function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
    scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Scheduled' },
    assigned: { color: 'bg-blue-100 text-blue-800', icon: User, label: 'Assigned' },
    in_progress: { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
    reschedule_requested: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Reschedule Requested' },
    cancel_requested: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancel Requested' },
  };

  const config = statusConfig[status.toLowerCase()] || {
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle,
    label: status,
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}















