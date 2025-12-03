'use client';

import type { ServiceRegion } from '@/utils/reviewData';

interface RegionBadgeProps {
  location: ServiceRegion;
  size?: 'sm' | 'md';
}

export default function RegionBadge({ location, size = 'md' }: RegionBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const isNJ = location === 'new_jersey';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${
        isNJ
          ? 'bg-blue-100 text-blue-800'
          : 'bg-green-100 text-green-800'
      }`}
    >
      {isNJ ? 'New Jersey' : 'Vermont'}
    </span>
  );
}



