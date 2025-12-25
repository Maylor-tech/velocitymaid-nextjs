'use client';

// TODO: Protect this route with admin authentication

import { useState, useEffect } from 'react';
import PayoutFilters from './components/PayoutFilters';
import PayoutKpis from './components/PayoutKpis';
import PayoutsTable from './components/PayoutsTable';
import PayoutDetailModal from './components/PayoutDetailModal';
import type { CleanerPayout, PayoutStatus, PaymentMethod } from '../../../utils/payoutData';
import type { ServiceRegion } from '../../../utils/reviewData';

export default function PayoutsDashboardPage() {
  const [payouts, setPayouts] = useState<CleanerPayout[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<CleanerPayout | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<ServiceRegion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set default to last week
    const getLastWeekRange = () => {
      const now = new Date();
      const day = now.getDay();
      const daysToLastMonday = day === 0 ? 6 : day - 1;
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToLastMonday - 7);
      lastMonday.setHours(0, 0, 0, 0);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);
      return {
        start: lastMonday.toISOString().split('T')[0],
        end: lastSunday.toISOString().split('T')[0],
      };
    };

    const range = getLastWeekRange();
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
  }, []);

  useEffect(() => {
    if (periodStart && periodEnd) {
      fetchPayouts();
    }
  }, [periodStart, periodEnd, statusFilter, branchFilter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (periodStart) params.append('periodStart', periodStart);
      if (periodEnd) params.append('periodEnd', periodEnd);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (branchFilter) params.append('branch', branchFilter);

      const response = await fetch(`/api/payouts/list?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPayouts(data.payouts);
      } else {
        throw new Error(data.error || 'Failed to fetch payouts');
      }
    } catch (err: any) {
      console.error('Error fetching payouts:', err);
      setError(err.message || 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayout = async (
    payoutId: string,
    updates: {
      status?: PayoutStatus;
      deductions?: number;
      paymentMethod?: PaymentMethod | null;
      paymentReference?: string | null;
    }
  ) => {
    try {
      const response = await fetch('/api/payouts/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payoutId,
          ...updates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchPayouts();
        setSelectedPayout(null);
      } else {
        throw new Error(data.error || 'Failed to update payout');
      }
    } catch (err: any) {
      console.error('Error updating payout:', err);
      alert(err.message || 'Failed to update payout');
      throw err;
    }
  };

  const handleApprove = async (payoutId: string) => {
    await handleUpdatePayout(payoutId, { status: 'approved' });
  };

  const handleMarkPaid = async (payoutId: string) => {
    await handleUpdatePayout(payoutId, { status: 'paid' });
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (periodStart) params.append('periodStart', periodStart);
    if (periodEnd) params.append('periodEnd', periodEnd);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (branchFilter) params.append('branch', branchFilter);

    window.open(`/api/payouts/export?${params.toString()}`, '_blank');
  };

  // Calculate KPIs
  const totalNetPayouts = payouts.reduce((sum, p) => sum + p.netPayout, 0);
  const njTotal = payouts.filter(p => p.branch === 'new_jersey').reduce((sum, p) => sum + p.netPayout, 0);
  const vtTotal = payouts.filter(p => p.branch === 'vermont').reduce((sum, p) => sum + p.netPayout, 0);
  const cleanersCount = new Set(payouts.map(p => p.cleanerId)).size;
  const avgPayout = cleanersCount > 0 ? totalNetPayouts / cleanersCount : 0;

  if (loading && !payouts.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading payouts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-6 px-6 rounded-xl shadow-lg mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cleaner Payouts — Weekly Earnings & Approvals</h1>
            <p className="text-green-100 text-sm">Manage and approve cleaner payouts</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Export CSV
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* KPIs */}
        <PayoutKpis
          totalNetPayouts={totalNetPayouts}
          njTotal={njTotal}
          vtTotal={vtTotal}
          cleanersCount={cleanersCount}
          avgPayout={avgPayout}
        />

        {/* Filters */}
        {periodStart && periodEnd && (
          <PayoutFilters
            periodStart={periodStart}
            periodEnd={periodEnd}
            status={statusFilter}
            branch={branchFilter}
            onPeriodChange={(start, end) => {
              setPeriodStart(start);
              setPeriodEnd(end);
            }}
            onStatusChange={setStatusFilter}
            onBranchChange={setBranchFilter}
          />
        )}

        {/* Payouts Table */}
        <PayoutsTable
          payouts={payouts}
          onViewPayout={setSelectedPayout}
          onApprove={handleApprove}
          onMarkPaid={handleMarkPaid}
        />

        {/* Payout Detail Modal */}
        {selectedPayout && (
          <PayoutDetailModal
            payout={selectedPayout}
            onClose={() => setSelectedPayout(null)}
            onUpdate={handleUpdatePayout}
          />
        )}
      </div>
    </div>
  );
}




