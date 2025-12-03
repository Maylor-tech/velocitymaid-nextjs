'use client';

// TODO: Protect this route with admin authentication

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { getBranchBySlug } from '@/utils/branchData';
import type { Branch } from '@/utils/branchData';
import AdminLayout from '../../../components/AdminLayout';

export default function BranchProfitabilityPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (slug) {
      fetchBranchData();
    }
  }, [slug]);

  useEffect(() => {
    if (branch) {
      fetchMetrics();
    }
  }, [branch, dateRange, customStart, customEnd]);

  const fetchBranchData = () => {
    const branchData = getBranchBySlug(slug);
    setBranch(branchData);
    setLoading(false);
  };

  const fetchMetrics = async () => {
    if (!branch) return;

    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();

      if (dateRange === 'custom') {
        if (customStart && customEnd) {
          startDate = new Date(customStart);
          endDate.setTime(new Date(customEnd).getTime() + 24 * 60 * 60 * 1000 - 1);
        } else {
          setLoading(false);
          return; // Wait for custom dates
        }
      } else {
        const days = parseInt(dateRange);
        startDate.setDate(endDate.getDate() - days);
      }

      // Build query params
      const params = new URLSearchParams();
      params.set('range', dateRange);
      if (dateRange === 'custom' && customStart && customEnd) {
        params.set('start', customStart);
        params.set('end', customEnd);
      }

      // Fetch metrics from API
      const response = await fetch(`/api/admin/branches/${branch.slug}/profitability?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      } else {
        console.error('Failed to fetch metrics:', data.error);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !branch) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {branch.name} — Profitability
          </h1>
          <p className="text-gray-600">{branch.city}, {branch.state}</p>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            {(['7', '30', '90'] as const).map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Last {days} days
              </button>
            ))}
            <button
              onClick={() => setDateRange('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Custom
            </button>
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${metrics.revenue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Profit</p>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  ${metrics.profit.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {metrics.margin.toFixed(1)}% margin
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Job Volume</p>
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.jobVolume}</p>
                <p className="text-sm text-gray-500 mt-1">completed jobs</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-600">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                  <Users className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.retentionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-1">customers with ≥2 jobs</p>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cost Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Labour Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${metrics.labourCost.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Incentives</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${metrics.incentives.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bonuses</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${metrics.bonuses.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Top Customers & Cleaners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Customers */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Customers</h2>
                <div className="space-y-3">
                  {metrics.topCustomers.map((customer: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.jobs} jobs</p>
                      </div>
                      <p className="font-semibold text-gray-900">${customer.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Cleaners */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Cleaners</h2>
                <div className="space-y-3">
                  {metrics.topCleaners.map((cleaner: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{cleaner.name}</p>
                        <p className="text-sm text-gray-500">{cleaner.jobs} jobs</p>
                      </div>
                      <p className="font-semibold text-gray-900">${cleaner.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

