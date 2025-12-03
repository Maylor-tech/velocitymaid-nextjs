'use client';

type ServiceRegion = 'new_jersey' | 'vermont' | null;

interface RegionTabsProps {
  selectedRegion: ServiceRegion;
  onRegionChange: (region: ServiceRegion) => void;
}

export default function RegionTabs({ selectedRegion, onRegionChange }: RegionTabsProps) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onRegionChange('new_jersey')}
        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
          selectedRegion === 'new_jersey'
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        New Jersey
      </button>
      <button
        onClick={() => onRegionChange('vermont')}
        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
          selectedRegion === 'vermont'
            ? 'bg-green-600 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Vermont
      </button>
      <button
        onClick={() => onRegionChange(null)}
        className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
          selectedRegion === null
            ? 'bg-gray-800 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        All
      </button>
    </div>
  );
}



