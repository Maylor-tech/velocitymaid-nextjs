"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ScorecardHeader from './components/ScorecardHeader';
import StatCard from './components/StatCard';
import PerformanceChart from './components/PerformanceChart';
import JobsTable from './components/JobsTable';
import MetricBadge from './components/MetricBadge';
import RatingDisplay from './components/RatingDisplay';
import RatingTrendChart from './components/RatingTrendChart';
import ReviewList from './components/ReviewList';
import type { CleanerStats, CleanerJobWithTimestamps } from '@/utils/cleanerScorecardQueries';
import type { Review, ReviewStats } from '@/utils/reviewData';
import type { CleanerIncentive } from '@/utils/incentiveData';
import { calculateNextTierRequirements } from '@/utils/incentiveEngine';

interface ScorecardData {
  stats: CleanerStats;
  jobsByDay: Array<{ date: string; count: number }>;
  recentJobs: CleanerJobWithTimestamps[];
  reviews: Review[];
  reviewStats: ReviewStats;
  latestIncentive?: CleanerIncentive | null;
}

export default function CleanerScorecardPage() {
  const router = useRouter();
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScorecardData();
  }, []);

  const fetchScorecardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cleaners/scorecard');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/cleaners/login');
          return;
        }
        throw new Error('Failed to fetch scorecard data');
      }

      const result = await response.json();

      if (result.success) {
        setData({
          stats: result.stats,
          jobsByDay: result.jobsByDay,
          recentJobs: result.recentJobs,
          reviews: result.reviews || [],
          reviewStats: result.reviewStats || {
            averageRating: 0,
            totalReviews: 0,
            last5Reviews: [],
            recleanRequestRate: 0,
            ratingTrend: [],
          },
        });
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch scorecard data');
      }
    } catch (err: any) {
      console.error('Error fetching scorecard:', err);
      setError(err.message || 'Failed to load scorecard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">Error loading scorecard</p>
            <p className="text-red-500 text-sm mt-2">{error || 'Unknown error'}</p>
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

  const { stats, jobsByDay, recentJobs } = data;
  const reviews = data.reviews || [];
  const reviewStats = data.reviewStats || {
    averageRating: 0,
    totalReviews: 0,
    last5Reviews: [],
    recleanRequestRate: 0,
    ratingTrend: [],
  };
  const latestIncentive = data.latestIncentive;

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <ScorecardHeader
          cleanerName={stats.cleanerName}
          region={stats.region}
          onBack={() => router.push('/cleaners/dashboard')}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="On-Time Arrival"
            value={stats.onTimeRate}
            subtitle={`${stats.onTimeJobs} of ${stats.totalJobs} jobs`}
            icon={<span className="text-2xl">⏰</span>}
            color={stats.onTimeRate >= 90 ? 'green' : stats.onTimeRate >= 70 ? 'yellow' : 'red'}
          />
          <StatCard
            title="Completion Rate"
            value={stats.completionRate}
            subtitle={`${stats.completedJobs} of ${stats.totalJobs} jobs`}
            icon={<span className="text-2xl">✓</span>}
            color={stats.completionRate >= 95 ? 'green' : stats.completionRate >= 85 ? 'yellow' : 'red'}
          />
          {stats.averageJQS !== undefined && stats.averageJQS > 0 && (
            <StatCard
              title="Job Quality Score"
              value={stats.averageJQS}
              subtitle={`Based on ${stats.totalJQSJobs || 0} completed jobs`}
              icon={<span className="text-2xl">⭐</span>}
              color={stats.averageJQS >= 80 ? 'green' : stats.averageJQS >= 60 ? 'yellow' : 'red'}
            />
          )}
          <StatCard
            title="Jobs This Week"
            value={stats.jobsThisWeek}
            subtitle="Completed jobs"
            icon={<span className="text-2xl">📅</span>}
            color="blue"
          />
          <StatCard
            title="Jobs This Month"
            value={stats.jobsThisMonth}
            subtitle="Completed jobs"
            icon={<span className="text-2xl">📊</span>}
            color="blue"
          />
          <StatCard
            title="Customer Score"
            value={stats.customerScore}
            subtitle="Out of 100"
            icon={<span className="text-2xl">⭐</span>}
            color={stats.customerScore >= 90 ? 'green' : stats.customerScore >= 75 ? 'yellow' : 'red'}
          />
          <StatCard
            title="Avg Handling Time"
            value={stats.averageHandlingTime}
            subtitle="Minutes per job"
            icon={<span className="text-2xl">⏱️</span>}
            color="purple"
          />
        </div>

        {/* Performance Chart */}
        <div className="mb-6">
          <PerformanceChart data={jobsByDay} />
        </div>

        {/* Jobs Table */}
        <div className="mb-6">
          <JobsTable jobs={recentJobs} />
        </div>

        {/* Customer Rating Section */}
        {reviewStats.totalReviews > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Customer Rating</h2>
                {stats.averageRating < 4.0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    ⚠️ Needs Improvement
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6 mb-4">
                <RatingDisplay rating={stats.averageRating} size="lg" />
                <div>
                  <p className="text-sm text-gray-600">Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</p>
                  {stats.recleanRequestRate > 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      {stats.recleanRequestRate.toFixed(1)}% requested re-clean
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Trend Chart */}
        {reviewStats.ratingTrend.length > 0 && (
          <div className="mb-6">
            <RatingTrendChart ratings={reviewStats.ratingTrend} />
          </div>
        )}

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <div className="mb-6">
            <ReviewList reviews={reviews} />
          </div>
        )}

        {/* Service Recovery Section */}
        {stats.complaintCount > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Service Recovery</h2>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  {stats.complaintCount} Complaint{stats.complaintCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Complaint Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.complaintRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500 mt-1">of jobs have complaints</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jobs with Complaints</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round((stats.complaintRate / 100) * stats.totalJobs)}</p>
                  <p className="text-xs text-gray-500 mt-1">out of {stats.totalJobs} total</p>
                </div>
                {stats.latestComplaintRatings.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Latest Complaint Ratings</p>
                    <div className="flex gap-1">
                      {stats.latestComplaintRatings.map((rating, i) => (
                        <span key={i} className="text-lg">
                          {rating < 3 ? '🔴' : rating < 4 ? '🟡' : '🟢'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">On-Time Arrival Rate</p>
              <MetricBadge
                value={stats.onTimeRate}
                type="percentage"
                threshold={{ excellent: 90, fair: 70 }}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Completion Rate</p>
              <MetricBadge
                value={stats.completionRate}
                type="percentage"
                threshold={{ excellent: 95, fair: 85 }}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Average Handling Time</p>
              <MetricBadge value={stats.averageHandlingTime} type="time" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Customer Satisfaction</p>
              <MetricBadge
                value={stats.customerScore}
                type="score"
                threshold={{ excellent: 90, fair: 75 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

