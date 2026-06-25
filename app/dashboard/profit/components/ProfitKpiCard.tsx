'use client';

interface ProfitKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  isProfit?: boolean;
  isNegative?: boolean;
}

export default function ProfitKpiCard({
  title,
  value,
  subtitle,
  isProfit = false,
  isNegative = false,
}: ProfitKpiCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (Math.abs(val) >= 1000) {
        return `$${(val / 1000).toFixed(1)}k`;
      }
      if (val % 1 !== 0) {
        return `$${val.toFixed(2)}`;
      }
      return `$${val.toFixed(0)}`;
    }
    return val;
  };

  const valueColor = isProfit
    ? isNegative
      ? 'text-red-600'
      : 'text-green-600'
    : 'text-vm-text';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
      <p className="text-sm font-medium text-vm-muted mb-1">{title}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{formatValue(value)}</p>
      {subtitle && (
        <p className="text-xs text-vm-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}




