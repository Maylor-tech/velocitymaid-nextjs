"use client";

import { useState, useEffect } from 'react';
import { Home, User, MessageCircle, Bed, Bath, Calendar, Package, FileText, Eye, CheckCircle, XCircle, Clock, Star } from 'lucide-react';

interface VillaApplication {
  id: string;
  propertyName: string;
  managerName: string;
  whatsapp: string;
  bedrooms: number;
  bathrooms: number;
  turnoverFrequency: string;
  needsInventory: boolean;
  needsLinenService: boolean;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminVillasPage() {
  const [applications, setApplications] = useState<VillaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<VillaApplication | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      params.append('sortBy', filter.sortBy);
      params.append('sortOrder', filter.sortOrder);

      const response = await fetch(`/api/admin/villas?${params.toString()}`);
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

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/villas/${applicationId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Status updated successfully!');
        await fetchApplications();
        setSelectedApplication(null);
      } else {
        alert(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      NEW: { label: 'New', color: 'bg-blue-100 text-blue-800' },
      CONTACTED: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
      TRIAL: { label: 'Trial', color: 'bg-purple-100 text-purple-800' },
      ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Villa Partnership CRM</h1>
          <p className="text-gray-600">Manage villa partnership applications</p>
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
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Created Date</option>
                <option value="bedrooms">Bedrooms</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={filter.sortOrder}
                onChange={(e) => setFilter({ ...filter, sortOrder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Property</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Manager</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Frequency</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
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
                          <p className="font-medium text-gray-900">{app.propertyName}</p>
                          <p className="text-sm text-gray-600">{app.whatsapp}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{app.managerName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {app.bedrooms} bed / {app.bathrooms} bath
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{app.turnoverFrequency}</td>
                      <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
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
                  <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Property Name</h3>
                    <p className="text-gray-900">{selectedApplication.propertyName}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Manager Name</h3>
                    <p className="text-gray-900">{selectedApplication.managerName}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">WhatsApp</h3>
                    <p className="text-gray-900">{selectedApplication.whatsapp}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Bedrooms</h3>
                      <p className="text-gray-900">{selectedApplication.bedrooms}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Bathrooms</h3>
                      <p className="text-gray-900">{selectedApplication.bathrooms}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Turnover Frequency</h3>
                    <p className="text-gray-900">{selectedApplication.turnoverFrequency}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Additional Services</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedApplication.needsInventory && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Inventory Check
                        </span>
                      )}
                      {selectedApplication.needsLinenService && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Linen Service
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedApplication.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
                      <p className="text-gray-900">{selectedApplication.notes}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Status</h3>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>

                {/* Status Actions */}
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Change Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedApplication.status !== 'CONTACTED' && (
                      <button
                        onClick={() => handleStatusChange(selectedApplication.id, 'CONTACTED')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {selectedApplication.status !== 'TRIAL' && (
                      <button
                        onClick={() => handleStatusChange(selectedApplication.id, 'TRIAL')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Mark Trial
                      </button>
                    )}
                    {selectedApplication.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(selectedApplication.id, 'ACTIVE')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Mark Active
                      </button>
                    )}
                    {selectedApplication.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleStatusChange(selectedApplication.id, 'REJECTED')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

