'use client';

interface RatingDisplayProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export default function RatingDisplay({ rating, size = 'md', showNumber = true }: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className={`${sizeClasses[size]} leading-none`}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">☆</span>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="text-vm-muted">☆</span>
        ))}
      </div>
      {showNumber && (
        <span className="text-sm font-medium text-vm-text ml-2">
          {rating.toFixed(1)}/5
        </span>
      )}
    </div>
  );
}




