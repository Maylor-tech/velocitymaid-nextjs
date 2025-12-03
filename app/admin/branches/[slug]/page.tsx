'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Users, TrendingUp, Settings, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { Loader2, AlertCircle } from 'lucide-react';

export default function BranchDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchBranch();
    }
  }, [slug]);

  const fetchBranch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/branches/${slug}`);
      const data = await response.json();

      if (data.success && data.branch) {
        setBranch(data.branch);
      } else {
        setError(data.error || 'Branch not found');
      }
    } catch (err: any) {
      console.error('Error fetching branch:', err);
      setError(err.message || 'Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading branch...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !branch) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error || 'Branch not found'}</p>
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
            href="/admin/branches"
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{branch.name}</h1>
            <p className="text-gray-600">{branch.city}, {branch.state}</p>
          </div>
          <Link
            href={`/admin/branches/${slug}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit
          </Link>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(branch.status)}`}>
            {branch.status}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href={`/admin/branches/${slug}/edit`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Edit className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Edit Branch</h3>
            <p className="text-sm text-gray-600">Update branch information</p>
          </Link>
          <Link
            href={`/admin/branches/${slug}/cleaners`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Users className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Manage Cleaners</h3>
            <p className="text-sm text-gray-600">{branch._count?.userBranches || 0} cleaners</p>
          </Link>
          <Link
            href={`/admin/branches/${slug}/profitability`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">View Profitability</h3>
            <p className="text-sm text-gray-600">Financial metrics</p>
          </Link>
          <Link
            href={`/admin/branches/${slug}/automation`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <Settings className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Automation</h3>
            <p className="text-sm text-gray-600">WhatsApp & webhooks</p>
          </Link>
        </div>

        {/* Branch Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Branch Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Location</label>
              <div className="flex items-center gap-2 text-gray-900">
                <MapPin className="w-4 h-4" />
                <span>{branch.city}, {branch.state}, {branch.country}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Timezone</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-4 h-4" />
                <span>{branch.timezone}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">Primary Phone</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Phone className="w-4 h-4" />
                <a href={`tel:${branch.primaryPhone}`} className="hover:text-blue-600">
                  {branch.primaryPhone}
                </a>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-1 block">WhatsApp Number</label>
              <div className="flex items-center gap-2 text-gray-900">
                <Phone className="w-4 h-4" />
                <span>{branch.whatsappNumber}</span>
              </div>
            </div>
            {branch.config?.bookingEmail && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Booking Email</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${branch.config.bookingEmail}`} className="hover:text-blue-600">
                    {branch.config.bookingEmail}
                  </a>
                </div>
              </div>
            )}
            {branch.manager && (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 block">Manager</label>
                <div className="text-gray-900">
                  {branch.manager.name || branch.manager.email}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Areas */}
        {branch.serviceAreas && branch.serviceAreas.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Service Areas</h2>
            <div className="flex flex-wrap gap-2">
              {branch.serviceAreas.slice(0, 20).map((area: any) => (
                <span
                  key={area.id}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {area.zipCode}
                </span>
              ))}
              {branch.serviceAreas.length > 20 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  +{branch.serviceAreas.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Jobs</h3>
            <p className="text-3xl font-bold text-gray-900">{branch._count?.jobs || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Cleaners</h3>
            <p className="text-3xl font-bold text-gray-900">{branch._count?.userBranches || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Customers</h3>
            <p className="text-3xl font-bold text-gray-900">{branch._count?.customers || 0}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}



