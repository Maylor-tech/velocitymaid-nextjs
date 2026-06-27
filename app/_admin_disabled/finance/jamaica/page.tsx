"use client";

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyConverter';

interface RevenueData {
  totalRevenueJMD: number;
  totalRevenueUSD: number;
  totalRevenueCombined: number;
  jobCount: number;
  averageTicketSize: number;
  repeatCustomerRate: number;
  serviceMixDistribution: Array<{ serviceType: string; count: number; revenue: number }>;
  revenueByWeek: Array<{
    week: string;
    revenueJMD: number;
    revenueUSD: number;
    revenueCombined: number;
    jobCount: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenueJMD: number;
    revenueUSD: number;
    revenueCombined: number;
    jobCount: number;
  }>;
}

export default function JamaicaRevenueDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = '/api/admin/finance/jamaica';
      
      if (dateRange === 'month') {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        url += `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      } else if (dateRange === 'week') {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        url += `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch revenue data');
      }
    } catch (err: any) {
      console.error('Error fetching revenue:', err);
      setError(err.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-vm-muted">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Failed to load revenue data'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vm-text mb-2">Jamaica Revenue Dashboard</h1>
          <p className="text-vm-muted">Port Antonio Branch Financial Overview</p>
          
          {/* Date Range Filter */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDateRange('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'all'
                  ? 'bg-vm-navy text-white'
                  : 'bg-white text-vm-text hover:bg-gray-100'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'month'
                  ? 'bg-vm-navy text-white'
                  : 'bg-white text-vm-text hover:bg-gray-100'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'week'
                  ? 'bg-vm-navy text-white'
                  : 'bg-white text-vm-text hover:bg-gray-100'
              }`}
            >
              Last Week
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-vm-muted">Total Revenue (JMD)</h3>
              <DollarSign className="w-5 h-5 text-vm-success" />
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.totalRevenueJMD, 'JMD')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-vm-muted">Total Revenue (USD)</h3>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.totalRevenueUSD, 'USD')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-vm-muted">Combined Revenue</h3>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.totalRevenueCombined, 'JMD')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-vm-muted">Completed Jobs</h3>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-vm-text">{data.jobCount}</p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-vm-text mb-4">Average Ticket Size</h3>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(data.averageTicketSize, 'JMD')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-vm-text mb-4">Repeat Customer Rate</h3>
            <p className="text-3xl font-bold text-vm-success">
              {data.repeatCustomerRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Service Mix */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-vm-text mb-4">Service Mix Distribution</h3>
          <div className="space-y-3">
            {data.serviceMixDistribution.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-vm-text">{service.serviceType}</p>
                  <p className="text-sm text-vm-muted">{service.count} jobs</p>
                </div>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(service.revenue, 'JMD')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-vm-text mb-4">Revenue by Week (Last 12 Weeks)</h3>
            <div className="space-y-2">
              {data.revenueByWeek.slice(-12).map((week, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-vm-muted">{week.week}</span>
                  <span className="font-semibold text-vm-text">
                    {formatCurrency(week.revenueCombined, 'JMD')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-vm-text mb-4">Revenue by Month (Last 12 Months)</h3>
            <div className="space-y-2">
              {data.revenueByMonth.slice(-12).map((month, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-vm-muted">{month.month}</span>
                  <span className="font-semibold text-vm-text">
                    {formatCurrency(month.revenueCombined, 'JMD')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

