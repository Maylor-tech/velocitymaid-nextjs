'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Plus,
  RefreshCw,
  Star,
  Headphones,
  MessageCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { MarketSupportContact } from '@/lib/customer/marketSupport';
import {
  NEW_JERSEY_SUPPORT,
  primarySupportHref,
} from '@/lib/customer/marketSupport';

interface CustomerJob {
  id: string;
  status: string;
  rawStatus?: string;
  serviceType?: string;
  scheduledDate?: string;
  timeWindow?: string;
  address: string;
  price: number | null;
  balanceDue?: number | null;
  cleaner?: { id: string; name: string } | null;
  serviceTeamLine?: string;
  paymentStatus?: string;
}

interface CustomerProfile {
  firstName: string;
  address?: string | null;
  marketLabel?: string;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatShortDateTime(dateStr?: string, timeWindow?: string): string {
  if (!dateStr) return timeWindow || 'Date TBD';
  const date = new Date(dateStr);
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return timeWindow ? `${datePart} · ${timeWindow}` : datePart;
}

function countdownLabel(dateStr?: string): string | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

function statusBadgeLabel(status: string): string {
  const map: Record<string, string> = {
    assigned: 'Assigned',
    pending: 'Scheduled',
    in_progress: 'In progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[status.toLowerCase()] || status.replace(/_/g, ' ');
}

function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function paymentLine(status?: string, balanceDue?: number | null): {
  text: string;
  className: string;
} {
  if (status === 'PAID') {
    return { text: 'Paid', className: 'text-vm-success text-xs font-body' };
  }
  if (status === 'BALANCE_DUE' || (balanceDue != null && balanceDue > 0)) {
    return { text: 'Balance due', className: 'text-amber-600 text-xs font-body' };
  }
  if (status === 'DEPOSIT_PAID') {
    return { text: 'Deposit paid', className: 'text-vm-muted text-xs font-body' };
  }
  return { text: 'Pending', className: 'text-vm-muted text-xs font-body' };
}

export default function CustomerJobsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingJobs, setUpcomingJobs] = useState<CustomerJob[]>([]);
  const [pastJobs, setPastJobs] = useState<CustomerJob[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [support, setSupport] = useState<MarketSupportContact>(NEW_JERSEY_SUPPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const meRes = await fetch('/api/customer/me');
        const meData = await meRes.json();
        if (!meData.authenticated) {
          router.replace('/customer/login?redirect=/customer/jobs');
          return;
        }
        setProfile({
          firstName: meData.customer?.firstName || 'there',
          address: meData.customer?.address,
          marketLabel: meData.customer?.marketLabel || meData.support?.marketLabel,
        });
        if (meData.support) setSupport(meData.support);

        const [upcomingRes, pastRes] = await Promise.all([
          fetch('/api/customer/jobs?type=upcoming'),
          fetch('/api/customer/jobs?type=past'),
        ]);
        const upcomingData = await upcomingRes.json();
        const pastData = await pastRes.json();
        if (upcomingData.success) setUpcomingJobs(upcomingData.jobs || []);
        if (pastData.success) setPastJobs(pastData.jobs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const nextJob = useMemo(() => {
    if (upcomingJobs.length === 0) return null;
    return [...upcomingJobs].sort((a, b) => {
      const da = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
      const db = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
      return da - db;
    })[0];
  }, [upcomingJobs]);

  const lastJob = pastJobs[0] ?? upcomingJobs[upcomingJobs.length - 1] ?? null;
  const jobs = activeTab === 'upcoming' ? upcomingJobs : pastJobs;
  const countdown = countdownLabel(nextJob?.scheduledDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {error && (
        <div className="rounded-xl border border-vm-danger/20 bg-vm-danger-bg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-vm-danger shrink-0" />
          <p className="text-sm font-body text-vm-danger">{error}</p>
        </div>
      )}

      {/* Welcome row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-vm-navy">
            Welcome back, {profile?.firstName ?? 'there'}
          </h1>
          {(profile?.address || profile?.marketLabel) && (
            <p className="text-vm-muted text-sm mt-1 font-body">
              {[profile?.address, profile?.marketLabel].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <Link
          href="/book"
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-vm-cyan px-5 py-2.5 font-heading font-semibold text-vm-navy hover:bg-vm-cyan/90 transition-colors"
        >
          New Booking +
        </Link>
      </div>

      {/* Next clean card */}
      {nextJob ? (
        <div className="rounded-2xl bg-vm-navy p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-heading text-xs font-bold tracking-widest text-vm-cyan">
              NEXT CLEAN
            </span>
            {countdown && (
              <span className="rounded-full bg-vm-cyan/20 px-3 py-1 text-xs font-semibold text-vm-cyan font-body">
                {countdown}
              </span>
            )}
          </div>
          <h2 className="mt-2 font-heading text-xl font-bold text-vm-white">
            {nextJob.serviceType || 'Professional cleaning'}
          </h2>
          <p className="mt-1 text-sm text-vm-white/60 font-body">
            {formatShortDateTime(nextJob.scheduledDate, nextJob.timeWindow)}
          </p>
          {nextJob.cleaner && (
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vm-cyan/20 text-xs font-heading font-bold text-vm-cyan">
                  {initials(nextJob.cleaner.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-vm-white font-body truncate">
                    {nextJob.cleaner.name}
                  </p>
                  <p className="text-xs text-vm-white/50 font-body">Your specialist</p>
                </div>
              </div>
              <a
                href={primarySupportHref(support)}
                target={support.whatsappUrl ? '_blank' : undefined}
                rel={support.whatsappUrl ? 'noopener noreferrer' : undefined}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vm-cyan text-vm-navy"
                aria-label="Contact support"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          )}
          <Link
            href={`/customer/jobs/${nextJob.id}`}
            className="mt-4 inline-block text-sm font-body font-medium text-vm-cyan hover:underline"
          >
            View details →
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-vm-border bg-vm-white p-6 text-center shadow-sm">
          <p className="font-heading font-semibold text-vm-navy">No upcoming cleans scheduled</p>
          <p className="mt-1 text-sm text-vm-muted font-body">Book your next service in minutes.</p>
          <Link
            href="/book"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-vm-navy px-5 py-2.5 text-sm font-heading font-semibold text-vm-white"
          >
            Book a clean
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-vm-border">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-sm font-body font-semibold border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-vm-cyan text-vm-navy'
              : 'border-transparent text-vm-muted hover:text-vm-navy'
          }`}
        >
          Upcoming ({upcomingJobs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-sm font-body font-semibold border-b-2 transition-colors ${
            activeTab === 'past'
              ? 'border-vm-cyan text-vm-navy'
              : 'border-transparent text-vm-muted hover:text-vm-navy'
          }`}
        >
          Past ({pastJobs.length})
        </button>
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {jobs.length === 0 ? (
          <p className="py-8 text-center text-sm text-vm-muted font-body">
            {activeTab === 'upcoming'
              ? 'No upcoming bookings yet.'
              : 'No past bookings yet.'}
          </p>
        ) : (
          jobs.map((job) => {
            const pay = paymentLine(job.paymentStatus, job.balanceDue);
            return (
              <Link
                key={job.id}
                href={`/customer/jobs/${job.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-vm-border bg-vm-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-vm-cyan/10">
                    <Home className="h-4 w-4 text-vm-cyan" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading font-semibold text-vm-navy text-sm">
                        {job.serviceType || 'Cleaning service'}
                      </p>
                      <span className="rounded-full bg-vm-cyan/10 px-2 py-0.5 text-[10px] font-body font-semibold text-vm-cyan-dark">
                        {statusBadgeLabel(job.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-vm-muted font-body truncate">
                      {formatShortDateTime(job.scheduledDate, job.timeWindow)}
                      {job.cleaner ? ` · ${job.cleaner.name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading font-bold text-vm-navy text-sm">
                    {formatMoney(job.price)}
                  </p>
                  <p className={pay.className}>{pay.text}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/book"
          className="flex flex-col items-start gap-3 rounded-xl border border-vm-border bg-vm-white p-5 hover:shadow-sm transition-shadow"
        >
          <Plus className="h-5 w-5 text-vm-cyan" />
          <span className="font-heading text-sm font-semibold text-vm-navy">Book a clean</span>
        </Link>
        <Link
          href={lastJob ? `/book?rebook=${lastJob.id}` : '/book'}
          className="flex flex-col items-start gap-3 rounded-xl border border-vm-border bg-vm-white p-5 hover:shadow-sm transition-shadow"
        >
          <RefreshCw className="h-5 w-5 text-vm-cyan" />
          <span className="font-heading text-sm font-semibold text-vm-navy">Rebook last</span>
        </Link>
        <Link
          href="/tip"
          className="flex flex-col items-start gap-3 rounded-xl border border-vm-border bg-vm-white p-5 hover:shadow-sm transition-shadow"
        >
          <Star className="h-5 w-5 text-vm-cyan" />
          <span className="font-heading text-sm font-semibold text-vm-navy">Leave a tip</span>
        </Link>
        <a
          href={primarySupportHref(support)}
          target={support.whatsappUrl ? '_blank' : undefined}
          rel={support.whatsappUrl ? 'noopener noreferrer' : undefined}
          className="flex flex-col items-start gap-3 rounded-xl border border-vm-border bg-vm-white p-5 hover:shadow-sm transition-shadow"
        >
          <Headphones className="h-5 w-5 text-vm-cyan" />
          <span className="font-heading text-sm font-semibold text-vm-navy">Get help</span>
        </a>
      </div>
    </div>
  );
}
