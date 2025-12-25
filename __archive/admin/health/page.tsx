"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Database,
  Briefcase,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  slug: string;
}

interface WorkerRunResult {
  success: boolean;
  branchId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  metrics?: {
    jobsToday: number;
    jobsThisWeek: number;
    revenueThisWeek: number;
    unassignedJobs: number;
    financial?: {
      totalGrossRevenue: number;
      totalBranchProfit: number;
      branchMargin: number;
      totalJobs: number;
      totalCleanerEarnings: number;
      totalCosts: number;
    };
  };
  cleanerLevels?: {
    totalCleaners: number;
    updated: number;
  };
  integrity?: {
    orphanJobs: number;
    jobsWithoutBranch: number;
    cleanersWithoutBranch: number;
    jobsWithMissingCleaner: number;
  };
  error?: string;
}

interface BranchMetrics {
  jobsToday: number;
  jobsThisWeek: number;
  revenueThisWeek: number;
  unassignedJobs: number;
  updatedAt: string;
}

export default function HealthPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [lastRun, setLastRun] = useState<WorkerRunResult | null>(null);
  const [branchMetrics, setBranchMetrics] = useState<BranchMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
    fetchLastRun();
    fetchBranchMetrics();
  }, []);

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
    }
  };

  const fetchLastRun = async () => {
    try {
      // Try to get last run from WorkerRunLog via API
      // For now, we'll just check if there's a last run in state
      // In a real implementation, you'd fetch from /api/admin/workers/runs
    } catch (err) {
      // Ignore - no runs yet
    }
  };

  const fetchBranchMetrics = async () => {
    try {
      // Fetch branch metrics from the metrics overview API
      const res = await fetch('/api/admin/metrics/overview');
      const data = await res.json();
      if (data.kpis) {
        setBranchMetrics({
          jobsToday: data.kpis.jobsToday,
          jobsThisWeek: data.kpis.jobsThisWeek,
          revenueThisWeek: data.kpis.revenueThisWeek,
          unassignedJobs: data.kpis.unassignedJobs,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      // Ignore - metrics will appear after first run
    }
  };

  const handleRunOpsJob = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/ops/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranchId || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setLastRun(data);
        setSuccess('Ops job completed successfully!');
        // Refresh metrics
        fetchBranchMetrics();
      } else {
        throw new Error(data.error || 'Failed to run ops job');
      }
    } catch (err: any) {
      console.error('Error running ops job:', err);
      setError(err.message || 'Failed to run ops job');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const hasIntegrityIssues = lastRun?.integrity
    ? Object.values(lastRun.integrity).some((count) => count > 0)
    : false;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health Monitor</h1>
          <p className="text-gray-600 mt-1">
            Background jobs, data integrity, and risk signals
          </p>
        </div>

        {/* Last Run Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Run Summary</h2>
          {lastRun ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lastRun.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span
                    className={`font-medium ${
                      lastRun.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {lastRun.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(lastRun.finishedAt).toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {formatDuration(lastRun.durationMs)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Started</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(lastRun.startedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Finished</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(lastRun.finishedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Branch</p>
                  <p className="font-semibold text-gray-900">
                    {branches.find((b) => b.id === lastRun.branchId)?.name || lastRun.branchId}
                  </p>
                </div>
              </div>
              {lastRun.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{lastRun.error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No runs yet</p>
              <p className="text-sm mt-1">Run an ops job to see results here</p>
            </div>
          )}
        </div>

        {/* Run Ops Job Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Run Ops Job</h2>
          <div className="space-y-4">
            {branches.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handleRunOpsJob}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Run Full Ops Job Now
                </>
              )}
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Data Integrity Panel */}
        {lastRun?.integrity && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Integrity</h2>
            <div className="space-y-3">
              {hasIntegrityIssues ? (
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                    Issues Detected
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    All Clear
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Orphan Jobs</p>
                  <p
                    className={`text-lg font-semibold ${
                      lastRun.integrity.orphanJobs > 0 ? 'text-amber-600' : 'text-gray-900'
                    }`}
                  >
                    {lastRun.integrity.orphanJobs}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jobs Without Branch</p>
                  <p
                    className={`text-lg font-semibold ${
                      lastRun.integrity.jobsWithoutBranch > 0 ? 'text-amber-600' : 'text-gray-900'
                    }`}
                  >
                    {lastRun.integrity.jobsWithoutBranch}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cleaners Without Branch</p>
                  <p
                    className={`text-lg font-semibold ${
                      lastRun.integrity.cleanersWithoutBranch > 0
                        ? 'text-amber-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {lastRun.integrity.cleanersWithoutBranch}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jobs With Missing Cleaner</p>
                  <p
                    className={`text-lg font-semibold ${
                      lastRun.integrity.jobsWithMissingCleaner > 0
                        ? 'text-amber-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {lastRun.integrity.jobsWithMissingCleaner}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Branch Metrics Snapshot */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Metrics Snapshot</h2>
          {branchMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-500">Jobs Today</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {branchMetrics.jobsToday}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-500">Jobs This Week</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {branchMetrics.jobsThisWeek}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-500">Revenue This Week</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(branchMetrics.revenueThisWeek)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-xs text-gray-500">Unassigned Jobs</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {branchMetrics.unassignedJobs}
                    </p>
                  </div>
                </div>
              </div>
              {/* Financial Metrics (from ops job) */}
              {lastRun?.metrics?.financial && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Financial Metrics (Last 30 Days)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-500">Gross Revenue</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(lastRun.metrics.financial.totalGrossRevenue)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500">Branch Profit</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(lastRun.metrics.financial.totalBranchProfit)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-500">Profit Margin</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(lastRun.metrics.financial.branchMargin * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Metrics will appear after the first ops job run</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

