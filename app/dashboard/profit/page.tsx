'use client';

// TODO: Protect this route with admin authentication
// import { useAuth } from '@/hooks/useAuth';
// if (!isAdmin) {
//   redirect('/');
// }

import { useState, useEffect } from 'react';
import RangeSelector, { DateRange } from './components/RangeSelector';
import ProfitKpiCard from './components/ProfitKpiCard';
import BranchComparison from './components/BranchComparison';
import RevenueTrendChart from './components/RevenueTrendChart';
import BranchBreakdownTable from './components/BranchBreakdownTable';

interface ProfitabilityData {
  revenue: {
    new_jersey: { jobs: number; revenue: number };
    vermont: { jobs: number; revenue: number };
  };
  averages: {
    new_jersey: { avgRevenuePerJob: number };
    vermont: { avgRevenuePerJob: number };
  };
  trends: {
    dates: string[];
    new_jersey: number[];
    vermont: number[];
  };
  profitability: {
    new_jersey: {
      revenue: number;
      costEstimate: number;
      profit: number;
      margin: number;
    };
    vermont: {
      revenue: number;
      costEstimate: number;
      profit: number;
      margin: number;
    };
  };
}

export default function BranchProfitabilityPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>('month');
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfitabilityData();
  }, [selectedRange]);

  const fetchProfitabilityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/dashboard/profit?range=${selectedRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profitability data');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      console.error('Error fetching profitability data:', err);
      setError(err.message || 'Failed to load profitability data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading profitability data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">Error loading profitability data</p>
            <p className="text-red-500 text-sm mt-2">{error}</p>
            <button
              onClick={fetchProfitabilityData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { revenue, averages, trends, profitability } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">Branch Profitability — VelocityMaid</h1>
          <p className="text-blue-100 text-sm">Financial and operational metrics by branch</p>
        </div>

        {/* Range Selector */}
        <RangeSelector selectedRange={selectedRange} onRangeChange={setSelectedRange} />

        {/* Top Summary Cards - New Jersey */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <ProfitKpiCard
            title="NJ Revenue"
            value={profitability.new_jersey.revenue}
            subtitle={`${revenue.new_jersey.jobs} jobs`}
          />
          <ProfitKpiCard
            title="NJ Cost Estimate"
            value={profitability.new_jersey.costEstimate}
            subtitle="Estimated costs"
          />
          <ProfitKpiCard
            title="NJ Profit"
            value={profitability.new_jersey.profit}
            subtitle="Net profit"
            isProfit
            isNegative={profitability.new_jersey.profit < 0}
          />
          <ProfitKpiCard
            title="NJ Margin"
            value={`${profitability.new_jersey.margin.toFixed(1)}%`}
            subtitle="Profit margin"
            isProfit
            isNegative={profitability.new_jersey.margin < 0}
          />
        </div>

        {/* Top Summary Cards - Vermont */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <ProfitKpiCard
            title="VT Revenue"
            value={profitability.vermont.revenue}
            subtitle={`${revenue.vermont.jobs} jobs`}
          />
          <ProfitKpiCard
            title="VT Cost Estimate"
            value={profitability.vermont.costEstimate}
            subtitle="Estimated costs"
          />
          <ProfitKpiCard
            title="VT Profit"
            value={profitability.vermont.profit}
            subtitle="Net profit"
            isProfit
            isNegative={profitability.vermont.profit < 0}
          />
          <ProfitKpiCard
            title="VT Margin"
            value={`${profitability.vermont.margin.toFixed(1)}%`}
            subtitle="Profit margin"
            isProfit
            isNegative={profitability.vermont.margin < 0}
          />
        </div>

        {/* Branch Comparison */}
        <BranchComparison
          newJersey={{
            jobs: revenue.new_jersey.jobs,
            revenue: revenue.new_jersey.revenue,
            avgRevenuePerJob: averages.new_jersey.avgRevenuePerJob,
            profit: profitability.new_jersey.profit,
            margin: profitability.new_jersey.margin,
          }}
          vermont={{
            jobs: revenue.vermont.jobs,
            revenue: revenue.vermont.revenue,
            avgRevenuePerJob: averages.vermont.avgRevenuePerJob,
            profit: profitability.vermont.profit,
            margin: profitability.vermont.margin,
          }}
        />

        {/* Revenue Trend Chart */}
        <RevenueTrendChart
          dates={trends.dates}
          newJersey={trends.new_jersey}
          vermont={trends.vermont}
        />

        {/* Branch Breakdown Table */}
        <BranchBreakdownTable
          newJersey={{
            jobs: revenue.new_jersey.jobs,
            revenue: profitability.new_jersey.revenue,
            costEstimate: profitability.new_jersey.costEstimate,
            profit: profitability.new_jersey.profit,
            margin: profitability.new_jersey.margin,
          }}
          vermont={{
            jobs: revenue.vermont.jobs,
            revenue: profitability.vermont.revenue,
            costEstimate: profitability.vermont.costEstimate,
            profit: profitability.vermont.profit,
            margin: profitability.vermont.margin,
          }}
        />
      </div>
    </div>
  );
}




