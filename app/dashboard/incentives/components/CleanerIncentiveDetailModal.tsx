'use client';

import { useState, useEffect } from 'react';
import type { CleanerIncentive } from '../../../../utils/incentiveData';
import TierBadge from './TierBadge';
import LocationBadge from '../../../cleaners/components/LocationBadge';

interface CleanerIncentiveDetailModalProps {
  cleanerId: string | null;
  cleanerName?: string;
  onClose: () => void;
}

export default function CleanerIncentiveDetailModal({
  cleanerId,
  cleanerName,
  onClose,
}: CleanerIncentiveDetailModalProps) {
  const [incentives, setIncentives] = useState<CleanerIncentive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cleanerId) {
      fetchIncentives();
    }
  }, [cleanerId]);

  const fetchIncentives = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/incentives/list?cleanerId=${cleanerId}`);
      const data = await response.json();

      if (data.success) {
        setIncentives(data.incentives);
      }
    } catch (error) {
      console.error('Error fetching incentives:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!cleanerId) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const latestIncentive = incentives[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Incentive Details - {cleanerName || cleanerId.substring(0, 12)}...
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : incentives.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No incentive data available</p>
          ) : (
            <>
              {/* Current Performance */}
              {latestIncentive && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border-2 border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tier</p>
                      <TierBadge tier={latestIncentive.tier} size="lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                      <p className="text-2xl font-bold text-gray-900">{latestIncentive.totalJobs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {latestIncentive.avgRating.toFixed(1)}/5
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Bonus</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${latestIncentive.bonusAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Weekly Incentive History */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Incentive History</h3>
                <div className="space-y-3">
                  {incentives.map((incentive) => (
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}




