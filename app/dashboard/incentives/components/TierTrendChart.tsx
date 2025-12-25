'use client';

import { getTierIndex } from '../../../../utils/incentiveEngine';
import type { IncentiveTier } from '../../../../utils/incentiveData';
import type { CleanerIncentive } from '../../../../utils/incentiveData';

interface TierTrendChartProps {
  incentives: CleanerIncentive[];
}

export default function TierTrendChart({ incentives }: TierTrendChartProps) {
  // Group by week and region
  const weeklyData: Record<string, { nj: number[]; vt: number[] }> = {};

  incentives.forEach((incentive) => {
    const weekKey = incentive.periodStart;
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { nj: [], vt: [] };
    }

    const tierIndex = getTierIndex(incentive.tier);
    const region = incentive.cleanerId.includes('nj') ? 'nj' : 'vt';
    weeklyData[weekKey][region].push(tierIndex);
  });

  // Calculate average tier per week per region
  const weeks = Object.keys(weeklyData).sort();
  const njAverages = weeks.map((week) => {
    const tiers = weeklyData[week].nj;
    return tiers.length > 0
      ? tiers.reduce((sum, t) => sum + t, 0) / tiers.length
      : 0;
  });
  const vtAverages = weeks.map((week) => {
    const tiers = weeklyData[week].vt;
    return tiers.length > 0
      ? tiers.reduce((sum, t) => sum + t, 0) / tiers.length
      : 0;
  });

  const maxTier = 4; // Platinum

  if (weeks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Average Tier per Branch (Last 8 Weeks)
        </h2>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Average Tier per Branch (Last 8 Weeks)
      </h2>
      <div className="space-y-4">
        {weeks.slice(-8).map((week, index) => {
          const njAvg = njAverages[index] || 0;
          const vtAvg = vtAverages[index] || 0;
          const weekDate = new Date(week);
          const weekLabel = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return (
            <div key={week} className="space-y-2">
              <div className="text-sm font-medium text-gray-700">{weekLabel}</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600 w-16">NJ:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-blue-600 rounded-full h-6 flex items-center justify-end pr-2"
                        style={{ width: `${(njAvg / maxTier) * 100}%` }}
                      >
                        {njAvg > 0 && (
                          <span className="text-white text-xs font-medium">
                            {njAvg.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600 w-16">VT:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-green-600 rounded-full h-6 flex items-center justify-end pr-2"
                        style={{ width: `${(vtAvg / maxTier) * 100}%` }}
                      >
                        {vtAvg > 0 && (
                          <span className="text-white text-xs font-medium">
                            {vtAvg.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span>New Jersey</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>Vermont</span>
        </div>
        <span className="ml-auto">Scale: 1=Bronze, 2=Silver, 3=Gold, 4=Platinum</span>
      </div>
    </div>
  );
}




