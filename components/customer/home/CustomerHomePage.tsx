'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  Camera,
  FileText,
  Headphones,
  Home,
  MapPin,
  RefreshCw,
  Sparkles,
  Star,
  Users,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

interface HomeData {
  welcome: { greeting: string; message: string };
  nextService: {
    id: string;
    serviceType: string;
    scheduledDate: string | null;
    timeWindow: string | null;
    address: string;
    status: string;
    teamLine: string;
    href: string;
  } | null;
  lastService: {
    id: string;
    serviceType: string;
    address: string | null;
    scheduledDate: string | null;
  } | null;
  outstandingBalance: {
    total: number;
    formatted: string;
    invoiceCount: number;
  } | null;
  recentReports: Array<{
    id: string;
    reportNumber: string;
    publicToken: string;
    propertyAddress: string;
    serviceDateFormatted: string;
    serviceType: string | null;
  }>;
  propertyStatus: {
    cleaned: boolean;
    inspected: boolean;
    photosUploaded: boolean;
    guestReady: boolean;
  };
  assignedTeam: Array<{
    id: string;
    name: string;
    initials: string;
    jobTitle: string;
    certificationLabel: string;
    isCertified: boolean;
    rating: number | null;
    completedJobs: number;
  }>;
}

function formatServiceDate(iso: string | null, timeWindow: string | null) {
  if (!iso) return timeWindow || 'Date to be confirmed';
  const date = new Date(iso);
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return timeWindow ? `${datePart} · ${timeWindow}` : datePart;
}

function StatusPill({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-body ${
        done
          ? 'bg-vm-success/10 text-vm-success border border-vm-success/20'
          : 'bg-vm-surface text-vm-muted border border-vm-navy/8'
      }`}
    >
      <span
        className={`flex h-2 w-2 shrink-0 rounded-full ${done ? 'bg-vm-success' : 'bg-vm-navy/20'}`}
      />
      {label}
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  label,
  sublabel,
  accent = 'navy',
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel: string;
  accent?: 'navy' | 'cyan';
}) {
  const iconBg = accent === 'cyan' ? 'bg-vm-cyan/15 text-vm-cyan-dark' : 'bg-vm-navy/10 text-vm-navy';

  return (
    <Link
      href={href}
      className="group flex min-h-[108px] flex-col justify-between rounded-2xl border border-vm-navy/8 bg-vm-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-heading text-sm font-semibold text-vm-navy">{label}</p>
        <p className="mt-0.5 text-xs text-vm-muted font-body">{sublabel}</p>
      </div>
    </Link>
  );
}

export default function CustomerHomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/customer/home');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-vm-cyan border-t-transparent" />
          <p className="mt-4 text-sm text-vm-muted font-body">Loading your home…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-vm-danger/20 bg-vm-danger-bg p-6 text-center">
        <p className="text-vm-text font-body">{error || 'Unable to load home'}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-xl bg-vm-navy px-4 py-2 text-sm font-body font-medium text-vm-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-24 md:max-w-3xl md:space-y-6 md:pb-8 lg:max-w-5xl">
      {/* Welcome Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-vm-navy via-vm-navy to-[#162840] px-5 py-6 text-vm-white shadow-lg md:px-8 md:py-8">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-vm-cyan/20 blur-2xl" />
        <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-vm-cyan/10 blur-xl" />
        <div className="relative">
          <div className="mb-1 flex items-center gap-2 text-vm-cyan">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-body font-semibold uppercase tracking-widest">
              VelocityMaid Home
            </span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            {data.welcome.greeting}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-vm-white/80 font-body">
            {data.welcome.message}
          </p>
        </div>
      </section>

      {/* Next Service */}
      {data.nextService ? (
        <section className="rounded-2xl border border-vm-navy/8 bg-vm-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-vm-navy">Next Service</h2>
            <span className="rounded-full bg-vm-cyan/15 px-3 py-1 text-xs font-body font-semibold text-vm-cyan-dark">
              {data.nextService.status}
            </span>
          </div>
          <p className="font-heading text-lg font-semibold text-vm-text">
            {data.nextService.serviceType}
          </p>
          <div className="mt-3 space-y-2 text-sm text-vm-muted font-body">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-vm-cyan" />
              <span>
                {formatServiceDate(
                  data.nextService.scheduledDate,
                  data.nextService.timeWindow
                )}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-vm-cyan" />
              <span>{data.nextService.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-vm-cyan" />
              <span>{data.nextService.teamLine}</span>
            </div>
          </div>
          <Link
            href={data.nextService.href}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-vm-navy py-3 text-sm font-body font-semibold text-vm-white transition-colors hover:bg-vm-navy/90 md:w-auto md:px-6"
          >
            View service details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-vm-navy/15 bg-vm-white p-6 text-center shadow-sm">
          <Home className="mx-auto h-8 w-8 text-vm-cyan" />
          <h2 className="mt-3 font-heading text-base font-semibold text-vm-navy">
            No upcoming service
          </h2>
          <p className="mt-1 text-sm text-vm-muted font-body">
            Book a cleaning and we will keep everything here at a glance.
          </p>
          <Link
            href="/book"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-vm-cyan px-5 py-2.5 text-sm font-body font-semibold text-vm-navy"
          >
            <CalendarPlus className="h-4 w-4" />
            Book your next service
          </Link>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 px-0.5 font-heading text-sm font-semibold uppercase tracking-wide text-vm-muted">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickActionCard
            href="/book"
            icon={CalendarPlus}
            label="Book Service"
            sublabel="Schedule a new clean"
            accent="cyan"
          />
          <QuickActionCard
            href={data.lastService ? `/book?rebook=${data.lastService.id}` : '/book'}
            icon={RefreshCw}
            label="Rebook Last"
            sublabel={
              data.lastService?.serviceType
                ? data.lastService.serviceType
                : 'Use your last service'
            }
          />
          <QuickActionCard
            href="/customer/reports"
            icon={FileText}
            label="View Reports"
            sublabel="Completion reports"
          />
          <QuickActionCard
            href="https://wa.me/19732809190"
            icon={Headphones}
            label="Get Support"
            sublabel="WhatsApp or call"
            accent="cyan"
          />
        </div>
      </section>

      {/* Outstanding Balance */}
      {data.outstandingBalance && (
        <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-vm-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-800">
                <Wallet className="h-4 w-4" />
                <h2 className="font-heading text-sm font-semibold">Outstanding Balance</h2>
              </div>
              <p className="mt-2 font-heading text-2xl font-bold text-vm-navy">
                {data.outstandingBalance.formatted}
              </p>
              <p className="mt-1 text-xs text-vm-muted font-body">
                {data.outstandingBalance.invoiceCount > 0
                  ? `${data.outstandingBalance.invoiceCount} open invoice(s)`
                  : 'Balance due on your account'}
              </p>
            </div>
            <Link
              href="/customer/payments"
              className="shrink-0 rounded-xl bg-vm-navy px-4 py-2 text-xs font-body font-semibold text-vm-white"
            >
              Pay now
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        {/* Recent Reports */}
        <section className="rounded-2xl border border-vm-navy/8 bg-vm-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-vm-navy">Recent Reports</h2>
            <Link
              href="/customer/reports"
              className="text-xs font-body font-medium text-vm-cyan hover:text-vm-cyan-dark"
            >
              See all
            </Link>
          </div>
          {data.recentReports.length === 0 ? (
            <p className="text-sm text-vm-muted font-body">
              Completion reports appear here after each service.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.recentReports.map((report) => (
                <li key={report.id}>
                  <a
                    href={`/report/${report.publicToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-vm-navy/8 bg-vm-surface/60 px-4 py-3 transition-colors hover:border-vm-cyan/30 hover:bg-vm-cyan/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-body font-semibold text-vm-text">
                        {report.serviceType || 'Service report'}
                      </p>
                      <p className="truncate text-xs text-vm-muted font-body">
                        {report.serviceDateFormatted} · {report.propertyAddress}
                      </p>
                    </div>
                    <FileText className="ml-3 h-4 w-4 shrink-0 text-vm-cyan" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Property Status */}
        <section className="rounded-2xl border border-vm-navy/8 bg-vm-white p-5 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-semibold text-vm-navy">
            Property Status
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <StatusPill label="Cleaned" done={data.propertyStatus.cleaned} />
            <StatusPill label="Inspected" done={data.propertyStatus.inspected} />
            <StatusPill label="Photos uploaded" done={data.propertyStatus.photosUploaded} />
            <StatusPill label="Guest ready" done={data.propertyStatus.guestReady} />
          </div>
          {!data.nextService && !data.propertyStatus.cleaned && (
            <p className="mt-4 text-xs text-vm-muted font-body">
              Status updates appear when you have an active or recent service.
            </p>
          )}
        </section>
      </div>

      {/* Assigned Team */}
      {data.assignedTeam.length > 0 && (
        <section className="rounded-2xl border border-vm-navy/8 bg-vm-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-vm-cyan" />
            <h2 className="font-heading text-base font-semibold text-vm-navy">Your Service Team</h2>
          </div>
          <div className="space-y-4">
            {data.assignedTeam.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-xl border border-vm-navy/8 bg-vm-surface/40 p-4"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-vm-navy to-[#1a3050] text-lg font-heading font-bold text-vm-white shadow-md">
                  {member.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-sm font-semibold text-vm-navy">{member.name}</p>
                  <p className="text-xs text-vm-muted font-body">{member.jobTitle}</p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-vm-cyan/10 px-2 py-0.5 text-[11px] font-body font-medium text-vm-cyan-dark">
                    <ClipboardCheck className="h-3 w-3" />
                    {member.certificationLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-vm-muted font-body">
                    {member.rating != null && (
                      <span className="inline-flex items-center gap-1 text-vm-navy">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {member.rating}
                      </span>
                    )}
                    <span>{member.completedJobs} jobs completed</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hospitality footer strip */}
      <section className="rounded-2xl border border-vm-cyan/20 bg-vm-cyan/5 px-5 py-4 text-center">
        <p className="text-sm text-vm-navy font-body">
          <Camera className="mr-1 inline h-4 w-4 text-vm-cyan" />
          Every service includes photos, inspection notes, and a completion report.
        </p>
      </section>
    </div>
  );
}
