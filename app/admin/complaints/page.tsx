"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Filter,
  X,
} from 'lucide-react';

interface Complaint {
  id: string;
  jobId: string;
  cleanerId: string;
  cleanerName?: string;
  customerId: string;
  severity: number;
  status: 'OPEN' | 'RESOLVED';
  notes?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    customerName: string;
    address: string;
  };
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, severityFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);

      const res = await fetch(`/api/admin/complaints?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setComplaints(data.complaints || []);
      } else {
        throw new Error(data.error || 'Failed to load complaints');
      }
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (complaintId: string) => {
    if (!confirm('Mark this complaint as resolved?')) return;

    try {
      const res = await fetch(`/api/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });

      if (!res.ok) throw new Error('Failed to resolve complaint');
      fetchComplaints();
    } catch (err: any) {
      console.error('Error resolving complaint:', err);
      alert('Failed to resolve complaint. Please try again.');
    }
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 4)
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
          Critical ({severity})
        </span>
      );
    if (severity === 3)
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
          High ({severity})
        </span>
      );
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
        Medium ({severity})
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'RESOLVED')
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
          Resolved
        </span>
      );
    return (
      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
        Open
      </span>
    );
  };

  const calculatePenalty = (severity: number): string => {
    if (severity <= 2) return 'No penalty';
    if (severity === 3) return '-5 score';
    if (severity === 4) return '-10 score';
    return 'Auto-flag cleaner';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Complaint Management</h1>
            <p className="text-gray-600 mt-1">Track and resolve customer complaints</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="1">1 - Low</option>
              <option value="2">2 - Medium</option>
              <option value="3">3 - High</option>
              <option value="4">4 - Critical</option>
              <option value="5">5 - Urgent</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading complaints...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Complaints Table */}
        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {complaints.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No complaints found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cleaner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {complaint.jobId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {complaint.cleanerName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getSeverityBadge(complaint.severity)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(complaint.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setIsDetailModalOpen(true);
                            }}
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            View
                          </button>
                          {complaint.status === 'OPEN' && (
                            <button
                              onClick={() => handleResolve(complaint.id)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Complaint Detail Modal */}
        {isDetailModalOpen && selectedComplaint && (
          <ComplaintDetailModal
            complaint={selectedComplaint}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedComplaint(null);
            }}
            onResolve={() => {
              handleResolve(selectedComplaint.id);
              setIsDetailModalOpen(false);
              setSelectedComplaint(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Complaint Detail Modal Component
function ComplaintDetailModal({
  complaint,
  onClose,
  onResolve,
}: {
  complaint: Complaint;
  onClose: () => void;
  onResolve: () => void;
}) {
  const getSeverityBadge = (severity: number) => {
    if (severity >= 4)
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
          Critical ({severity})
        </span>
      );
    if (severity === 3)
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
          High ({severity})
        </span>
      );
    return (
      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
        Medium ({severity})
      </span>
    );
  };

  const calculatePenalty = (severity: number): string => {
    if (severity <= 2) return 'No penalty';
    if (severity === 3) return '-5 score';
    if (severity === 4) return '-10 score';
    return 'Auto-flag cleaner';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Complaint Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Job ID</p>
              <p className="text-sm font-medium text-gray-900">{complaint.jobId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cleaner</p>
              <p className="text-sm font-medium text-gray-900">
                {complaint.cleanerName || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Severity</p>
              <div className="mt-1">{getSeverityBadge(complaint.severity)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-sm font-medium text-gray-900">{complaint.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Auto Penalty</p>
              <p className="text-sm font-medium text-red-600">{calculatePenalty(complaint.severity)}</p>
            </div>
          </div>

          {complaint.notes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{complaint.notes}</p>
              </div>
            </div>
          )}

          {complaint.resolutionNotes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Resolution Notes</p>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{complaint.resolutionNotes}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <a
              href={`/admin/cleaners/${complaint.cleanerId}`}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              View Cleaner Profile →
            </a>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          {complaint.status === 'OPEN' && (
            <button
              onClick={onResolve}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}















