'use client';

import { useState } from 'react';
import type { CleanerPayout, PayoutStatus, PaymentMethod } from '../../../../utils/payoutData';
import LocationBadge from '../../../../cleaners/components/LocationBadge';
import { getAllCleaners } from '../../../../utils/cleanerData';

interface PayoutDetailModalProps {
  payout: CleanerPayout | null;
  onClose: () => void;
  onUpdate: (payoutId: string, updates: {
    status?: PayoutStatus;
    deductions?: number;
    paymentMethod?: PaymentMethod | null;
    paymentReference?: string | null;
  }) => Promise<void>;
}

export default function PayoutDetailModal({
  payout,
  onClose,
  onUpdate,
}: PayoutDetailModalProps) {
  const [status, setStatus] = useState<PayoutStatus | ''>('');
  const [deductions, setDeductions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | '' | null>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [updating, setUpdating] = useState(false);

  if (!payout) return null;

  const cleaners = getAllCleaners();
  const cleaner = cleaners.find(c => c.id === payout.cleanerId);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const updates: {
        status?: PayoutStatus;
        deductions?: number;
        paymentMethod?: PaymentMethod | null;
        paymentReference?: string | null;
      } = {};

      if (status && status !== payout.status) {
        updates.status = status as PayoutStatus;
      }

      if (deductions !== '' && parseFloat(deductions) !== payout.deductions) {
        updates.deductions = parseFloat(deductions);
      }

      if (paymentMethod !== payout.paymentMethod) {
        updates.paymentMethod = paymentMethod as PaymentMethod | null;
      }

      if (paymentReference.trim() !== (payout.paymentReference || '')) {
        updates.paymentReference = paymentReference.trim() || null;
      }

      if (Object.keys(updates).length > 0) {
        await onUpdate(payout.id, updates);
      }

      onClose();
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update payout');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Payout Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payout Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Payout ID</p>
              <p className="font-mono text-sm text-gray-900">{payout.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-medium text-gray-900 capitalize">{payout.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Cleaner</p>
              <p className="font-medium text-gray-900">{cleaner?.name || payout.cleanerId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Branch</p>
              <LocationBadge location={payout.branch} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Period</p>
              <p className="text-gray-900">{formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}</p>
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Earnings Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                <p className="text-xl font-bold text-gray-900">{payout.totalJobs}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Base Earnings</p>
                <p className="text-xl font-bold text-gray-900">${payout.baseEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Bonus Earnings</p>
                <p className="text-xl font-bold text-green-600">${payout.bonusEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Net Payout</p>
                <p className="text-xl font-bold text-blue-600">${payout.netPayout.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Update Form */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Update Payout</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status || payout.status}
                  onChange={(e) => setStatus(e.target.value as PayoutStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deductions</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deductions || payout.deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod !== '' ? paymentMethod || '' : payout.paymentMethod || ''}
                  onChange={(e) => setPaymentMethod((e.target.value || null) as PaymentMethod | null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">— Select —</option>
                  <option value="manual">Manual</option>
                  <option value="stripe">Stripe</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Reference</label>
                <input
                  type="text"
                  value={paymentReference || payout.paymentReference || ''}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Stripe payout ID, bank reference"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-4 flex gap-3">
            <button
              onClick={handleUpdate}
              disabled={updating}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

