"use client";

/**
 * Phase 2C: Cleaner Earnings View
 * 
 * 🔒 Phase 2C locked — UI is display-only
 * 
 * Displays completed jobs and earnings totals for authenticated cleaner
 * 
 * Rules:
 * - Read-only: No editing or assignment logic
 * - Shows jobs with status === "COMPLETED"
 * - Shows paymentStatus for each job
 * - Calculates lifetime, month, and week totals
 */

import { useEffect, useState } from 'react';
import { Loader2, DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';
import { PayoutStatusCard } from '@/components/cleaner/PayoutStatusCard';

interface Job {
  id: string;
  createdAt: string;
  serviceType: string | null;
  totalPrice: number;
  paymentStatus: string;
  currency: string;
  payoutStatus?: string | null;
  payoutAmount?: number | null;
  payoutPaidAt?: string | null;
}

interface EarningsData {
  jobs: Job[];
  totals: {
    lifetimeTotal: number;
    monthTotal: number;
    weekTotal: number;
  };
  payouts?: {
    readyTotal: number;
    paidTotal: number;
    items: Array<{
      id: string;
      jobId: string;
      status: string;
      amount: number;
      currency: string;
      paidAt: string | null;
      createdAt: string;
    }>;
  };
}

export default function CleanerEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/cleaner/earnings');
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || 'Failed to load earnings');
      }
    } catch (err: any) {
      console.error('Error fetching earnings:', err);
      setError(err.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'FAILED':
        return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Failed
        </span>
      );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading earnings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchEarnings}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600">No earnings data available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings</h1>
          <p className="text-gray-600">View your completed jobs and earnings</p>
        </div>

        {/* Payout summary from JobPayout records */}
        {data.payouts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Ready to Pay</h3>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(data.payouts.readyTotal)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting admin manual payout
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Paid Out</h3>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(data.payouts.paidTotal)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Marked PAID by admin</p>
            </div>
          </div>
        )}

        {/* Payout Status Card */}
        <div className="mb-6">
          <PayoutStatusCard />
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-500">Lifetime Total</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totals.lifetimeTotal)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-green-600" />
              <h3 className="text-sm font-medium text-gray-500">This Month</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totals.monthTotal)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-purple-600" />
              <h3 className="text-sm font-medium text-gray-500">Last 7 Days</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.totals.weekTotal)}
            </p>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Completed Jobs</h2>
            <p className="text-sm text-gray-500 mt-1">
              {data.jobs.length} {data.jobs.length === 1 ? 'job' : 'jobs'} completed
            </p>
          </div>

          {data.jobs.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No completed jobs yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Completed jobs will appear here once you finish assignments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.serviceType || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(job.totalPrice, job.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.payoutStatus ? (
                          <span className="inline-flex flex-col gap-0.5">
                            <span>{job.payoutStatus}</span>
                            {job.payoutAmount != null && (
                              <span className="text-xs text-gray-500">
                                {formatCurrency(job.payoutAmount, job.currency)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(job.paymentStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
