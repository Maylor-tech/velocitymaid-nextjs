import { ReactNode } from 'react';

export interface KpiDelta {
  value: string;
  direction: 'up' | 'down' | 'flat';
}

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  delta?: KpiDelta;
  icon?: ReactNode;
  className?: string;
}

export function KpiCard({ label, value, subtitle, delta, icon, className = '' }: KpiCardProps) {
  const deltaColor =
    delta?.direction === 'down'
      ? 'text-vm-danger'
      : delta?.direction === 'flat'
        ? 'text-vm-muted'
        : 'text-vm-success';

  return (
    <div
      className={`rounded-xl border border-vm-border bg-vm-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-sm font-medium text-vm-muted">{label}</p>
          <p className="mt-1.5 font-heading text-3xl font-bold leading-none text-vm-navy">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 font-body text-xs text-vm-muted">{subtitle}</p>
          )}
          {delta && (
            <p className={`mt-2 font-body text-xs font-semibold ${deltaColor}`}>
              {delta.direction === 'down' ? '▾' : delta.direction === 'flat' ? '•' : '▴'}{' '}
              {delta.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-vm-cyan-tint text-vm-cyan-dark">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
