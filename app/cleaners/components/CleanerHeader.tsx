'use client';

import { BrandLogo } from '@/components/brand';
import LocationBadge from './LocationBadge';

interface CleanerHeaderProps {
  name: string;
  region?: 'new_jersey' | 'vermont'; // Legacy support
  branchName?: string; // New: branch name (e.g., "Miami")
  branchSlug?: string; // New: branch slug (e.g., "miami")
  onLogout?: () => void;
}

export default function CleanerHeader({ name, region, branchName, branchSlug, onLogout }: CleanerHeaderProps) {
  // Use branchName if available, otherwise fall back to region
  const displayLocation = branchName || (region === 'new_jersey' ? 'New Jersey' : region === 'vermont' ? 'Vermont' : null);

  return (
    <div className="bg-brand-forest text-brand-ivory py-6 px-6 rounded-xl shadow-lg mb-6 border border-brand-forest/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <BrandLogo variant="ivory" size="sm" className="mb-3" />
          <h1 className="text-xl font-serif font-bold mb-1">Welcome, {name}</h1>
          <div className="flex items-center gap-2">
            {displayLocation && (
              <LocationBadge location={region} branchName={branchName} branchSlug={branchSlug} />
            )}
            <span className="text-brand-ivory/70 text-xs font-sans font-bold uppercase tracking-wider">
              Specialist Portal
            </span>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}




