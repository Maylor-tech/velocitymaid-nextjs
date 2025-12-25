'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import FormRow from './FormRow';

interface RequestChangeModalProps {
  jobId: string;
  currentDate?: string;
  currentTime?: string;
  currentAddress?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestChangeModal({
  jobId,
  currentDate,
  currentTime,
  currentAddress,
  onClose,
  onSuccess,
}: RequestChangeModalProps) {
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/customer/jobs/${jobId}/request-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: newDate || undefined,
          newStartTime: newStartTime || undefined,
          newDuration: newDuration ? parseInt(newDuration) : undefined,
          newAddress: newAddress || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit change request');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Request change error:', err);
      setError(err.message || 'Failed to submit change request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Request Change</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Changes must be requested at least 4 hours before your appointment.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormRow label="New Date" helpText="Leave blank to keep current date">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </FormRow>

          <FormRow label="New Start Time" helpText="Leave blank to keep current time">
            <input
              type="time"
              value={newStartTime}
              onChange={(e) => setNewStartTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </FormRow>

          <FormRow label="New Duration (hours)" helpText="Leave blank to keep current duration">
            <input
              type="number"
              min="1"
              max="8"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </FormRow>

          <FormRow label="New Address" helpText="Leave blank to keep current address">
            <textarea
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={currentAddress || 'Enter new address'}
            />
          </FormRow>

          <FormRow label="Notes" helpText="Any additional information about your change request">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Tell us about your change request..."
            />
          </FormRow>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

















