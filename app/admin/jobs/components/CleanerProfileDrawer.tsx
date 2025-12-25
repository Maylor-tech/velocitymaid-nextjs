'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Star,
  Clock,
  Calendar,
  TrendingUp,
  Shield,
  AlertTriangle,
  WalletCards,
  CheckCircle2,
  FileWarning,
  User as UserIcon,
} from 'lucide-react';

type CleanerProfileDrawerProps = {
  open: boolean;
  cleanerId: string | null;
  jobId?: string;
  onClose: () => void;
};

type Rating = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  customerName?: string | null;
};

type PayoutSummary = {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type ComplianceStatus = {
  status: 'COMPLIANT' | 'MISSING_TRAINING' | 'MISSING_DOCS' | string;
  issues: string[];
};

type CleanerProfileResponse = {
  cleaner: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    primaryBranch?: {
      id: string;
      name: string;
      city?: string | null;
      country?: string | null;
    } | null;
    createdAt: string;
  };
  stats: {
    totalJobs: number;
    completedJobs: number;
    completionRate: number; // 0–100
    ratingAverage: number | null;
    ratingCount: number;
    weeklyJobs: number;
    productivityScore: number; // 0–100
    lastJobDate?: string | null;
  };
  ratings: Rating[];
  payouts: {
    latest: PayoutSummary[];
    totalPaid: number;
    currency: string;
  };
  compliance: ComplianceStatus;
};

type ScheduleJob = {
  id: string;
  preferredDate: string | null;
  preferredTime: string | null;
  status: string;
  customerName?: string | null;
};

type ScheduleResponse = {
  jobs: ScheduleJob[];
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function formatCurrency(amount: number | null | undefined, currency = 'USD') {
  if (!amount && amount !== 0) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(0)}`;
  }
}

function Badge({
  children,
  color = 'primary',
}: {
  children: React.ReactNode;
  color?: 'primary' | 'green' | 'amber' | 'red';
}) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const styles: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };
  return <span className={`${base} ${styles[color]}`}>{children}</span>;
}

export default function CleanerProfileDrawer({
  open,
  cleanerId,
  jobId,
  onClose,
}: CleanerProfileDrawerProps) {
  const [data, setData] = useState<CleanerProfileResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cleaner profile
  useEffect(() => {
    if (!open || !cleanerId) return;

    let cancelled = false;
    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/cleaners/${cleanerId}`);
        if (!res.ok) {
          throw new Error(`Failed to load cleaner profile (${res.status})`);
        }
        const json = (await res.json()) as CleanerProfileResponse;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Error loading cleaner profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [open, cleanerId]);

  // Fetch schedule preview
  useEffect(() => {
    if (!open || !cleanerId) return;

    let cancelled = false;
    async function loadSchedule() {
      try {
        setScheduleLoading(true);
        const res = await fetch(`/api/admin/cleaners/${cleanerId}/schedule`);
        if (!res.ok) return; // schedule is optional

        const json = (await res.json()) as ScheduleResponse;
        if (!cancelled) setSchedule(json);
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }

    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [open, cleanerId]);

  // Close when ESC is pressed
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const stats = data?.stats;
  const compliance = data?.compliance;
  const payouts = data?.payouts;

  const experienceLabel =
    stats && stats.totalJobs >= 100
      ? 'Elite'
      : stats && stats.totalJobs >= 40
      ? 'Experienced'
      : stats && stats.totalJobs >= 10
      ? 'Rising Star'
      : 'New Cleaner';

  const rating = stats?.ratingAverage ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="relative w-full max-w-xl bg-white shadow-xl border-l border-gray-200 flex flex-col"
        aria-label="Cleaner profile"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {data?.cleaner.name ?? 'Cleaner'}
                </h2>
                <p className="text-xs text-gray-500">
                  {data?.cleaner.email}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {rating ? (
                <Badge color="green">
                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)} / 5 · {stats?.ratingCount ?? 0} reviews
                </Badge>
              ) : (
                <Badge>Not yet rated</Badge>
              )}

              <Badge color="primary">{experienceLabel}</Badge>

              {stats && stats.weeklyJobs >= 8 && (
                <Badge color="green">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  High capacity
                </Badge>
              )}
            </div>
          </div>

          <button
            type="button"
            className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* A) Stats summary */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Overview
            </h3>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">Completion rate</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {stats.completionRate.toFixed(0)}%
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {stats.completedJobs} / {stats.totalJobs} jobs
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">Productivity</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {stats.productivityScore.toFixed(0)} / 100
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {stats.weeklyJobs} jobs this week
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">Last job</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(stats.lastJobDate)}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Joined {formatDate(data?.cleaner.createdAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">Primary branch</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {data?.cleaner.primaryBranch?.name ?? 'Unassigned'}
                  </p>
                  {data?.cleaner.primaryBranch?.city && (
                    <p className="text-[11px] text-gray-500">
                      {data.cleaner.primaryBranch.city},{' '}
                      {data.cleaner.primaryBranch.country ?? ''}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No stats available yet.
              </p>
            )}
          </section>

          {/* B) Availability & schedule preview */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Weekly schedule
              </h3>
              {jobId && (
                <span className="text-[11px] text-gray-500">
                  Context job: {jobId}
                </span>
              )}
            </div>

            {scheduleLoading ? (
              <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ) : schedule && schedule.jobs.length > 0 ? (
              <div className="space-y-2 max-h-44 overflow-y-auto border border-gray-100 rounded-xl p-3">
                {schedule.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-start justify-between text-xs bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(job.preferredDate)}{' '}
                        {job.preferredTime && (
                          <span className="text-gray-600">
                            · {job.preferredTime}
                          </span>
                        )}
                      </p>
                      <p className="text-gray-500">
                        {job.customerName ?? 'Customer'} · {job.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No jobs scheduled for this cleaner yet.
              </p>
            )}
          </section>

          {/* C) Performance details */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Performance breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary-600" />
                  <p className="text-xs font-semibold text-gray-700">
                    Reliability
                  </p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {stats ? stats.completionRate.toFixed(0) : '--'}%
                </p>
                <p className="text-[11px] text-gray-500">
                  Based on completed jobs
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <p className="text-xs font-semibold text-gray-700">
                    Rating
                  </p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {rating ? rating.toFixed(1) : '--'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {stats?.ratingCount ?? 0} reviews
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-gray-700">
                    Productivity
                  </p>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {stats ? stats.productivityScore.toFixed(0) : '--'}/100
                </p>
                <p className="text-[11px] text-gray-500">
                  {stats?.weeklyJobs ?? 0} jobs this week
                </p>
              </div>
            </div>
          </section>

          {/* D) Compliance */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Compliance
            </h3>
            {compliance ? (
              <div className="rounded-xl border border-gray-100 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {compliance.status === 'COMPLIANT' ? (
                    <>
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-700">
                        Fully compliant
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-semibold text-amber-700">
                        Action required
                      </p>
                    </>
                  )}
                </div>

                {compliance.issues.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {compliance.issues.map((issue) => (
                      <li
                        key={issue}
                        className="flex items-start gap-2 text-xs text-gray-700"
                      >
                        <FileWarning className="mt-0.5 h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">
                    No outstanding compliance issues.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Compliance data not available.
              </p>
            )}
          </section>

          {/* E) Earnings summary */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Earnings summary
            </h3>
            {payouts ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-100 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WalletCards className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-500">Total paid</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payouts.totalPaid, payouts.currency)}
                      </p>
                    </div>
                  </div>
                  <Badge color="green">Active earner</Badge>
                </div>

                <div className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Recent payouts
                  </p>
                  {payouts.latest.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No payouts recorded yet.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-28 overflow-y-auto">
                      {payouts.latest.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(p.totalAmount, p.currency)}
                            </p>
                            <p className="text-gray-500">
                              {formatDate(p.periodStart)} –{' '}
                              {formatDate(p.periodEnd)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              p.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No payout information available.
              </p>
            )}
          </section>

          {/* F) Ratings list (bonus) */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Recent ratings
            </h3>
            {data?.ratings && data.ratings.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data.ratings.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < r.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    {r.customerName && (
                      <p className="text-xs font-semibold text-gray-800">
                        {r.customerName}
                      </p>
                    )}
                    {r.comment && (
                      <p className="mt-1 text-xs text-gray-600">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No ratings yet for this cleaner.
              </p>
            )}
          </section>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Review completed. You can safely assign this cleaner.</span>
          </div>
          <button
            type="button"
            className="hidden sm:inline-flex items-center rounded-full bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}















