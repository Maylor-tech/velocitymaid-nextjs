'use client';

interface MetricBadgeProps {
  value: number;
  type: 'percentage' | 'count' | 'time' | 'score';
  threshold?: {
    excellent: number;
    fair: number;
  };
}

export default function MetricBadge({ value, type, threshold }: MetricBadgeProps) {
  const formatValue = (): string => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'count':
        return value.toString();
      case 'time':
        const hours = Math.floor(value / 60);
        const minutes = Math.round(value % 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      case 'score':
        return `${value}/100`;
      default:
        return value.toString();
    }
  };

  const getColor = (): 'green' | 'yellow' | 'red' => {
    if (!threshold) {
      return 'green';
    }

    if (value >= threshold.excellent) {
      return 'green';
    } else if (value >= threshold.fair) {
      return 'yellow';
    } else {
      return 'red';
    }
  };

  const color = getColor();
  const colorClasses = {
    green: 'bg-vm-success-bg text-vm-success',
    yellow: 'bg-vm-warning-bg text-yellow-800',
    red: 'bg-vm-danger-bg text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {formatValue()}
    </span>
  );
}




