"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Eye, Filter } from 'lucide-react';
import {
  CLEANER_APPLICATION_STATUS_LABELS,
  isOpenCleanerApplication,
} from '@/lib/cleaners/applicationStatus';

interface CleanerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  experienceLevel: string | null;
  daysAvailable: any;
  notes: string | null;
  status: string;
  createdAt: string;
  Branch: {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
  };
}

export default function CleanerApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<CleanerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchBranches();
    fetchApplications();
  }, [statusFilter, branchFilter]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches');
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches.map((b: any) => ({ id: b.id, name: b.name })));
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (branchFilter !== 'all') {
        params.append('branchId', branchFilter);
      }

      const response = await fetch(`/api/admin/cleaners/applications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
      } else {
        throw new Error(data.error || 'Failed to fetch applications');
      }
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this application and create a user account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/cleaners/applications/${id}/approve`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setToastMessage('Application approved and user account created');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        fetchApplications();
      } else {
        throw new Error(data.error || 'Failed to approve application');
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to approve application');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this application?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/cleaners/applications/${id}/reject`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setToastMessage('Application rejected');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        fetchApplications();
      } else {
        throw new Error(data.error || 'Failed to reject application');
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to reject application');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'APPROVED':
        return 'bg-vm-success-bg text-vm-success';
      case 'REJECTED':
        return 'bg-vm-danger-bg text-red-800';
      case 'REVIEWING':
      case 'TRAINING_INVITED':
        return 'bg-vm-cyan-tint text-vm-navy';
      default:
        return 'bg-vm-warning-bg text-yellow-800';
    }
  };

  const statusLabel = (status: string) =>
    CLEANER_APPLICATION_STATUS_LABELS[status] || status;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-vm-muted">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-vm-text mb-2">Cleaner Applications</h1>
          <p className="text-vm-muted">Review and manage cleaner applications</p>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              toastType === 'success' ? 'bg-vm-success text-white' : 'bg-vm-danger text-white'
            }`}
          >
            {toastMessage}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-vm-text mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All</option>
              <option value="NEW">New</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="TRAINING_INVITED">Training invited</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="APPROVED">Approved (legacy)</option>
              <option value="PENDING">Pending (legacy)</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-vm-text mb-1">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Applications Table */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-vm-muted">No applications found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-vm-text">{app.name}</div>
                      <div className="text-sm text-vm-muted">{app.email}</div>
                      <div className="text-sm text-vm-muted">{app.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-vm-text">{app.Branch.name}</div>
                      <div className="text-sm text-vm-muted">{app.Branch.city}, {app.Branch.state}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-muted">
                      {app.experienceLevel || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {statusLabel(app.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-muted">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/cleaners/applications/${app.id}`}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        {isOpenCleanerApplication(app.status) && (
                          <>
                            <button
                              onClick={() => handleApprove(app.id)}
                              className="p-2 text-vm-success hover:text-vm-success hover:bg-vm-success-bg rounded transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

