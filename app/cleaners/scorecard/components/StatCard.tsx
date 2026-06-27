'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: StatCardProps) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-vm-success bg-vm-success-bg',
    yellow: 'border-yellow-500 bg-yellow-50',
    red: 'border-red-500 bg-red-50',
    purple: 'border-purple-500 bg-purple-50',
  };

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000) {
        return `$${(val / 1000).toFixed(1)}k`;
      }
      if (val < 1 && val > 0) {
        return `${(val * 100).toFixed(1)}%`;
      }
      if (val % 1 !== 0) {
        return val.toFixed(1);
      }
      return val.toString();
    }
    return val;
  };

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-vm-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-vm-text">{formatValue(value)}</p>
          {subtitle && (
            <p className="text-xs text-vm-muted mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 text-vm-muted">{icon}</div>
        )}
      </div>
      {trend && (
        <div className={`mt-2 text-xs ${trend === 'up' ? 'text-vm-success' : trend === 'down' ? 'text-red-600' : 'text-vm-muted'}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trend === 'neutral' && '→'}
        </div>
      )}
    </div>
  );
}




