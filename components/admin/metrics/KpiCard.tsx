import { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
}

export default function KpiCard({ label, value, icon, subtitle }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-vm-muted mb-1">{label}</p>
          <p className="text-3xl font-bold text-vm-text">{value}</p>
          {subtitle && <p className="text-xs text-vm-muted mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0 text-vm-cyan-dark">{icon}</div>
        )}
      </div>
    </div>
  );
}


















