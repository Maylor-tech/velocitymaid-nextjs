'use client';

import { useState } from 'react';
import type { Complaint, ComplaintStatus, ResolutionType } from '../../../../utils/complaintData';
import LocationBadge from '../../../cleaners/components/LocationBadge';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onUpdate: (complaintId: string, updates: {
    status?: ComplaintStatus;
    resolutionType?: ResolutionType | null;
    adminNotes?: string;
  }) => Promise<void>;
}

export default function ComplaintDetailModal({
  complaint,
  onClose,
  onUpdate,
}: ComplaintDetailModalProps) {
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [resolutionType, setResolutionType] = useState<ResolutionType | '' | null>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  if (!complaint) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`text-2xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleUpdate = async () => {
    if (!complaint) return;

    setUpdating(true);
    try {
      const updates: {
        status?: ComplaintStatus;
        resolutionType?: ResolutionType | null;
        adminNotes?: string;
      } = {};

      if (status && status !== complaint.status) {
        updates.status = status as ComplaintStatus;
      }

      if (resolutionType !== complaint.resolutionType) {
        updates.resolutionType = resolutionType as ResolutionType | null;
      }

      if (adminNotes.trim() !== (complaint.adminNotes || '')) {
        updates.adminNotes = adminNotes.trim() || undefined;
      }

      if (Object.keys(updates).length > 0) {
        await onUpdate(complaint.id, updates);
      }

      onClose();
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Complaint Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Complaint ID</p>
              <p className="font-mono text-sm text-gray-900">{complaint.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-medium text-gray-900 capitalize">{complaint.status.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Job ID</p>
              <p className="font-mono text-sm text-gray-900">{complaint.jobId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Location</p>
              <LocationBadge location={complaint.serviceLocation} />
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-medium text-gray-900">{complaint.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="text-gray-900">{complaint.customerPhone}</p>
              </div>
            </div>
          </div>

          {/* Review Info */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Review Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">Rating</p>
                {renderStars(complaint.rating)}
              </div>
              {complaint.comment && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Comment</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{complaint.comment}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Re-clean Requested</p>
                <p className="text-gray-900">
                  {complaint.requestReclean ? (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      Yes
                    </span>
                  ) : (
                    <span className="text-gray-400">No</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Complaint Created:</span>
                <span className="text-gray-900">{formatDate(complaint.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-900">{formatDate(complaint.updatedAt)}</span>
              </div>
              {complaint.resolvedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Resolved:</span>
                  <span className="text-green-600 font-medium">{formatDate(complaint.resolvedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Update Form */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Update Complaint</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={status || complaint.status}
                  onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Type</label>
                <select
                  value={resolutionType !== '' ? resolutionType || '' : complaint.resolutionType || ''}
                  onChange={(e) => setResolutionType((e.target.value || null) as ResolutionType | null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">— Select —</option>
                  <option value="reclean">Re-clean</option>
                  <option value="refund_partial">Partial Refund</option>
                  <option value="refund_full">Full Refund</option>
                  <option value="credit">Credit</option>
                  <option value="no_issue">No Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes || complaint.adminNotes || ''}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Add notes about resolution steps, customer communication, etc."
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

