'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import KpiCard from '@/components/admin/metrics/KpiCard';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Users,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  Building2,
  Activity,
} from 'lucide-react';

interface FinanceOverview {
  branch: {
    id: string;
    name: string;
    slug: string;
  };
  range: {
    from: string;
    to: string;
  };
  kpis: {
    revenueTotal: number;
    jobsCompleted: number;
    jobsCancelled: number;
    averageTicket: number;
    revenuePerJob: number;
    revenuePerCleaner: number | null;
    laborCost: number;
    suppliesCost: number;
    otherCost: number;
    totalCost: number;
    profit: number;
    profitMargin: number;
  };
  trends: {
    revenueByDay: Array<{ date: string; revenue: number }>;
    jobsByDay: Array<{ date: string; jobs: number }>;
  };
  byServiceType: Array<{
    label: string;
    jobs: number;
    revenue: number;
  }>;
  branchesSummary: Array<{
    branchId: string;
    name: string;
    revenue: number;
    profit: number;
  }>;
  health: {
    score: number;
    level: 'CRITICAL' | 'WEAK' | 'STABLE' | 'HEALTHY' | 'EXCELLENT';
    recommendations: string[];
  };
}

export default function ProfitabilityPage() {
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<string>('30d');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/admin/branches');
      const data = await res.json();
      if (data.success && data.branches) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedBranch) params.set('branchId', selectedBranch);
      params.set('range', selectedRange);
      if (selectedRange === 'custom' && customFrom) params.set('from', customFrom);
      if (selectedRange === 'custom' && customTo) params.set('to', customTo);

      const res = await fetch(`/api/admin/finance/overview?${params.toString()}`);
      const json = await res.json();

      if (json.error) {
        throw new Error(json.error);
      }

      setData(json);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching finance overview:', err);
      setError(err.message || 'Unable to load finance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedRange, customFrom, customTo]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedBranch, selectedRange, customFrom, customTo]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHealthColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50';
      case 'WEAK':
        return 'text-orange-600 bg-orange-50';
      case 'STABLE':
        return 'text-yellow-600 bg-yellow-50';
      case 'HEALTHY':
        return 'text-green-600 bg-green-50';
      case 'EXCELLENT':
        return 'text-emerald-600 bg-emerald-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading && !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Loading finance data...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revenue & Profitability</h1>
            <p className="text-gray-600 mt-1">Background jobs, data integrity, and risk signals</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {selectedRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiCard
                label="Revenue"
                value={formatCurrency(data.kpis.revenueTotal)}
                icon={<DollarSign className="w-6 h-6" />}
              />
              <KpiCard
                label="Profit"
                value={formatCurrency(data.kpis.profit)}
                icon={data.kpis.profit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                subtitle={data.kpis.profitMargin >= 0 ? `+${data.kpis.profitMargin.toFixed(1)}% margin` : `${data.kpis.profitMargin.toFixed(1)}% margin`}
              />
              <KpiCard
                label="Profit Margin"
                value={`${data.kpis.profitMargin.toFixed(1)}%`}
                icon={<Activity className="w-6 h-6" />}
              />
              <KpiCard
                label="Jobs Completed"
                value={data.kpis.jobsCompleted}
                icon={<Briefcase className="w-6 h-6" />}
              />
              <KpiCard
                label="Avg Ticket"
                value={formatCurrency(data.kpis.averageTicket)}
                icon={<DollarSign className="w-6 h-6" />}
              />
              <KpiCard
                label="Revenue / Cleaner"
                value={data.kpis.revenuePerCleaner ? formatCurrency(data.kpis.revenuePerCleaner) : 'N/A'}
                icon={<Users className="w-6 h-6" />}
              />
            </div>

            {/* Branch Health Score */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Branch Financial Health</h2>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${getHealthColor(data.health.level)}`}>
                    {data.health.score}
                  </div>
                  <p className="text-center mt-2 text-sm font-medium text-gray-700">{data.health.level}</p>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {data.health.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-primary-600 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cost Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Labor Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.kpis.laborCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Supplies Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.kpis.suppliesCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Other Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.kpis.otherCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.kpis.totalCost)}</p>
                </div>
              </div>
            </div>

            {/* Revenue Trend Chart (Simple) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
              <div className="h-64 flex items-end gap-1">
                {data.trends.revenueByDay.map((day, idx) => {
                  const maxRevenue = Math.max(...data.trends.revenueByDay.map((d) => d.revenue), 1);
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-primary-600 rounded-t hover:bg-primary-700 transition-colors"
                        style={{ height: `${height}%` }}
                        title={`${new Date(day.date).toLocaleDateString()}: ${formatCurrency(day.revenue)}`}
                      />
                      <p className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Service Type Breakdown */}
            {data.byServiceType.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">By Service Type</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jobs
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.byServiceType.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.label || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.jobs}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Branch Comparison */}
            {data.branchesSummary.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Branch Comparison</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.branchesSummary.map((branch) => (
                        <tr key={branch.branchId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {branch.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(branch.revenue)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${branch.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(branch.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}















