'use client';

// TODO: Protect this route with admin authentication

import { useState, useEffect } from 'react';
import IncentiveKpis from './components/IncentiveKpis';
import IncentiveLeaderboard from './components/IncentiveLeaderboard';
import TierTrendChart from './components/TierTrendChart';
import CleanerIncentiveDetailModal from './components/CleanerIncentiveDetailModal';
import type { CleanerIncentive } from '../../../utils/incentiveData';

export default function IncentivesDashboardPage() {
  const [incentives, setIncentives] = useState<CleanerIncentive[]>([]);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIncentives();
  }, []);

  const fetchIncentives = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/incentives/list');
      const data = await response.json();

      if (data.success) {
        setIncentives(data.incentives);
      } else {
        throw new Error(data.error || 'Failed to fetch incentives');
      }
    } catch (err: any) {
      console.error('Error fetching incentives:', err);
      setError(err.message || 'Failed to load incentives');
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const latestIncentives = incentives.filter((inv, index, self) => {
    return index === self.findIndex((i) => i.cleanerId === inv.cleanerId);
  });

  const totalBonus = latestIncentives.reduce((sum, inv) => sum + inv.bonusAmount, 0);
  const njBonus = latestIncentives
    .filter((inv) => inv.cleanerId.includes('nj'))
    .reduce((sum, inv) => sum + inv.bonusAmount, 0);
  const vtBonus = latestIncentives
    .filter((inv) => inv.cleanerId.includes('vt'))
    .reduce((sum, inv) => sum + inv.bonusAmount, 0);

  const topPerformers = latestIncentives
    .sort((a, b) => b.bonusAmount - a.bonusAmount)
    .slice(0, 3)
    .map((inv) => ({
      cleanerName: inv.cleanerId.substring(0, 12) + '...',
      tier: inv.tier,
      bonusAmount: inv.bonusAmount,
    }));

  const topPerformer = topPerformers[0];

  if (loading && incentives.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading incentives...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-6 px-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">Cleaner Incentive Engine — VelocityMaid</h1>
          <p className="text-yellow-100 text-sm">Performance-based bonuses and tier tracking</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* KPIs */}
        <IncentiveKpis
          totalBonus={totalBonus}
          njBonus={njBonus}
          vtBonus={vtBonus}
          topPerformer={topPerformer ? {
            cleanerName: topPerformer.cleanerName,
            tier: topPerformer.tier,
          } : undefined}
          top3Performers={topPerformers}
        />

        {/* Leaderboard */}
        <div className="mb-6">
          <IncentiveLeaderboard
            incentives={incentives}
            onViewCleaner={setSelectedCleanerId}
          />
        </div>

        {/* Trends */}
        <div className="mb-6">
          <TierTrendChart incentives={incentives} />
        </div>

        {/* Cleaner Detail Modal */}
        {selectedCleanerId && (
          <CleanerIncentiveDetailModal
            cleanerId={selectedCleanerId}
            onClose={() => setSelectedCleanerId(null)}
          />
        )}
      </div>
    </div>
  );
}




