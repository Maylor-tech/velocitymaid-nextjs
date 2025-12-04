export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye, CheckCircle, Clock, Filter } from 'lucide-react';

interface Contract {
  id: string;
  name: string;
  type: string;
  branch: string;
  url: string;
  status: string;
  signedAt: string | null;
  signedBy: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    type: '',
    status: '',
    branch: 'port-antonio',
  });

  useEffect(() => {
    fetchContracts();
  }, [filter]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      if (filter.branch) params.append('branch', filter.branch);

      const response = await fetch(`/api/admin/contracts?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setContracts(result.contracts || []);
      } else {
        setError(result.error || 'Failed to fetch contracts');
      }
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'SIGNED') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Signed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      CLEANER: 'Cleaner Agreement',
      CUSTOMER: 'Customer Terms',
      VILLA: 'Villa Partnership',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3D2F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Contract Management
          </h1>
          <p className="text-gray-600">Manage all VelocityMaid Jamaica contracts</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F]"
              >
                <option value="">All Types</option>
                <option value="CLEANER">Cleaner Agreement</option>
                <option value="CUSTOMER">Customer Terms</option>
                <option value="VILLA">Villa Partnership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F]"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SIGNED">Signed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={filter.branch}
                onChange={(e) => setFilter({ ...filter, branch: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F]"
              >
                <option value="port-antonio">Port Antonio</option>
                <option value="all">All Branches</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Signed Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No contracts found
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{contract.name}</p>
                          {contract.phone && (
                            <p className="text-sm text-gray-600">{contract.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {getTypeLabel(contract.type)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {contract.signedAt
                          ? new Date(contract.signedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={contract.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#2B70C9] text-white rounded-lg hover:bg-[#1e5aa8] transition-colors text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </a>
                          <a
                            href={contract.url}
                            download
                            className="px-3 py-1.5 bg-[#F8C548] text-[#0A3D2F] rounded-lg hover:bg-[#F5B835] transition-colors text-sm flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

