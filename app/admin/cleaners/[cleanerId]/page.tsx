"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  CheckCircle,
  Calendar,
  DollarSign,
  Shield,
  AlertTriangle,
  User,
  Briefcase,
  TrendingUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import KpiCard from '@/components/admin/ui/KpiCard';
import { useCleanerScorecard } from '../hooks/useCleanerScorecard';

export default function CleanerScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const cleanerId = params?.cleanerId as string;

  const { data, isLoading, error, refetch } = useCleanerScorecard(cleanerId);

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return 'N/A';
    const symbol = currency === 'JMD' ? 'J$' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      assigned: { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading cleaner scorecard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error === 'Cleaner not found' ? 'Cleaner Not Found' : 'Error Loading Scorecard'}
            </h2>
            <p className="text-gray-600 mb-4">
              {error === 'Cleaner not found'
                ? 'The cleaner you are looking for does not exist or has been removed.'
                : 'We couldn\'t load this cleaner\'s scorecard. Please try again or contact support.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={refetch}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Retry
              </button>
              <Link
                href="/admin/cleaners/applications"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Cleaners
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return null;
  }

  const { cleaner, stats, ratings, performance, payouts, compliance, recentJobs } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/cleaners/applications"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <nav className="text-sm text-gray-500 mb-1">
                <Link href="/admin" className="hover:text-gray-700">Admin</Link>
                {' > '}
                <Link href="/admin/cleaners/applications" className="hover:text-gray-700">
                  Cleaners
                </Link>
                {' > '}
                <span className="text-gray-900">{cleaner.name || 'Cleaner'}</span>
              </nav>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xl font-semibold text-primary-600">
                      {cleaner.name?.charAt(0).toUpperCase() || 'C'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{cleaner.name || 'Cleaner'}</h1>
                    <p className="text-sm text-gray-600">{cleaner.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cleaner.isActive ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                      Inactive
                    </span>
                  )}
                  {compliance.status === 'COMPLIANT' ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Compliant
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Action Needed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/admin/jobs"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            Jobs Board
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Overall Rating"
            value={
              ratings.average > 0
                ? `${ratings.average.toFixed(1)} / 5.0`
                : 'Not rated'
            }
            icon={<Star className="w-5 h-5" />}
            highlight={ratings.average >= 4.5}
          />
          <KpiCard
            label="Completion Rate"
            value={`${performance.completionRate.toFixed(0)}%`}
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <KpiCard
            label="Jobs This Week"
            value={`${stats.weeklyJobs} (${stats.monthlyJobs} this month)`}
            icon={<Calendar className="w-5 h-5" />}
          />
          <KpiCard
            label="Total Earnings"
            value={formatCurrency(payouts.totalPaid, 'USD')}
            icon={<DollarSign className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Performance & Jobs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Jobs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
                <Link
                  href="/admin/jobs"
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1"
                >
                  View All
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              {recentJobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No jobs found for this cleaner</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quality Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentJobs.slice(0, 10).map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(job.completedAt || job.preferredDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {job.branch?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {job.customerName ||
                              (job.customer
                                ? `${job.customer.firstName} ${job.customer.lastName}`
                                : 'N/A')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {job.jobQualityScore !== null ? (
                              <span className="font-medium text-gray-900">{job.jobQualityScore}/100</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(job.totalPrice, job.currency)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <Link
                              href={`/admin/jobs`}
                              className="text-primary-600 hover:text-primary-800 font-medium"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ratings & Feedback */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ratings & Feedback</h2>
              {ratings.count === 0 ? (
                <p className="text-gray-500 text-center py-8">This cleaner has no ratings yet</p>
              ) : (
                <div className="space-y-4">
                  {/* Rating Distribution */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Rating Distribution</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(ratings.average)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {ratings.average.toFixed(1)} average from {ratings.count} review{ratings.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Recent Ratings */}
                  <div className="space-y-3">
                    {ratings.recent.slice(0, 5).map((rating) => (
                      <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < rating.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(rating.createdAt)}
                          </span>
                        </div>
                        {rating.customerName && (
                          <p className="text-sm font-semibold text-gray-800 mb-1">
                            {rating.customerName}
                          </p>
                        )}
                        {rating.comment && (
                          <p className="text-sm text-gray-600">"{rating.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Compliance & Payouts */}
          <div className="space-y-6">
            {/* Compliance Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Compliance & Training</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {compliance.status === 'COMPLIANT' ? (
                    <>
                      <Shield className="h-5 w-5 text-emerald-600" />
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full">
                        Compliant
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-sm font-semibold rounded-full">
                        {compliance.status === 'MISSING_TRAINING'
                          ? 'Missing Training'
                          : 'Missing Documents'}
                      </span>
                    </>
                  )}
                </div>
                {compliance.issues.length > 0 && (
                  <ul className="space-y-2">
                    {compliance.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {cleaner.trainingStatus && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Training Status</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {cleaner.trainingStatus.overallStatus.toLowerCase()}
                    </p>
                    {cleaner.trainingStatus.lastModuleSlug && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last module: {cleaner.trainingStatus.lastModuleSlug}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payout Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Earnings Summary</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(payouts.totalPaid, 'USD')}
                  </p>
                </div>
                {payouts.latest.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Recent Payouts</p>
                    <div className="space-y-2">
                      {payouts.latest.slice(0, 3).map((payout) => (
                        <div
                          key={payout.id}
                          className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(payout.totalAmount, payout.currency)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(payout.periodStart)} – {formatDate(payout.periodEnd)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              payout.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : payout.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {payout.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No payouts recorded yet</p>
                )}
                {cleaner.primaryBranch?.country === 'Jamaica' && (
                  <p className="text-xs text-gray-500 italic mt-2">
                    Payouts handled via Jamaica payout system
                  </p>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Productivity Score</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {performance.productivityScore.toFixed(0)}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${performance.productivityScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average JQS</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.avgJQS.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${stats.avgJQS}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Assigned</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.totalAssigned}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completed</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.completedCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

