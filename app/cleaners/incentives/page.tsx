"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TierBadge from '@/app/dashboard/incentives/components/TierBadge';
import type { CleanerIncentive } from '@/utils/incentiveData';
import { calculateNextTierRequirements, getTierInfo } from '@/utils/incentiveEngine';
import type { PerformanceMetrics } from '@/utils/incentiveEngine';

export default function CleanerIncentivesPage() {
  const router = useRouter();
  const [latestIncentive, setLatestIncentive] = useState<CleanerIncentive | null>(null);
  const [incentiveHistory, setIncentiveHistory] = useState<CleanerIncentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIncentives();
  }, []);

  const fetchIncentives = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get cleaner ID from cookie (or use auth)
      const response = await fetch('/api/cleaners/scorecard');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/cleaners/login');
          return;
        }
        throw new Error('Failed to fetch scorecard');
      }

      const scorecardData = await response.json();
      if (!scorecardData.success) {
        throw new Error('Failed to fetch scorecard data');
      }

      const cleanerId = scorecardData.stats.cleanerId;

      // Fetch incentives
      const incentivesResponse = await fetch(`/api/incentives/list?cleanerId=${cleanerId}`);
      const incentivesData = await incentivesResponse.json();

      if (incentivesData.success) {
        const incentives = incentivesData.incentives;
        setLatestIncentive(incentives[0] || null);
        setIncentiveHistory(incentives.slice(0, 8)); // Last 8 weeks
      }
    } catch (err: any) {
      console.error('Error fetching incentives:', err);
      setError(err.message || 'Failed to load incentives');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate next tier requirements
  const nextTierInfo = latestIncentive
    ? calculateNextTierRequirements(
        {
          totalJobs: latestIncentive.totalJobs,
          avgRating: latestIncentive.avgRating,
          onTimeRate: latestIncentive.onTimeRate,
          complaintRate: latestIncentive.complaintRate,
        },
        latestIncentive.tier
      )
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium mb-4">Error</p>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={() => router.push('/cleaners/dashboard')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Incentives</h1>
            <p className="text-gray-600">Performance bonuses and tier tracking</p>
          </div>
          <button
            onClick={() => router.push('/cleaners/dashboard')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Current Tier & Bonus */}
        {latestIncentive ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 mb-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Tier</p>
                <TierBadge tier={latestIncentive.tier} size="lg" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">This Week's Bonus</p>
                <p className="text-4xl font-bold text-green-600">
                  ${latestIncentive.bonusAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-yellow-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">Jobs Completed</p>
                <p className="text-xl font-bold text-gray-900">{latestIncentive.totalJobs}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Avg Rating</p>
                <p className="text-xl font-bold text-gray-900">
                  {latestIncentive.avgRating.toFixed(1)}/5
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">On-Time Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {latestIncentive.onTimeRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Complaint Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {latestIncentive.complaintRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 text-center">
            <p className="text-gray-500">No incentive data available yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Complete jobs to start earning bonuses!
            </p>
          </div>
        )}

        {/* Next Tier Requirements */}
        {nextTierInfo && nextTierInfo.nextTier && nextTierInfo.requirements && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Next Tier: {nextTierInfo.nextTier}
            </h2>
            <div className="space-y-2 text-sm">
              {nextTierInfo.requirements.jobsNeeded > 0 && (
                <p className="text-gray-700">
                  • <span className="font-medium">{nextTierInfo.requirements.jobsNeeded}</span> more job{nextTierInfo.requirements.jobsNeeded !== 1 ? 's' : ''} needed
                </p>
              )}
              {nextTierInfo.requirements.ratingNeeded > 0 && (
                <p className="text-gray-700">
                  • <span className="font-medium">{nextTierInfo.requirements.ratingNeeded.toFixed(1)}</span> higher average rating needed
                </p>
              )}
              {nextTierInfo.requirements.onTimeNeeded > 0 && (
                <p className="text-gray-700">
                  • <span className="font-medium">{nextTierInfo.requirements.onTimeNeeded.toFixed(1)}%</span> higher on-time rate needed
                </p>
              )}
              {nextTierInfo.requirements.complaintReduction > 0 && (
                <p className="text-gray-700">
                  • <span className="font-medium">{nextTierInfo.requirements.complaintReduction.toFixed(1)}%</span> lower complaint rate needed
                </p>
              )}
            </div>
          </div>
        )}

        {/* Last 8 Weeks Trend */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Last 8 Weeks Trend</h2>
          {incentiveHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No history available</p>
          ) : (
            <div className="space-y-3">
              {incentiveHistory.map((incentive) => (
                <div
                  key={incentive.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <TierBadge tier={incentive.tier} size="sm" />
                      <span className="text-sm text-gray-600">
                        {formatDate(incentive.periodStart)} - {formatDate(incentive.periodEnd)}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ${incentive.bonusAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Jobs: </span>
                      <span className="font-medium">{incentive.totalJobs}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rating: </span>
                      <span className="font-medium">{incentive.avgRating.toFixed(1)}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-600">On-Time: </span>
                      <span className="font-medium">{incentive.onTimeRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Complaints: </span>
                      <span className="font-medium">{incentive.complaintRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



