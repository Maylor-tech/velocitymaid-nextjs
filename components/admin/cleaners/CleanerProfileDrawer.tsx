"use client";

import { useState, useEffect } from 'react';
import Drawer from '@/components/admin/ui/Drawer';
import { Loader2, CheckCircle, XCircle, Calendar, TrendingUp, Award, MapPin, Star, DollarSign, Shield, AlertTriangle } from 'lucide-react';

interface CleanerProfileDrawerProps {
  cleanerId: string | null;
  open: boolean;
  onClose: () => void;
}

interface CleanerData {
  cleaner: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    preferredCities: string[];
    primaryBranch: {
      id: string;
      name: string;
      slug: string;
      country: string;
    } | null;
    availability: {
      workingDays: string[];
      timeRanges: Array<{ start: string; end: string }>;
      maxDailyJobs: number;
      blackoutDates: string[];
      isActive: boolean;
    } | null;
    trainingStatus: {
      overallStatus: string;
      lastModuleSlug: string | null;
      updatedAt: string;
    } | null;
  };
  stats: {
    weeklyJobs: number;
    monthlyJobs: number;
    completionRate: number;
    avgJQS: number;
    totalAssigned: number;
    completedCount: number;
  };
  ratings?: {
    average: number;
    count: number;
    recent: Array<{
      id: string;
      rating: number;
      comment: string | null;
      customerName: string | null;
      jobId: string;
      createdAt: string;
    }>;
  };
  performance?: {
    completionRate: number;
    productivityScore: number;
  };
  payouts?: {
    latest: Array<{
      id: string;
      periodStart: string;
      periodEnd: string;
      totalAmount: number;
      currency: string;
      status: string;
      branch: {
        id: string;
        name: string;
        slug: string;
      } | null;
      createdAt: string;
    }>;
    totalPaid: number;
  };
  compliance?: {
    status: 'COMPLIANT' | 'MISSING_TRAINING' | 'MISSING_DOCS';
    issues: string[];
  };
  upcomingJobs: Array<{
    id: string;
    preferredDate: string | null;
    preferredTime: string | null;
    status: string;
    customerName: string | null;
    customer: {
      firstName: string;
      lastName: string;
    } | null;
    branch: {
      name: string;
    } | null;
    address: string | null;
    serviceType: string | null;
  }>;
  recentJobs: Array<{
    id: string;
    preferredDate: string | null;
    completedAt: string | null;
    customerName: string | null;
    customer: {
      firstName: string;
      lastName: string;
    } | null;
    branch: {
      name: string;
    } | null;
    jobQualityScore: number | null;
    totalPrice: number | null;
    currency: string | null;
  }>;
}

export default function CleanerProfileDrawer({
  cleanerId,
  open,
  onClose,
}: CleanerProfileDrawerProps) {
  const [data, setData] = useState<CleanerData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!cleanerId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cleaners/${cleanerId}`);
      const json = await res.json();

      if (json.success) {
        setData(json);
      } else {
        console.error('Failed to load cleaner profile:', json.error);
        setData(null);
      }
    } catch (error) {
      console.error('Failed to load cleaner profile:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && cleanerId) {
      load();
    }
  }, [open, cleanerId]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      PASSED: { color: 'bg-green-100 text-green-800', label: 'Passed' },
      IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      NOT_STARTED: { color: 'bg-gray-100 text-gray-800', label: 'Not Started' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getJobStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      assigned: { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Drawer title="Cleaner Profile" open={open} onClose={onClose}>
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6 p-6 pb-12">
          {/* HEADER */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">{data.cleaner.name}</h2>
              {data.cleaner.isActive ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Inactive
                </span>
              )}
            </div>
            <p className="text-gray-600">{data.cleaner.email}</p>
          </div>

          {/* PRIMARY BRANCH & CITIES */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Branch & Location
            </h3>
            <div className="rounded-lg border border-gray-200 p-4 space-y-2 bg-gray-50">
              <div>
                <span className="text-xs text-gray-500">Primary Branch:</span>
                <p className="text-sm font-medium text-gray-900">
                  {data.cleaner.primaryBranch?.name || '—'}
                </p>
              </div>
              {data.cleaner.preferredCities && data.cleaner.preferredCities.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500">Preferred Cities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.cleaner.preferredCities.map((city, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        {city}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* AVAILABILITY */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Availability
            </h3>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              {data.cleaner.availability ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>{' '}
                    <span className={data.cleaner.availability.isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {data.cleaner.availability.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Daily Jobs:</span>{' '}
                    <span className="font-medium text-gray-900">{data.cleaner.availability.maxDailyJobs}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Working Days:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {data.cleaner.availability.workingDays && data.cleaner.availability.workingDays.length > 0 ? (
                        data.cleaner.availability.workingDays.map((day: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700 capitalize"
                          >
                            {day}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">None configured</span>
                      )}
                    </div>
                  </div>
                  {data.cleaner.availability.timeRanges &&
                    data.cleaner.availability.timeRanges.length > 0 && (
                      <div>
                        <span className="text-gray-500">Time Ranges:</span>
                        <div className="mt-1 space-y-1">
                          {data.cleaner.availability.timeRanges.map((range: { start: string; end: string }, idx: number) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700 mr-1"
                            >
                              {range.start} - {range.end}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  {data.cleaner.availability.blackoutDates &&
                    data.cleaner.availability.blackoutDates.length > 0 && (
                      <div>
                        <span className="text-gray-500">Blackout Dates:</span>
                        <p className="text-xs text-gray-600 mt-1">
                          {data.cleaner.availability.blackoutDates.length} date(s) configured
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No availability configured</p>
              )}
            </div>
          </section>

          {/* TRAINING STATUS */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Training & Certification
            </h3>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              {data.cleaner.trainingStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Status:</span>
                    {getStatusBadge(data.cleaner.trainingStatus.overallStatus)}
                  </div>
                  {data.cleaner.trainingStatus.lastModuleSlug && (
                    <div className="text-xs text-gray-600">
                      Last Module: {data.cleaner.trainingStatus.lastModuleSlug}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No training status</p>
              )}
            </div>
          </section>

          {/* RATINGS */}
          {data.ratings && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Ratings & Reviews
              </h3>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      {data.ratings.average.toFixed(1)} / 5
                    </span>
                    <span className="text-sm text-gray-500">
                      ({data.ratings.count} {data.ratings.count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>
                {data.ratings.recent.length > 0 ? (
                  <div className="space-y-3">
                    {data.ratings.recent.map((rating) => (
                      <div key={rating.id} className="border rounded p-3 bg-white">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= rating.rating
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {rating.customerName || 'Customer'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(rating.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-700 mt-2">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No reviews yet</p>
                )}
              </div>
            </section>
          )}

          {/* PERFORMANCE SNAPSHOT */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Performance Snapshot
            </h3>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>This Week</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{data.stats.weeklyJobs}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>This Month</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{data.stats.monthlyJobs}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Completion Rate</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.performance?.completionRate?.toFixed(1) || data.stats.completionRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                    <Award className="w-4 h-4" />
                    <span>Avg JQS</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.stats.avgJQS > 0 ? data.stats.avgJQS.toFixed(1) : 'N/A'}
                  </p>
                </div>
              </div>
              {data.performance?.productivityScore !== undefined && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-1 text-gray-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Productivity Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${data.performance.productivityScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {data.performance.productivityScore.toFixed(0)} / 100
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* PAYOUT SUMMARY */}
          {data.payouts && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Payout Summary
              </h3>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-500">Total Paid:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {data.payouts.totalPaid > 0
                        ? `$${data.payouts.totalPaid.toFixed(2)}`
                        : '$0.00'}
                    </span>
                  </div>
                </div>
                {data.payouts.latest.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 mb-2">Latest Payouts:</p>
                    {data.payouts.latest.map((payout) => (
                      <div key={payout.id} className="border rounded p-3 bg-white">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(payout.periodStart).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              –{' '}
                              {new Date(payout.periodEnd).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            {payout.branch && (
                              <p className="text-xs text-gray-600 mt-0.5">{payout.branch.name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {payout.currency === 'JMD' ? 'J$' : '$'}
                              {payout.totalAmount.toFixed(2)}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                payout.status === 'PAID'
                                  ? 'bg-green-100 text-green-800'
                                  : payout.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {payout.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No payouts yet</p>
                )}
              </div>
            </section>
          )}

          {/* COMPLIANCE */}
          {data.compliance && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Compliance
              </h3>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  {data.compliance.status === 'COMPLIANT' ? (
                    <>
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">Compliant</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-600">
                        {data.compliance.status === 'MISSING_TRAINING'
                          ? 'Missing Training'
                          : 'Missing Documents'}
                      </span>
                    </>
                  )}
                </div>
                {data.compliance.issues.length > 0 && (
                  <ul className="space-y-1 text-sm text-gray-700">
                    {data.compliance.issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {data.compliance.issues.length === 0 && (
                  <p className="text-sm text-gray-600">All compliance requirements met</p>
                )}
              </div>
            </section>
          )}

          {/* UPCOMING JOBS */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Upcoming Jobs
            </h3>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              {data.upcomingJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming jobs</p>
              ) : (
                <div className="space-y-2">
                  {data.upcomingJobs.map((job) => (
                    <div key={job.id} className="border rounded p-3 bg-white">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">
                            {job.preferredDate
                              ? new Date(job.preferredDate).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </p>
                          {job.preferredTime && (
                            <p className="text-xs text-gray-600 mt-0.5">{job.preferredTime}</p>
                          )}
                        </div>
                        {getJobStatusBadge(job.status)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {job.customerName || 'Customer'} • {job.branch?.name || 'Branch'}
                      </p>
                      {job.address && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{job.address}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RECENT JOBS */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Recent Completed Jobs
            </h3>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              {data.recentJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No completed jobs yet</p>
              ) : (
                <div className="space-y-2">
                  {data.recentJobs.map((job) => (
                    <div key={job.id} className="border rounded p-3 bg-white">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">
                            {job.preferredDate
                              ? new Date(job.preferredDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </p>
                          {job.completedAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Completed:{' '}
                              {new Date(job.completedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                        {job.jobQualityScore !== null && (
                          <span className="text-xs font-medium text-blue-600">
                            JQS: {job.jobQualityScore}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {job.customerName || 'Customer'} • {job.branch?.name || 'Branch'}
                      </p>
                      {job.totalPrice && (
                        <p className="text-xs text-gray-500 mt-1">
                          {job.currency === 'JMD' ? 'J$' : '$'}
                          {job.totalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {!loading && !data && (
        <div className="flex items-center justify-center py-10">
          <p className="text-gray-500">Cleaner not found</p>
        </div>
      )}
    </Drawer>
  );
}

