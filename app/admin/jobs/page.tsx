"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Archive, Loader2, Plus } from "lucide-react";
import {
  JobsOperationsKpis,
  OperationsHealthScore,
} from "@/components/admin/jobs/JobsOperationsKpis";
import {
  JobOperationsCard,
  type AdminJobListItem,
} from "@/components/admin/jobs/JobOperationsCard";
import type { OperationsSummary } from "@/lib/admin/jobsOperations";
import { getJobPriority } from "@/lib/admin/jobsOperations";

type MarketTab = "all" | "vermont" | "new-jersey";

const navyButton =
  "inline-flex items-center justify-center rounded-lg bg-vm-navy px-4 py-2 font-heading text-sm text-white transition-opacity hover:opacity-90";

function AdminJobsPageContent() {
  const searchParams = useSearchParams();
  const [allJobs, setAllJobs] = useState<AdminJobListItem[]>([]);
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
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
        setAllJobs([]);
        setSummary(null);
        setLoadFailed(true);
        return;
      }
      setAllJobs(data.jobs ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setLoadFailed(true);
      setAllJobs([]);
      setSummary(null);
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

  const activeJobs = useMemo(
    () => allJobs.filter((j) => !j.archivedAt),
    [allJobs]
  );

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
    const filtered = allJobs.filter((job) => {
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

    const priorityOrder = { urgent: 0, high: 1, medium: 2, normal: 3 };
    return [...filtered].sort((a, b) => {
      const pa = priorityOrder[getJobPriority(a)];
      const pb = priorityOrder[getJobPriority(b)];
      if (pa !== pb) return pa - pb;
      const da = a.preferredDate ? new Date(a.preferredDate).getTime() : Infinity;
      const db = b.preferredDate ? new Date(b.preferredDate).getTime() : Infinity;
      return da - db;
    });
  }, [allJobs, marketTab, statusFilter, paymentFilter, unassignedOnly]);

  return (
    <div className="p-7 pb-28">
      <div className="mx-auto max-w-7xl">
        {toast && (
          <div className="fixed right-4 top-4 z-50 rounded-lg bg-vm-navy px-5 py-3 font-body text-sm text-white shadow-lg">
            {toast}
          </div>
        )}

        <div className="mb-6 flex items-start justify-between gap-4 border-b border-vm-border pb-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-vm-navy">
              Jobs Operations
            </h1>
            <p className="mt-1 font-body text-sm text-vm-muted">
              Daily schedule, payments, assignments, photos, and host communication.
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
            <button type="button" onClick={fetchJobs} className={`mt-4 ${navyButton}`}>
              Retry
            </button>
          </div>
        ) : (
          <>
            {summary && (
              <>
                <JobsOperationsKpis summary={summary} />
                <OperationsHealthScore summary={summary} />
              </>
            )}

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
                <Archive className="h-3.5 w-3.5" />
                Show archived
              </label>
            </div>

            {displayedJobs.length === 0 ? (
              <div className="rounded-xl border border-vm-border bg-vm-white py-16 text-center">
                <p className="font-heading text-lg text-vm-navy">No jobs found</p>
                <p className="mt-1 font-body text-sm text-vm-muted">
                  Try adjusting your filters or add a job manually.
                </p>
                <Link href="/admin/jobs/new" className={`mt-5 inline-flex ${navyButton}`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Job Manually
                </Link>
              </div>
            ) : (
              <ul className="overflow-hidden rounded-xl border border-vm-border bg-vm-white shadow-sm">
                {displayedJobs.map((job) => (
                  <JobOperationsCard
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

export default function AdminJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
        </div>
      }
    >
      <AdminJobsPageContent />
    </Suspense>
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
