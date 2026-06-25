'use client';

import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

interface CancelJobModalProps {
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelJobModal({
  jobId,
  onClose,
  onSuccess,
}: CancelJobModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(true);

  const handleCancel = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/customer/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to cancel job');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Cancel job error:', err);
      setError(err.message || 'Failed to cancel job');
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-vm-text">Cancel Appointment</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-vm-muted hover:text-gray-600 disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Cancellations must be made at least 2 hours before your appointment.
            </p>
          </div>

          <p className="text-vm-muted mb-4">
            Are you sure you want to cancel this appointment? A team member may contact you to confirm.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-vm-text mb-2">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="Let us know why you're cancelling..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-vm-text rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
            >
              Keep Appointment
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConfirmDialog
      title="Cancel Appointment"
      message="Are you sure you want to cancel this appointment? A team member may contact you to confirm."
      confirmLabel="Continue"
      cancelLabel="Keep Appointment"
      onConfirm={() => setShowConfirm(false)}
      onCancel={onClose}
      variant="danger"
    />
  );
}

















