"use client";

import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface AddIncentiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  cleanerId: string;
  onSuccess: () => void;
}

type IncentiveType =
  | 'ON_TIME_STREAK'
  | 'HIGH_RATING_BONUS'
  | 'ELITE_LEVEL_BONUS'
  | 'COMPLAINT_FREE_BONUS'
  | 'HOLIDAY_BONUS';

const INCENTIVE_TYPES: { value: IncentiveType; label: string }[] = [
  { value: 'ON_TIME_STREAK', label: 'On-time Streak' },
  { value: 'HIGH_RATING_BONUS', label: 'High Rating Bonus' },
  { value: 'ELITE_LEVEL_BONUS', label: 'Elite Level Bonus' },
  { value: 'COMPLAINT_FREE_BONUS', label: 'Complaint-free Bonus' },
  { value: 'HOLIDAY_BONUS', label: 'Holiday Bonus' },
];

export default function AddIncentiveModal({
  isOpen,
  onClose,
  cleanerId,
  onSuccess,
}: AddIncentiveModalProps) {
  const [type, setType] = useState<IncentiveType>('HIGH_RATING_BONUS');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'EARNED'>('PENDING');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cleaners/${cleanerId}/incentives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          currency,
          description: description || undefined,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create incentive');
      }

      onSuccess();
      onClose();
      // Reset form
      setAmount('');
      setDescription('');
      setStatus('PENDING');
    } catch (err: any) {
      console.error('Error creating incentive:', err);
      setError(err.message || 'Failed to create incentive');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add Incentive</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incentive Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IncentiveType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {INCENTIVE_TYPES.map((it) => (
                <option key={it.value} value={it.value}>
                  {it.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="JMD">JMD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'PENDING' | 'EARNED')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="PENDING">Pending</option>
              <option value="EARNED">Earned</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Add Incentive
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
















