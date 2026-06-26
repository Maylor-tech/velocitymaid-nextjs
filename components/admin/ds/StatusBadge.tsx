import { JOB_STATUS_STYLE, type JobStatus } from '@/lib/brand/status';

interface StatusBadgeProps {
  status: JobStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const key = String(status).toLowerCase() as JobStatus;
  const style =
    JOB_STATUS_STYLE[key] ??
    ({ label: String(status), bg: 'bg-vm-surface', fg: 'text-vm-text' } as const);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-body text-sm font-medium ${style.bg} ${style.fg} ${className}`}
    >
      {style.label}
    </span>
  );
}
