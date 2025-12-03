'use client';

// TODO: Protect this route with admin authentication

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, Edit, TrendingUp, Search, Users, Power } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';

type BranchStatus = 'ACTIVE' | 'COMING_SOON' | 'PAUSED';

interface Branch {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string;
  regionLabel: string | null;
  status: BranchStatus;
  createdAt: string;
  manager: { id: string; name: string | null; email: string } | null;
  _count: { jobs: number; userBranches: number };
}

export default function BranchesListPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/branches');
      const data = await response.json();

      if (data.success) {
        setBranches(data.branches);
      } else {
        throw new Error(data.error || 'Failed to fetch branches');
      }
    } catch (err: any) {
      console.error('Error fetching branches:', err);
      setError(err.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: BranchStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMING_SOON':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAUSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleStatus = async (branchSlug: string, currentStatus: BranchStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const response = await fetch(`/api/admin/branches/${branchSlug}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        fetchBranches();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading branches...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Branches</h1>
            <p className="text-gray-600">Manage VelocityMaid locations</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/branches/test-zip"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Test ZIP
            </Link>
            <Link
              href="/admin/branches/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Branch
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Branches Table */}
        {branches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No branches found</p>
            <Link
              href="/admin/branches/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create First Branch
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
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
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                      {branch.regionLabel && (
                        <div className="text-sm text-gray-500">{branch.regionLabel}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {branch.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{branch.city}, {branch.state}</div>
                      <div className="text-sm text-gray-500">{branch.country}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(branch.status)}`}>
                        {branch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(branch.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/branches/${branch.slug}`}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/branches/${branch.slug}/edit`}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/branches/${branch.slug}/cleaners`}
                          className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                          title="Manage Cleaners"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/branches/${branch.slug}/profitability`}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                          title="View Profitability"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(branch.slug, branch.status)}
                          className={`p-2 rounded transition-colors ${
                            branch.status === 'ACTIVE'
                              ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={branch.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

