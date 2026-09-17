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

interface TipItem {
  id: string;
  jobId: string | null;
  amount: number;
  currency: string;
  status: string;
  receivedAt: string | null;
  paidOutAt: string | null;
  createdAt: string;
}

interface EarningsData {
  jobs: Job[];
  totals: {
    lifetimeTotal: number;
    monthTotal: number;
    weekTotal: number;
    serviceEarnings?: number;
    tips?: number;
    total?: number;
  };
  tips?: {
    receivedTotal: number;
    paidOutTotal: number;
    items: TipItem[];
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
    } catch (err: unknown) {
      console.error('Error fetching earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
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
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-vm-success-bg text-vm-success">
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-vm-warning-bg text-yellow-800">
            Pending
          </span>
        );
      case 'FAILED':
        return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-vm-danger-bg text-red-800">
          Failed
        </span>
      );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-vm-text">
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
            <p className="mt-4 text-vm-muted">Loading earnings...</p>
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
              className="mt-4 px-4 py-2 bg-vm-danger text-white rounded-lg hover:bg-vm-danger"
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
            <p className="text-vm-muted">No earnings data available.</p>
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
          <h1 className="text-3xl font-bold text-vm-text mb-2">Earnings</h1>
          <p className="text-vm-muted">View your completed jobs and earnings</p>
        </div>

        {/* Payout summary from JobPayout records */}
        {data.payouts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6">
              <h3 className="text-sm font-medium text-vm-muted mb-1">Ready to Pay</h3>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(data.payouts.readyTotal)}
              </p>
              <p className="text-xs text-vm-muted mt-1">
                Awaiting admin manual payout
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-vm-success/30 p-6">
              <h3 className="text-sm font-medium text-vm-muted mb-1">Paid Out</h3>
              <p className="text-2xl font-bold text-vm-success">
                {formatCurrency(data.payouts.paidTotal)}
              </p>
              <p className="text-xs text-vm-muted mt-1">Marked PAID by admin</p>
            </div>
          </div>
        )}

        {/* Payout Status Card */}
        <div className="mb-6">
          <PayoutStatusCard />
        </div>

        {/* Service | Tips | Total */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h3 className="text-sm font-medium text-vm-muted">Service earnings</h3>
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(
                data.totals.serviceEarnings ?? data.totals.lifetimeTotal
              )}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-vm-success" />
              <h3 className="text-sm font-medium text-vm-muted">Tips</h3>
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.totals.tips ?? data.tips?.receivedTotal ?? 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-vm-text" />
              <h3 className="text-sm font-medium text-vm-muted">Total</h3>
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(
                data.totals.total ??
                  (data.totals.serviceEarnings ?? data.totals.lifetimeTotal) +
                    (data.totals.tips ?? data.tips?.receivedTotal ?? 0)
              )}
            </p>
          </div>
        </div>

        {/* Period snapshots (service payouts only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-vm-success" />
              <h3 className="text-sm font-medium text-vm-muted">
                Service — this month
              </h3>
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.totals.monthTotal)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-vm-muted" />
              <h3 className="text-sm font-medium text-vm-muted">
                Service — last 7 days
              </h3>
            </div>
            <p className="text-2xl font-bold text-vm-text">
              {formatCurrency(data.totals.weekTotal)}
            </p>
          </div>
        </div>

        {/* Tips list */}
        {data.tips && data.tips.items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-vm-text">Tips</h2>
              <p className="text-sm text-vm-muted mt-1">
                Guest tips owed to you (RECEIVED / PAID_OUT only)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.tips.items.map((tip) => (
                    <tr key={tip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-text">
                        {formatDate(tip.receivedAt || tip.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-vm-text">
                        {formatCurrency(tip.amount, tip.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-text">
                        {tip.status === 'PAID_OUT' ? 'PAID_OUT' : 'RECEIVED'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-vm-text">Completed Jobs</h2>
            <p className="text-sm text-vm-muted mt-1">
              {data.jobs.length} {data.jobs.length === 1 ? 'job' : 'jobs'} completed
            </p>
          </div>

          {data.jobs.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-vm-muted mx-auto mb-4" />
              <p className="text-vm-muted">No completed jobs yet</p>
              <p className="text-sm text-vm-muted mt-2">
                Completed jobs will appear here once you finish assignments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Service Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Service payout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Payment Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-text">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-text">
                        {job.serviceType || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-text">
                        {job.payoutAmount != null ? (
                          <span className="inline-flex flex-col gap-0.5">
                            <span className="font-medium">
                              {formatCurrency(job.payoutAmount, job.currency)}
                            </span>
                            {job.payoutStatus && (
                              <span className="text-xs text-vm-muted">
                                {job.payoutStatus}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-vm-muted">—</span>
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
