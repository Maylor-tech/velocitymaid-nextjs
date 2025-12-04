"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyConverter';

interface Forecast {
  cleanerId: string;
  cleanerName: string;
  week: string;
  expectedEarnings: number;
  expectedBonuses: {
    jqsBonus: number;
    reviewBonus: number;
    attendanceBonus: number;
    total: number;
  };
  expectedPayout: number;
  jobCount: number;
}

interface ForecastData {
  forecasts: Forecast[];
  weeklyTotals: Array<{
    week: string;
    totalEarnings: number;
    totalBonuses: number;
    totalPayouts: number;
    cleanerCount: number;
    jobCount: number;
  }>;
  totalForecast: {
    totalEarnings: number;
    totalBonuses: number;
    totalPayouts: number;
  };
}

export default function PayoutForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeks, setWeeks] = useState(4);

  useEffect(() => {
    fetchForecast();
  }, [weeks]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/payouts/jamaica/forecast?weeks=${weeks}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch forecast');
      }
    } catch (err: any) {
      console.error('Error fetching forecast:', err);
      setError(err.message || 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating forecast...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Failed to load forecast'}</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payout Forecast</h1>
          <p className="text-gray-600">Expected payouts for Jamaica cleaners</p>
          
          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Forecast Weeks:</label>
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={2}>2 weeks</option>
              <option value={4}>4 weeks</option>
              <option value={8}>8 weeks</option>
            </select>
          </div>
        </div>

        {/* Total Forecast Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Expected Earnings</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totalForecast.totalEarnings, 'JMD')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Expected Bonuses</h3>
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totalForecast.totalBonuses, 'JMD')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Expected Payouts</h3>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totalForecast.totalPayouts, 'JMD')}
            </p>
          </div>
        </div>

        {/* Weekly Totals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Totals</h2>
          <div className="space-y-3">
            {data.weeklyTotals.map((week, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{week.week}</p>
                  <p className="text-sm text-gray-600">
                    {week.cleanerCount} cleaners • {week.jobCount} jobs
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(week.totalPayouts, 'JMD')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(week.totalEarnings, 'JMD')} +{' '}
                    {formatCurrency(week.totalBonuses, 'JMD')} bonuses
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cleaner Forecasts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Forecast by Cleaner</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Cleaner</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Week</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Earnings</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Bonuses</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Jobs</th>
                </tr>
              </thead>
              <tbody>
                {data.forecasts.map((forecast, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {forecast.cleanerName}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{forecast.week}</td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatCurrency(forecast.expectedEarnings, 'JMD')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatCurrency(forecast.expectedBonuses.total, 'JMD')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatCurrency(forecast.expectedPayout, 'JMD')}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{forecast.jobCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

