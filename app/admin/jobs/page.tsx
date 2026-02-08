"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, MapPin, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import QuickAssignCleaner from '@/components/admin/jobs/QuickAssignCleaner';

const WELCOME_BANNER_KEY = 'admin_welcome_dismissed';

interface Job {
  id: string;
  customerName: string | null;
  address: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  status: string;
  totalPrice: number | null;
  currency: string | null;
  paymentStatus: string;
  assignedCleanerId: string | null;
  assignedCleaner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  branch: {
    id: string;
    name: string;
    slug: string;
  };
  scheduleConfirmed?: boolean;
}

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [adminMe, setAdminMe] = useState<{ name?: string; branchName?: string; isBranchScoped?: boolean } | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [counters, setCounters] = useState<{
    today: number;
    upcoming: number;
    attention: number;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [cleaners, setCleaners] = useState<Array<{ id: string; name: string | null; email?: string | null }>>([]);
  const [confirmingJobId, setConfirmingJobId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAdminMe({
            name: data.name,
            branchName: data.branchName,
            isBranchScoped: data.isBranchScoped,
          });
          try {
            if (typeof window !== 'undefined' && localStorage.getItem(WELCOME_BANNER_KEY) === '1') {
              setWelcomeDismissed(true);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/jobs/counters')
      .then((res) => (res.ok ? res.json() : null))
      .then(setCounters)
      .catch(() => setCounters(null));
  }, []);

  const fetchCleaners = async () => {
    try {
      const res = await fetch('/api/admin/cleaners');
      const data = await res.json();
      setCleaners(data.cleaners || []);
    } catch (e) {
      console.error('Failed to load cleaners', e);
      setCleaners([]);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    if (!jobs || jobs.length === 0) return;
    const hasAssignedJob = jobs.some((job) => job.status === 'ASSIGNED');
    let alreadyCelebrated = false;
    try {
      alreadyCelebrated = typeof window !== 'undefined' && !!localStorage.getItem('vm_first_job_assigned');
    } catch {}
    if (hasAssignedJob && !alreadyCelebrated) {
      setShowCelebration(true);
      try {
        localStorage.setItem('vm_first_job_assigned', 'true');
      } catch {}
    }
  }, [jobs]);

  useEffect(() => {
    fetchBranches();
    fetchJobs();
  }, [statusFilter, paymentFilter, branchFilter, unassignedOnly]);

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

  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    try {
      localStorage.setItem(WELCOME_BANNER_KEY, '1');
    } catch {}
  };

  const fetchJobs = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (branchFilter !== 'all') params.append('branchId', branchFilter);
      if (unassignedOnly) params.append('unassignedOnly', 'true');

      const res = await fetch(`/api/admin/jobs/list?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        console.error('Jobs API warning:', data);
        setJobs([]);
        setLoadFailed(true);
        return;
      }

      let list = data.jobs ?? [];
      if (paymentFilter !== 'all') {
        list = list.filter((job: Job) => job.paymentStatus === paymentFilter);
      }
      setJobs(list);
    } catch (err) {
      console.error('Jobs fetch failed:', err);
      setLoadFailed(true);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const hasJobs = jobs.length > 0;
  const hasAssignedJobs = jobs.some((job) => job.status === 'ASSIGNED');
  const showFirstJobChecklist = hasJobs && !hasAssignedJobs;

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('cancelled')) return 'bg-red-100 text-red-800';
    if (statusLower.includes('assigned')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('in_progress') || statusLower.includes('on_the_way')) return 'bg-purple-100 text-purple-800';
    if (statusLower.includes('confirmed')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return 'N/A';
    const curr = currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="p-6 text-sm text-gray-500">Loading jobs…</p>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
            <p className="text-gray-600">Manage and assign jobs to cleaners</p>
          </div>
          <div className="bg-white rounded-xl shadow-md">
            <EmptyState
              title="No jobs yet"
              subtitle="New bookings will appear here automatically."
              actionLabel="Refresh"
              onAction={fetchJobs}
            />
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-900">
              Welcome, {adminMe?.name ?? 'there'} 👋
            </h3>
            <p className="mt-1 text-sm text-blue-800">
              You&apos;re managing the {adminMe?.branchName ?? 'your'} branch. As bookings come in, you&apos;ll be able
              to assign cleaners and manage schedules from this page.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md">
            <EmptyState
              title="No jobs yet"
              subtitle="New bookings will appear here automatically."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {showCelebration && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">
            <h2 className="mb-1 text-lg font-semibold text-yellow-900">
              🎉 First job assigned!
            </h2>
            <p className="text-sm text-yellow-800">
              You&apos;re officially up and running. Great work getting things moving.
            </p>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
          <p className="text-gray-600">Manage and assign jobs to cleaners</p>
        </div>

        {/* First-login welcome banner (dismissible) */}
        {adminMe?.branchName && !welcomeDismissed && (
          <div className="mb-6 bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">
                Welcome {adminMe.name ? `${adminMe.name} 👋` : '👋'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                You&apos;re managing the {adminMe.branchName} branch. Let&apos;s get your first cleaner assigned.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissWelcome}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Payments</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unassignedOnly}
                onChange={(e) => setUnassignedOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Unassigned Only</span>
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchJobs}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {showFirstJobChecklist && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
            <h2 className="mb-2 text-lg font-semibold text-green-900">
              👋 Let&apos;s get your first job moving
            </h2>
            <p className="mb-4 text-sm text-green-800">
              You&apos;re almost there. Just follow these quick steps:
            </p>
            <ol className="space-y-2 text-sm text-green-900">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                Review incoming jobs and customer notes
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                Assign a verified cleaner to the job
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                Confirm date, time, and location look right
              </li>
            </ol>
            <p className="mt-4 text-xs text-green-700">
              This checklist will disappear automatically once a job is assigned.
            </p>
          </div>
        )}

        {counters && (
          <div className="mb-4 flex flex-wrap gap-3">
            <span className="rounded-full bg-gray-100 px-4 py-1 text-sm text-gray-800">
              Today · <strong>{counters.today}</strong>
            </span>
            <span className="rounded-full bg-blue-100 px-4 py-1 text-sm text-blue-800">
              Upcoming · <strong>{counters.upcoming}</strong>
            </span>
            {counters.attention > 0 && (
              <span className="rounded-full bg-red-100 px-4 py-1 text-sm text-red-800">
                Needs Attention · <strong>{counters.attention}</strong>
              </span>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cleaner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.customerName || 'N/A'}</div>
                      {job.address && (
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {job.address.substring(0, 30)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.serviceType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(job.preferredDate)}</div>
                      {job.preferredTime && (
                        <div className="text-sm text-gray-500">{job.preferredTime}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.branch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(job.totalPrice, job.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(job.paymentStatus)}`}>
                          {job.paymentStatus}
                        </span>
                        {/* Phase 2A: Payment Gating - Visual indicator for unpaid jobs */}
                        {/* Why unpaid jobs are blocked: Prevents assignment before payment is confirmed */}
                        {job.paymentStatus !== 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800" title="Payment required before assignment">
                            <AlertTriangle className="w-3 h-3" />
                            Unpaid
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.assignedCleaner ? (
                        <div>
                          <div className="font-medium">{job.assignedCleaner.name || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{job.assignedCleaner.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        {job.status === 'CONFIRMED' && !job.assignedCleanerId && job.paymentStatus === 'PAID' ? (
                          <QuickAssignCleaner
                            jobId={job.id}
                            cleaners={cleaners}
                            onAssigned={fetchJobs}
                          />
                        ) : job.assignedCleaner ? (
                          <span className="text-xs text-gray-700">Assigned: {job.assignedCleaner.name || job.assignedCleaner.email || '—'}</span>
                        ) : null}
                        {job.status === 'ASSIGNED' && !job.scheduleConfirmed && (
                          <button
                            type="button"
                            disabled={confirmingJobId === job.id}
                            onClick={async () => {
                              setConfirmingJobId(job.id);
                              try {
                                await fetch(`/api/admin/jobs/${job.id}/confirm-schedule`, { method: 'POST' });
                                fetchJobs();
                              } finally {
                                setConfirmingJobId(null);
                              }
                            }}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            {confirmingJobId === job.id ? 'Confirming…' : 'Confirm Schedule'}
                          </button>
                        )}
                        {job.scheduleConfirmed && (
                          <span className="text-xs text-green-700">✔ Confirmed</span>
                        )}
                        <Link
                          href={`/admin/jobs/${job.id}`}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                          title={job.paymentStatus !== 'PAID' ? 'View Details (Payment required before assignment)' : 'View Details'}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}

