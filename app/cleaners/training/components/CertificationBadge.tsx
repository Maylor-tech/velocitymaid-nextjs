/**
 * CertificationBadge Component
 * 
 * Displays "Jamaica Certified Cleaner" badge
 */

import { Award } from 'lucide-react';

interface CertificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CertificationBadge({ className = '', size = 'md' }: CertificationBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full font-semibold ${sizeClasses[size]} ${className}`}
      title="Jamaica Certified Cleaner"
    >
      <Award className={iconSizes[size]} />
      <span>Jamaica Certified</span>
    </span>
  );
}


