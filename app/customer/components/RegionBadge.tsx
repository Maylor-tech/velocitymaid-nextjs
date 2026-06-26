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
          ? 'bg-vm-cyan-tint text-blue-800'
          : 'bg-vm-success-bg text-vm-success'
      }`}
    >
      {isNJ ? 'New Jersey' : 'Vermont'}
    </span>
  );
}




