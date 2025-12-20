'use client';

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
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-6 rounded-xl shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome, {name}</h1>
          <div className="flex items-center gap-2">
            {displayLocation && (
              <LocationBadge location={region} branchName={branchName} branchSlug={branchSlug} />
            )}
            <span className="text-blue-100 text-sm">Cleaner Portal</span>
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




