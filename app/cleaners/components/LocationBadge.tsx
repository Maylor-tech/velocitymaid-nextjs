'use client';

interface LocationBadgeProps {
  location: 'new_jersey' | 'vermont';
}

export default function LocationBadge({ location }: LocationBadgeProps) {
  const isNewJersey = location === 'new_jersey';
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isNewJersey
          ? 'bg-blue-100 text-blue-800'
          : 'bg-green-100 text-green-800'
      }`}
    >
      {isNewJersey ? 'New Jersey' : 'Vermont'}
    </span>
  );
}



