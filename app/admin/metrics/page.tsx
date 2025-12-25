"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import KpiCard from '@/components/admin/metrics/KpiCard';
import StatusBarChart from '@/components/admin/metrics/StatusBarChart';
import JobsTrendChart from '@/components/admin/metrics/JobsTrendChart';
import TopCleanersTable from '@/components/admin/metrics/TopCleanersTable';
import {
  Briefcase,
  Calendar,
  Users,
  UserCheck,
  DollarSign,
  AlertCircle,
  Loader2,
  RefreshCw,
  Building2,
} from 'lucide-react';

interface MetricsOverview {
  branch: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    state: string | null;
  };
  kpis: {
    jobsToday: number;
    jobsThisWeek: number;
    unassignedJobs: number;
    activeCleaners: number;
    totalCustomers: number;
    revenueThisWeek: number;
  };
  jobStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
  jobsLast14Days: Array<{
    date: string;
    count: number;
  }>;
  topCleaners: Array<{
    cleanerId: string;
    name: string | null;
    email: string;
    jobsCompleted: number;
    averageRating: number | null;
    completionRate: number;
  }>;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/metrics/overview');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching metrics:', err);
      setError(err.message || 'Unable to load metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchMetrics();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Metrics</h1>
            <p className="text-gray-600 mt-1">Live view of VelocityMaid performance</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading metrics...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Metrics</h1>
            <p className="text-gray-600 mt-1">Live view of VelocityMaid performance</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Metrics</h1>
            <p className="text-gray-600 mt-1">Live view of VelocityMaid performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
              <Building2 className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">
                {metrics.branch.name}
                {metrics.branch.city && metrics.branch.state && (
                  <span className="text-primary-600 ml-1">
                    · {metrics.branch.city}, {metrics.branch.state}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <RefreshCw className="w-3 h-3" />
              <span>Auto-refreshing every 60s</span>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Jobs Today"
            value={metrics.kpis.jobsToday}
            icon={<Briefcase className="w-6 h-6" />}
          />
          <KpiCard
            label="Jobs This Week"
            value={metrics.kpis.jobsThisWeek}
            icon={<Calendar className="w-6 h-6" />}
          />
          <KpiCard
            label="Unassigned Jobs"
            value={metrics.kpis.unassignedJobs}
            icon={<AlertCircle className="w-6 h-6" />}
            subtitle={metrics.kpis.unassignedJobs > 0 ? 'Requires attention' : 'All assigned'}
          />
          <KpiCard
            label="Active Cleaners"
            value={metrics.kpis.activeCleaners}
            icon={<UserCheck className="w-6 h-6" />}
          />
          <KpiCard
            label="Total Customers"
            value={metrics.kpis.totalCustomers}
            icon={<Users className="w-6 h-6" />}
          />
          <KpiCard
            label="Revenue This Week"
            value={formatCurrency(metrics.kpis.revenueThisWeek)}
            icon={<DollarSign className="w-6 h-6" />}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jobs Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Jobs Over Last 14 Days
            </h3>
            <JobsTrendChart data={metrics.jobsLast14Days} />
          </div>

          {/* Status Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Job Status Distribution
            </h3>
            <StatusBarChart data={metrics.jobStatusDistribution} />
          </div>
        </div>

        {/* Top Cleaners Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Cleaners by Performance (Last 60 Days)
          </h3>
          <TopCleanersTable cleaners={metrics.topCleaners} />
        </div>
      </div>
    </AdminLayout>
  );
}
















