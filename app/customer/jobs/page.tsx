'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface CustomerJob {
  id: string;
  number?: string;
  status: string;
  serviceType?: string;
  scheduledDate?: string;
  timeWindow?: string;
  address: string;
  price: number | null;
  branchName?: string;
  cleaner?: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
  paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIAL';
  rating?: {
    score: number;
    comment?: string;
  } | null;
}

export default function CustomerJobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingJobs, setUpcomingJobs] = useState<CustomerJob[]>([]);
  const [pastJobs, setPastJobs] = useState<CustomerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [activeTab]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const [upcomingRes, pastRes] = await Promise.all([
        fetch('/api/customer/jobs?type=upcoming'),
        fetch('/api/customer/jobs?type=past'),
      ]);

      const upcomingData = await upcomingRes.json();
      const pastData = await pastRes.json();

      if (upcomingData.success) {
        setUpcomingJobs(upcomingData.jobs || []);
      }

      if (pastData.success) {
        setPastJobs(pastData.jobs || []);
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      assigned: { color: 'bg-blue-100 text-blue-800', icon: User, label: 'Assigned' },
      in_progress: { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
      reschedule_requested: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Reschedule Requested' },
      cancel_requested: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancel Requested' },
    };

    const config = statusConfig[status.toLowerCase()] || {
      color: 'bg-gray-100 text-gray-800',
      icon: AlertCircle,
      label: status,
    };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;

    const config: Record<string, { color: string; label: string }> = {
      UNPAID: { color: 'bg-red-100 text-red-800', label: 'Unpaid' },
      PAID: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      REFUNDED: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' },
      PARTIAL: { color: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
    };

    const paymentConfig = config[status] || { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentConfig.color}`}>
        {paymentConfig.label}
      </span>
    );
  };

  const jobs = activeTab === 'upcoming' ? upcomingJobs : pastJobs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
        <p className="text-gray-600">View and manage your cleaning appointments</p>
      </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming ({upcomingJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'past'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Past Jobs ({pastJobs.length})
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading jobs...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {activeTab === 'upcoming' ? 'No upcoming jobs' : 'No past jobs'}
                </p>
                {activeTab === 'upcoming' && (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Book a Service
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/customer/jobs/${job.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.serviceType || 'Cleaning Service'}
                          </h3>
                          {getStatusBadge(job.status)}
                          {getPaymentStatusBadge(job.paymentStatus)}
                        </div>
                        {job.number && (
                          <p className="text-sm text-gray-500">Job #{job.number}</p>
                        )}
                      </div>
                      {job.price !== null && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(job.price)}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(job.scheduledDate)}</span>
                      </div>
                      {job.timeWindow && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{job.timeWindow}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{job.address}</span>
                      </div>
                    </div>

                    {job.cleaner && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{job.cleaner.name}</p>
                          <p className="text-xs text-gray-500">Assigned Cleaner</p>
                        </div>
                      </div>
                    )}

                    {job.rating && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={i < job.rating!.score ? 'text-yellow-400' : 'text-gray-300'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">Rated</span>
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
}








