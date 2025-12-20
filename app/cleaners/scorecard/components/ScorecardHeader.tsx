'use client';

import LocationBadge from '../../components/LocationBadge';

interface ScorecardHeaderProps {
  cleanerName: string;
  region: 'new_jersey' | 'vermont';
  onBack?: () => void;
}

export default function ScorecardHeader({ cleanerName, region, onBack }: ScorecardHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-6 rounded-xl shadow-lg mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Performance Scorecard</h1>
          <div className="flex items-center gap-2">
            <span className="text-blue-100">{cleanerName}</span>
            <LocationBadge location={region} />
          </div>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}




