import { Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { JOB_STATUS_STYLE, type JobStatus } from '@/lib/brand/status';

interface JobStatusBadgeProps {
  status: string;
}

// Icon-per-status stays local — icons are not part of the shared DS status map.
const STATUS_ICON: Record<JobStatus, typeof Clock> = {
  pending: Clock,
  scheduled: Clock,
  assigned: User,
  in_progress: Clock,
  completed: CheckCircle,
  cancelled: XCircle,
  reschedule_requested: AlertCircle,
  cancel_requested: XCircle,
};

export default function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const key = status.toLowerCase() as JobStatus;
  const style = JOB_STATUS_STYLE[key];
  const Icon = STATUS_ICON[key] ?? AlertCircle;

  const bg = style?.bg ?? 'bg-vm-surface';
  const fg = style?.fg ?? 'text-vm-text';
  const label = style?.label ?? status;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-body font-medium ${bg} ${fg}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}
