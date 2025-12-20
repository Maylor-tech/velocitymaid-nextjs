"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import KpiCard from '@/components/admin/ui/KpiCard';
import {
  Building2,
  Briefcase,
  CheckCircle,
  XCircle,
  Star,
  DollarSign,
  Users,
  AlertCircle,
  TrendingUp,
  Loader2,
  Calendar,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  slug: string;
}

interface BranchInsights {
  branch: {
    id: string;
    name: string;
    currency: string;
  };
  jobsSummary: {
    total: number;
    completed: number;
    cancelled: number;
    unassigned: number;
    cancellationRate: number;
  };
  ratings: {
    avgRating: number | null;
    totalReviews: number;
  };
  revenue: {
    totalRevenue: number;
    projectedRevenue: number;
  };
  cleaners: {
    totalCleaners: number;
    activeCleaners: number;
    trainingPending: number;
    jobsPerCleaner: number;
  };
  complaints: {
    open: number;
    resolved: number;
    severityBreakdown: Record<string, number>;
  };
  payouts: {
    owed: number;
  };
}

export default function BranchInsightsPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [insights, setInsights] = useState<BranchInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchInsights();
    }
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/admin/branches');
      const data = await res.json();
      if (data.success && data.branches) {
        setBranches(data.branches);
        if (data.branches.length > 0 && !selectedBranchId) {
          setSelectedBranchId(data.branches[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches');
    }
  };

  const fetchInsights = async () => {
    if (!selectedBranchId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/branches/${selectedBranchId}/insights`);
      const data = await res.json();

      if (data.success) {
        setInsights(data);
      } else {
        throw new Error(data.error || 'Failed to load insights');
      }
    } catch (err: any) {
      console.error('Error fetching insights:', err);
      setError(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branch Insights</h1>
            <p className="text-gray-600 mt-1">Comprehensive analytics and KPIs for branch operations</p>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Branch
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a branch...</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading insights...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Insights Content */}
        {!loading && !error && insights && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Jobs"
                value={insights.jobsSummary.total}
                icon={<Briefcase className="w-5 h-5" />}
              />
              <KpiCard
                label="Completed Jobs"
                value={insights.jobsSummary.completed}
                icon={<CheckCircle className="w-5 h-5" />}
                highlight
              />
              <KpiCard
                label="Cancellation Rate"
                value={`${insights.jobsSummary.cancellationRate.toFixed(1)}%`}
                icon={<XCircle className="w-5 h-5" />}
              />
              <KpiCard
                label="Avg Cleaner Rating"
                value={
                  insights.ratings.avgRating
                    ? `${insights.ratings.avgRating.toFixed(1)} / 5.0`
                    : 'N/A'
                }
                icon={<Star className="w-5 h-5" />}
              />
              <KpiCard
                label="Revenue Generated"
                value={formatCurrency(insights.revenue.totalRevenue, insights.branch.currency)}
                icon={<DollarSign className="w-5 h-5" />}
              />
              <KpiCard
                label="Payouts Owed"
                value={formatCurrency(insights.payouts.owed, insights.branch.currency)}
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <KpiCard
                label="Jobs per Cleaner"
                value={insights.cleaners.jobsPerCleaner.toFixed(1)}
                icon={<Users className="w-5 h-5" />}
              />
              <KpiCard
                label="Active Cleaners"
                value={`${insights.cleaners.activeCleaners} / ${insights.cleaners.totalCleaners}`}
                icon={<Users className="w-5 h-5" />}
              />
            </div>

            {/* Charts Section (Placeholder) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Jobs per Day Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs per Day</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Chart placeholder - Jobs per day visualization</p>
                </div>
              </div>

              {/* Revenue per Day Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue per Day</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Chart placeholder - Revenue per day visualization</p>
                </div>
              </div>

              {/* Complaint Trend Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Trend</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Chart placeholder - Complaint trend visualization</p>
                </div>
              </div>

              {/* Cleaner Performance Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Cleaner Performance Distribution
                </h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    Chart placeholder - Cleaner performance distribution
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Unassigned Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {insights.jobsSummary.unassigned}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {insights.ratings.totalReviews}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Training Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {insights.cleaners.trainingPending}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Projected Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(insights.revenue.projectedRevenue, insights.branch.currency)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

