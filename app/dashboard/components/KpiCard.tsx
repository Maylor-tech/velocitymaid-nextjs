'use client';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export default function KpiCard({ title, value, subtitle, icon, trend }: KpiCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000) {
        return `$${(val / 1000).toFixed(1)}k`;
      }
      if (val < 1 && val > 0) {
        return `${(val * 100).toFixed(1)}%`;
      }
      return val.toString();
    }
    return val;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 text-blue-500">{icon}</div>
        )}
      </div>
      {trend && (
        <div className={`mt-2 text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trend === 'neutral' && '→'}
        </div>
      )}
    </div>
  );
}



