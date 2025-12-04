export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Eye, Award, MapPin } from 'lucide-react';
import Link from 'next/link';

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string | null;
  experienceLevel: string | null;
  areaOfResidence: string | null;
  weekendAbility: boolean;
  canTravelToVillas: boolean;
  applicantFitScore: number | null;
  status: string;
  createdAt: string;
  branch: {
    id: string;
    name: string;
    slug: string;
    country: string;
  };
}

export default function AdminRecruitmentPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [filter, setFilter] = useState({
    branchId: '',
    status: '',
    minScore: '',
  });

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.branchId) params.append('branchId', filter.branchId);
      if (filter.status) params.append('status', filter.status);
      if (filter.minScore) params.append('minScore', filter.minScore);

      const response = await fetch(`/api/admin/recruitment?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setApplications(result.applications || []);
      } else {
        setError(result.error || 'Failed to fetch applications');
      }
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!confirm('Are you sure you want to approve this application?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/cleaners/applications/${applicationId}/approve`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        alert('Application approved successfully!');
        await fetchApplications();
        setSelectedApplication(null);
      } else {
        alert(result.error || 'Failed to approve application');
      }
    } catch (err: any) {
      console.error('Error approving application:', err);
      alert(err.message || 'Failed to approve application');
    }
  };

  const handleReject = async (applicationId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      const response = await fetch(`/api/admin/recruitment/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason || undefined }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Application rejected successfully!');
        await fetchApplications();
        setSelectedApplication(null);
      } else {
        alert(result.error || 'Failed to reject application');
      }
    } catch (err: any) {
      console.error('Error rejecting application:', err);
      alert(err.message || 'Failed to reject application');
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-800';
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruitment Dashboard</h1>
          <p className="text-gray-600">Manage cleaner applications and interviews</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
              <select
                value={filter.minScore}
                onChange={(e) => setFilter({ ...filter, minScore: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Scores</option>
                <option value="70">70+ (Strong)</option>
                <option value="40">40+ (Moderate+)</option>
                <option value="0">All</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilter({ branchId: '', status: '', minScore: '' })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Applied</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedApplication(app)}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{app.name}</p>
                          <p className="text-sm text-gray-600">{app.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {app.applicantFitScore !== null ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(
                              app.applicantFitScore
                            )}`}
                          >
                            {app.applicantFitScore}/100
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{app.branch.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplication(app);
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Application Details
                  </h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Name</h3>
                    <p className="text-gray-900">{selectedApplication.name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Email</h3>
                    <p className="text-gray-900">{selectedApplication.email}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Phone</h3>
                    <p className="text-gray-900">{selectedApplication.phone}</p>
                  </div>

                  {selectedApplication.whatsappNumber && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">WhatsApp</h3>
                      <p className="text-gray-900">{selectedApplication.whatsappNumber}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Experience Level</h3>
                    <p className="text-gray-900">{selectedApplication.experienceLevel || 'Not specified'}</p>
                  </div>

                  {selectedApplication.areaOfResidence && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Area of Residence</h3>
                      <p className="text-gray-900">{selectedApplication.areaOfResidence}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Availability</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedApplication.weekendAbility && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Weekend Available
                        </span>
                      )}
                      {selectedApplication.canTravelToVillas && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Can Travel to Villas
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Fit Score</h3>
                    {selectedApplication.applicantFitScore !== null ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(
                            selectedApplication.applicantFitScore
                          )}`}
                        >
                          {selectedApplication.applicantFitScore}/100
                        </span>
                        {selectedApplication.applicantFitScore >= 70 && (
                          <span className="text-sm text-green-600 font-medium">Strong Applicant</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">Not calculated</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Status</h3>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>

                {/* Actions */}
                {selectedApplication.status === 'PENDING' && (
                  <div className="mt-6 flex gap-4">
                    <button
                      onClick={() => handleApprove(selectedApplication.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedApplication.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

