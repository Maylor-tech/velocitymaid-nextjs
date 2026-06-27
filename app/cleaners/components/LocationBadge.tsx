'use client';

interface LocationBadgeProps {
  location?: 'new_jersey' | 'vermont'; // Legacy support
  branchName?: string; // New: branch name (e.g., "Miami")
  branchSlug?: string; // New: branch slug (e.g., "miami")
}

export default function LocationBadge({ location, branchName, branchSlug }: LocationBadgeProps) {
  // Use branchName if available, otherwise fall back to region
  let displayText: string;
  let badgeClass: string;

  if (branchName) {
    displayText = branchName;
    // Miami gets a special color, others default to blue
    badgeClass = branchSlug === 'miami' 
      ? 'bg-pink-100 text-pink-800' 
      : 'bg-vm-cyan-tint text-blue-800';
  } else if (location === 'new_jersey') {
    displayText = 'New Jersey';
    badgeClass = 'bg-vm-cyan-tint text-blue-800';
  } else if (location === 'vermont') {
    displayText = 'Vermont';
    badgeClass = 'bg-vm-success-bg text-vm-success';
  } else {
    displayText = 'Unknown';
    badgeClass = 'bg-gray-100 text-vm-text';
  }
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}
    >
      {displayText}
    </span>
  );
}




