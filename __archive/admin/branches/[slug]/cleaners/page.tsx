"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, Loader2 } from 'lucide-react';
import AdminLayout from '../../../components/AdminLayout';

export default function BranchCleanersPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [branch, setBranch] = useState<any>(null);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchBranchAndCleaners();
    }
  }, [slug]);

  const fetchBranchAndCleaners = async () => {
    try {
      setLoading(true);
      const branchResponse = await fetch(`/api/admin/branches/${slug}`);
      const branchData = await branchResponse.json();

      if (branchData.success && branchData.branch) {
        setBranch(branchData.branch);
        
        // Fetch cleaners for this branch
        // TODO: Create API endpoint for branch cleaners
        // For now, show placeholder
        setCleaners([]);
      } else {
        setError(branchData.error || 'Branch not found');
      }
    } catch (err: any) {
      console.error('Error fetching branch:', err);
      setError(err.message || 'Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading cleaners...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !branch) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || 'Branch not found'}</p>
          <Link href="/admin/branches" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            ← Back to Branches
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/admin/branches/${slug}`}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Cleaners - {branch.name}</h1>
            <p className="text-gray-600">Manage cleaners assigned to this branch</p>
          </div>
          <Link
            href="/admin/cleaners/applications"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> View Applications
          </Link>
        </div>

        {cleaners.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No cleaners assigned to this branch yet</p>
            <Link
              href="/admin/cleaners/applications"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" /> Review Applications
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cleaners.map((cleaner) => (
                  <tr key={cleaner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cleaner.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cleaner.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cleaner.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
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



