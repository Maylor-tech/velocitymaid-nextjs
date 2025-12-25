'use client';

import type { CleanerIncentive } from '../../../../utils/incentiveData';
import TierBadge from './TierBadge';
import LocationBadge from '../../../../cleaners/components/LocationBadge';

interface IncentiveLeaderboardProps {
  incentives: CleanerIncentive[];
  onViewCleaner: (cleanerId: string) => void;
}

export default function IncentiveLeaderboard({
  incentives,
  onViewCleaner,
}: IncentiveLeaderboardProps) {
  // Get latest incentive per cleaner
  const latestByCleaner = new Map<string, CleanerIncentive>();
  
  incentives.forEach((incentive) => {
    const existing = latestByCleaner.get(incentive.cleanerId);
    if (!existing || new Date(incentive.periodStart) > new Date(existing.periodStart)) {
      latestByCleaner.set(incentive.cleanerId, incentive);
    }
  });

  const latestIncentives = Array.from(latestByCleaner.values());

  // Sort by tier (Platinum first), then by rating
  const tierOrder: Record<string, number> = {
    Platinum: 4,
    Gold: 3,
    Silver: 2,
    Bronze: 1,
  };

  latestIncentives.sort((a, b) => {
    const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
    if (tierDiff !== 0) return tierDiff;
    return b.avgRating - a.avgRating;
  });

  if (latestIncentives.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cleaner Tier Leaderboard</h2>
        <p className="text-gray-500 text-center py-8">No incentives data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Cleaner Tier Leaderboard</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cleaner
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Branch
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tier
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jobs
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Rating
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              On-Time %
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bonus
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {latestIncentives.map((incentive, index) => (
            <tr key={incentive.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                #{index + 1}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {incentive.cleanerId.substring(0, 12)}...
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <LocationBadge location={incentive.cleanerId.includes('nj') ? 'new_jersey' : 'vermont'} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <TierBadge tier={incentive.tier} size="sm" />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {incentive.totalJobs}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {incentive.avgRating.toFixed(1)}/5
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {incentive.onTimeRate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                ${incentive.bonusAmount.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <button
                  onClick={() => onViewCleaner(incentive.cleanerId)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




