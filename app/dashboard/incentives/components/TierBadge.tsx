'use client';

import type { IncentiveTier } from '@/utils/incentiveData';

interface TierBadgeProps {
  tier: IncentiveTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const tierColors: Record<IncentiveTier, { bg: string; text: string; border: string }> = {
  Bronze: {
    bg: '#cd7f32',
    text: '#ffffff',
    border: '#b8732a',
  },
  Silver: {
    bg: '#c0c0c0',
    text: '#000000',
    border: '#a8a8a8',
  },
  Gold: {
    bg: '#ffd700',
    text: '#000000',
    border: '#e6c200',
  },
  Platinum: {
    bg: '#e5e4e2',
    text: '#000000',
    border: '#d0d0d0',
  },
};

const tierIcons: Record<IncentiveTier, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2',
};

export default function TierBadge({ tier, size = 'md', showIcon = true }: TierBadgeProps) {
  const colors = tierColors[tier];
  const icon = tierIcons[tier];

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border-2 ${sizeClasses[size]}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {showIcon && <span>{icon}</span>}
      <span>{tier}</span>
    </span>
  );
}




