"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Archive,
  Plus,
  Loader2,
} from "lucide-react";

interface Job {
  id: string;
  customerId: string | null;
  customerName: string | null;
  address: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  status: string;
  totalPrice: number | null;
  currency: string | null;
  paymentStatus: string;
  reviewStatus?: string;
  quotedTotal?: number | null;
  amountPaid?: number | null;
  balanceDue?: number | null;
  completedAt?: string | null;
  notifiedAt?: string | null;
  archivedAt?: string | null;
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
}

type MarketTab = "all" | "vermont" | "new-jersey";

const navyButton =
  "inline-flex items-center justify-center rounded-lg bg-vm-navy px-4 py-2 font-heading text-sm text-white transition-opacity hover:opacity-90";

export default function AdminJobsPage() {
  const searchParams = useSearchParams();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [marketTab, setMarketTab] = useState<MarketTab>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  useEffect(() => {
    if (searchParams.get("needsAssignment") === "1") {
      setUnassignedOnly(true);
      setStatusFilter("all");
    }
  }, [searchParams]);

  const [confirmingArchiveId, setConfirmingArchiveId] = useState<string | null>(
    null
  );
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const params = new URLSearchParams();
      if (showArchived) params.append("includeArchived", "true");

      const res = await fetch(`/api/admin/jobs/list?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        console.error("Jobs API warning:", data);
        setAllJobs([]);
        setLoadFailed(true);
        return;
      }
      setAllJobs(data.jobs ?? []);
    } catch (err) {
      console.error("Jobs fetch failed:", err);
      setLoadFailed(true);
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const archiveJob = async (id: string) => {
    setBusyJobId(id);
    try {
      const res = await fetch(`/api/admin/jobs/${id}/delete`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Archive failed");
      setConfirmingArchiveId(null);
      showToast("Job archived.");
      await fetchJobs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setBusyJobId(null);
    }
  };

  const unarchiveJob = async (id: string) => {
    setBusyJobId(id);
    try {
      const res = await fetch(`/api/admin/jobs/${id}/delete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Unarchive failed");
      showToast("Job restored.");
      await fetchJobs();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Unarchive failed");
    } finally {
      setBusyJobId(null);
    }
  };

  // Stats and tab counts are always based on non-archived jobs.
  const activeJobs = useMemo(
    () => allJobs.filter((j) => !j.archivedAt),
    [allJobs]
  );

  const isActionable = (job: Job) => getPrimaryAction(job).actionable;

  const stats = useMemo(() => {
    const now = new Date();
    const isSameDay = (iso: string | null | undefined) => {
      if (!iso) return false;
      const d = new Date(iso);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };
    const isThisMonth = (iso: string | null | undefined) => {
      if (!iso) return false;
      const d = new Date(iso);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    };

    return {
      today: activeJobs.filter((j) => isSameDay(j.preferredDate)).length,
      awaitingPayment: activeJobs.filter((j) => j.paymentStatus === "PENDING")
        .length,
      needsAttention: activeJobs.filter(isActionable).length,
      completedThisMonth: activeJobs.filter(
        (j) =>
          j.status === "COMPLETED" &&
          isThisMonth(j.completedAt ?? j.preferredDate)
      ).length,
    };
  }, [activeJobs]);

  const marketCounts = useMemo(
    () => ({
      all: activeJobs.length,
      vermont: activeJobs.filter((j) => j.branch?.slug === "vermont").length,
      "new-jersey": activeJobs.filter((j) => j.branch?.slug === "new-jersey")
        .length,
    }),
    [activeJobs]
  );

  const displayedJobs = useMemo(() => {
    return allJobs.filter((job) => {
      if (marketTab !== "all" && job.branch?.slug !== marketTab) return false;
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (paymentFilter !== "all" && job.paymentStatus !== paymentFilter)
        return false;
      if (
        unassignedOnly &&
        (job.assignedCleanerId ||
          job.status === "COMPLETED" ||
          job.status === "CANCELLED" ||
          job.status === "CANCELLED_EMERGENCY")
      ) {
        return false;
      }
      return true;
    });
  }, [allJobs, marketTab, statusFilter, paymentFilter, unassignedOnly]);

  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="p-7 pb-28">
      <div className="mx-auto max-w-7xl">
        {toast && (
          <div className="fixed right-4 top-4 z-50 rounded-lg bg-vm-navy px-5 py-3 font-body text-sm text-white shadow-lg">
            {toast}
          </div>
        )}

        {/* HEADER */}
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-vm-border pb-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-vm-navy">Jobs</h1>
            <p className="mt-1 font-body text-sm text-vm-muted">
              Manage bookings, assignments, and payments across markets.
            </p>
          </div>
          <Link href="/admin/jobs/new" className={navyButton}>
            <Plus className="mr-1 h-4 w-4" />
            Add Job Manually
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-vm-cyan" />
            <p className="mt-3 font-body text-sm text-vm-muted">Loading jobs…</p>
          </div>
        ) : loadFailed ? (
          <div className="rounded-xl border border-vm-border bg-vm-white p-8 text-center">
            <p className="font-heading text-lg text-vm-navy">
              Jobs temporarily unavailable
            </p>
            <button
              type="button"
              onClick={fetchJobs}
              className={`mt-4 ${navyButton}`}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* STATS ROW */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Calendar className="h-5 w-5 text-vm-muted" />}
                label="Scheduled Today"
                value={stats.today}
                valueClass="text-vm-navy"
              />
              <StatCard
                icon={<DollarSign className="h-5 w-5 text-vm-muted" />}
                label="Awaiting Payment"
                value={stats.awaitingPayment}
                valueClass={
                  stats.awaitingPayment > 0
                    ? "text-amber-600 font-bold"
                    : "text-vm-navy"
                }
              />
              <StatCard
                icon={<AlertTriangle className="h-5 w-5 text-vm-muted" />}
                label="Needs Attention"
                value={stats.needsAttention}
                valueClass={
                  stats.needsAttention > 0
                    ? "text-red-500 font-bold"
                    : "text-vm-navy"
                }
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5 text-vm-muted" />}
                label={`Completed — ${monthName}`}
                value={stats.completedThisMonth}
                valueClass="text-vm-cyan font-bold"
              />
            </div>

            {/* MARKET TABS */}
            <div className="mb-4 flex items-center gap-6 border-b border-vm-border">
              <MarketTabButton
                label="All Jobs"
                count={marketCounts.all}
                active={marketTab === "all"}
                onClick={() => setMarketTab("all")}
              />
              <MarketTabButton
                label="Vermont"
                count={marketCounts.vermont}
                active={marketTab === "vermont"}
                onClick={() => setMarketTab("vermont")}
              />
              <MarketTabButton
                label="New Jersey"
                count={marketCounts["new-jersey"]}
                active={marketTab === "new-jersey"}
                onClick={() => setMarketTab("new-jersey")}
              />
            </div>

            {/* SECONDARY FILTERS */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-vm-border bg-vm-white px-3 py-1.5 font-body text-sm text-vm-navy outline-none focus:border-vm-cyan"
              >
                <option value="all">All Statuses</option>
                <option value="RECEIVED">Received</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ASSIGNED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded-lg border border-vm-border bg-vm-white px-3 py-1.5 font-body text-sm text-vm-navy outline-none focus:border-vm-cyan"
              >
                <option value="all">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="DEPOSIT_PAID">Deposit Paid</option>
                <option value="PENDING">Pending</option>
                <option value="BALANCE_DUE">Balance Due</option>
                <option value="FAILED">Failed</option>
              </select>
              <label className="ml-auto flex cursor-pointer items-center gap-2 font-body text-sm text-vm-muted">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => setUnassignedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-vm-border"
                />
                Unassigned only
              </label>
              <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-vm-muted">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="h-4 w-4 rounded border-vm-border"
                />
                Show archived jobs
              </label>
            </div>

            {/* JOBS LIST */}
            {displayedJobs.length === 0 ? (
              <div className="rounded-xl border border-vm-border bg-vm-white py-16 text-center">
                <p className="font-heading text-lg text-vm-navy">No jobs found</p>
                <p className="mt-1 font-body text-sm text-vm-muted">
                  Try adjusting your filters or add a job manually.
                </p>
                <Link href="/admin/jobs/new" className={`mt-5 ${navyButton}`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Job Manually
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-vm-border overflow-hidden rounded-xl border border-vm-border bg-vm-white">
                {displayedJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    confirming={confirmingArchiveId === job.id}
                    busy={busyJobId === job.id}
                    onRequestArchive={() => setConfirmingArchiveId(job.id)}
                    onCancelArchive={() => setConfirmingArchiveId(null)}
                    onConfirmArchive={() => archiveJob(job.id)}
                    onUnarchive={() => unarchiveJob(job.id)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */

function getPrimaryAction(job: Job): {
  label: string;
  href: string;
  actionable: boolean;
} {
  if (job.status === "COMPLETED") {
    if (!job.notifiedAt) {
      return {
        label: "Upload photos",
        href: `/admin/jobs/${job.id}/complete`,
        actionable: true,
      };
    }
    if (job.paymentStatus !== "PAID") {
      return {
        label: "Chase payment",
        href: `/admin/jobs/${job.id}`,
        actionable: true,
      };
    }
    return { label: "View job →", href: `/admin/jobs/${job.id}`, actionable: false };
  }
  if (job.paymentStatus === "DEPOSIT_PAID" && job.reviewStatus === "PENDING") {
    return {
      label: "Approve booking",
      href: `/admin/jobs/${job.id}`,
      actionable: true,
    };
  }
  if (
    (job.status === "CONFIRMED" || job.status === "RECEIVED") &&
    !job.assignedCleanerId
  ) {
    return {
      label: "Assign cleaner",
      href: `/admin/jobs/${job.id}`,
      actionable: true,
    };
  }
  return { label: "View job →", href: `/admin/jobs/${job.id}`, actionable: false };
}

function getStatusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "COMPLETED":
      return { label: "Completed", cls: "bg-vm-success-bg text-vm-success" };
    case "CONFIRMED":
      return { label: "Confirmed", cls: "bg-vm-cyan-tint text-blue-700" };
    case "ASSIGNED":
      return { label: "Scheduled", cls: "bg-purple-100 text-purple-700" };
    case "ON_THE_WAY":
      return { label: "On the way", cls: "bg-purple-100 text-purple-700" };
    case "IN_PROGRESS":
      return { label: "In progress", cls: "bg-purple-100 text-purple-700" };
    case "RECEIVED":
      return { label: "Received", cls: "bg-gray-100 text-vm-muted" };
    case "CANCELLED":
    case "CANCELLED_EMERGENCY":
      return { label: "Cancelled", cls: "bg-vm-danger-bg text-red-700" };
    default:
      return { label: status, cls: "bg-gray-100 text-vm-muted" };
  }
}

function getPaymentBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "PAID":
      return { label: "Paid", cls: "bg-vm-success-bg text-vm-success" };
    case "DEPOSIT_PAID":
      return { label: "Deposit Paid", cls: "bg-vm-cyan-tint text-blue-700" };
    case "PENDING":
      return { label: "Pending", cls: "bg-amber-100 text-amber-700" };
    case "BALANCE_DUE":
      return { label: "Balance Due", cls: "bg-amber-100 text-amber-700" };
    case "REFUNDED":
      return { label: "Refunded", cls: "bg-gray-100 text-vm-muted" };
    case "FAILED":
      return { label: "Failed", cls: "bg-vm-danger-bg text-red-700" };
    default:
      return { label: status, cls: "bg-gray-100 text-vm-muted" };
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Not scheduled";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  const curr = currency || "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: curr,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ----------------------------- components ----------------------------- */

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="rounded-xl border border-vm-border bg-vm-white p-5">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-vm-muted">{label}</span>
        {icon}
      </div>
      <div className={`mt-2 font-heading text-3xl ${valueClass}`}>{value}</div>
    </div>
  );
}

function MarketTabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-1 pb-3 font-heading text-sm transition-colors ${
        active
          ? "border-vm-cyan font-semibold text-vm-navy"
          : "border-transparent text-vm-muted hover:text-vm-navy"
      }`}
    >
      {label}
      <span
        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
          active ? "bg-vm-cyan/15 text-vm-navy" : "bg-vm-surface text-vm-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function JobRow({
  job,
  confirming,
  busy,
  onRequestArchive,
  onCancelArchive,
  onConfirmArchive,
  onUnarchive,
}: {
  job: Job;
  confirming: boolean;
  busy: boolean;
  onRequestArchive: () => void;
  onCancelArchive: () => void;
  onConfirmArchive: () => void;
  onUnarchive: () => void;
}) {
  const action = getPrimaryAction(job);
  const statusBadge = getStatusBadge(job.status);
  const paymentBadge = getPaymentBadge(job.paymentStatus);
  const isVermont = job.branch?.slug === "vermont";
  const archived = !!job.archivedAt;
  const paidDisplay = job.amountPaid ?? job.totalPrice ?? null;

  return (
    <li
      className={`px-5 py-4 transition-colors hover:bg-vm-surface/50 ${
        archived ? "italic opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        {/* LEFT */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading font-semibold text-vm-navy">
            {job.customerName || "N/A"}
          </div>
          {job.address && (
            <div className="truncate font-body text-sm text-vm-muted">
              {job.address}
            </div>
          )}
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
              isVermont
                ? "bg-vm-navy/10 text-vm-navy"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {isVermont ? "Vermont" : job.branch?.name || "New Jersey"}
          </span>
        </div>

        {/* CENTER-LEFT: service + price */}
        <div className="hidden w-40 shrink-0 md:block">
          <div className="font-body text-sm font-medium text-vm-navy">
            {job.serviceType || "—"}
          </div>
          <div className="font-body text-sm text-vm-muted">
            {formatCurrency(job.totalPrice, job.currency)}
          </div>
        </div>

        {/* CENTER: date + time */}
        <div className="hidden w-40 shrink-0 lg:block">
          <div className="font-body text-sm font-medium text-vm-navy">
            {formatDate(job.preferredDate)}
          </div>
          {job.preferredTime && (
            <div className="font-body text-xs text-vm-muted">
              {job.preferredTime}
            </div>
          )}
        </div>

        {/* CENTER-RIGHT: payment */}
        <div className="hidden w-36 shrink-0 sm:block">
          <span
            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${paymentBadge.cls}`}
          >
            {paymentBadge.label}
          </span>
          {paidDisplay != null && (
            <div className="mt-1 font-body text-xs text-vm-muted">
              {formatCurrency(paidDisplay, job.currency)}
            </div>
          )}
        </div>

        {/* RIGHT: status + cleaner */}
        <div className="hidden w-32 shrink-0 sm:block">
          <span
            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusBadge.cls}`}
          >
            {statusBadge.label}
          </span>
          {job.assignedCleaner && (
            <div className="mt-1 truncate font-body text-xs text-vm-muted">
              {job.assignedCleaner.name || job.assignedCleaner.email}
            </div>
          )}
        </div>

        {/* FAR RIGHT: archive + action (inline so nothing sits in the
            bottom-right corner under the floating chat widget) */}
        <div className="flex w-52 shrink-0 items-center justify-end gap-2">
          {archived ? (
            <button
              type="button"
              onClick={onUnarchive}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-lg border border-vm-border bg-vm-white px-4 py-2 font-heading text-sm not-italic text-vm-navy transition-colors hover:bg-vm-surface disabled:opacity-60"
            >
              {busy ? "Working…" : "Unarchive"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onRequestArchive}
                title="Archive job"
                aria-label="Archive job"
                className="shrink-0 rounded-lg p-2 text-vm-muted/50 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Archive className="h-4 w-4" />
              </button>
              <Link href={action.href} className={navyButton}>
                {action.label}
              </Link>
            </>
          )}
        </div>
      </div>

      {confirming && !archived && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3 rounded-lg bg-vm-surface px-4 py-2">
          <span className="font-body text-sm not-italic text-vm-navy">
            Archive this job? It won&apos;t be deleted, just hidden.
          </span>
          <button
            type="button"
            onClick={onConfirmArchive}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg bg-vm-danger px-3 py-1.5 font-heading text-sm text-white transition-colors hover:bg-vm-danger disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Yes, archive
          </button>
          <button
            type="button"
            onClick={onCancelArchive}
            disabled={busy}
            className="rounded-lg bg-vm-border px-3 py-1.5 font-heading text-sm text-vm-navy transition-colors hover:opacity-80"
          >
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}
