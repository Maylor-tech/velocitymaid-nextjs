"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";

interface BranchRow {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  status: string;
  _count?: { Job: number; CleanerApplication: number; Customer: number };
}

function isActiveBranch(status: string): boolean {
  return status === "ACTIVE";
}

function statusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PAUSED":
      return "Inactive";
    case "COMING_SOON":
      return "Coming soon";
    default:
      return status.replace(/_/g, " ").toLowerCase();
  }
}

function BranchCard({ branch, inactive }: { branch: BranchRow; inactive?: boolean }) {
  return (
    <li
      className={`rounded-xl border p-5 shadow-sm ${
        inactive
          ? "border-vm-border/60 bg-vm-surface/80 opacity-70"
          : "border-vm-border bg-vm-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <MapPin
          className={`mt-0.5 h-5 w-5 ${inactive ? "text-vm-muted" : "text-vm-cyan"}`}
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`font-heading text-lg font-semibold ${
                inactive ? "text-vm-muted" : "text-vm-navy"
              }`}
            >
              {branch.name}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide ${
                inactive
                  ? "bg-vm-border/50 text-vm-muted"
                  : "bg-vm-success/10 text-vm-success"
              }`}
            >
              {statusLabel(branch.status)}
            </span>
          </div>
          <p className="font-body text-sm text-vm-muted">
            {[branch.city, branch.state].filter(Boolean).join(", ") || branch.slug}
          </p>
          {branch._count && (
            <p className="mt-2 font-body text-xs text-vm-muted">
              {branch._count.Job} jobs · {branch._count.CleanerApplication} applications ·{" "}
              {branch._count.Customer} customers
            </p>
          )}
          {inactive && (
            <p className="mt-2 font-body text-xs italic text-vm-muted">
              Not accepting bookings or shown in active market lists.
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/branches");
      const data = await res.json();
      if (data.success) setBranches(data.branches ?? []);
      else setError(data.error || "Failed to load branches");
    } catch {
      setError("Failed to load branches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { activeBranches, inactiveBranches } = useMemo(() => {
    const active: BranchRow[] = [];
    const inactive: BranchRow[] = [];
    for (const b of branches) {
      if (isActiveBranch(b.status)) active.push(b);
      else inactive.push(b);
    }
    active.sort((a, b) => a.name.localeCompare(b.name));
    inactive.sort((a, b) => a.name.localeCompare(b.name));
    return { activeBranches: active, inactiveBranches: inactive };
  }, [branches]);

  return (
    <div className="p-7 pb-24">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-heading text-2xl font-bold text-vm-navy">Branches</h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Active markets and service areas. Inactive branches are hidden from operations.
        </p>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        ) : error ? (
          <p className="mt-6 font-body text-sm text-vm-danger">{error}</p>
        ) : branches.length === 0 ? (
          <p className="mt-6 font-body text-sm text-vm-muted">No branches configured.</p>
        ) : (
          <>
            {activeBranches.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-vm-navy">
                  Active markets ({activeBranches.length})
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {activeBranches.map((b) => (
                    <BranchCard key={b.id} branch={b} />
                  ))}
                </ul>
              </section>
            )}

            {inactiveBranches.length > 0 && (
              <section className="mt-8">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-vm-muted">
                    Inactive ({inactiveBranches.length})
                  </h2>
                  <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-vm-muted">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="h-4 w-4 rounded border-vm-border"
                    />
                    Show inactive branches
                  </label>
                </div>
                {showInactive ? (
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {inactiveBranches.map((b) => (
                      <BranchCard key={b.id} branch={b} inactive />
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed border-vm-border bg-vm-surface/50 px-4 py-3 font-body text-sm text-vm-muted">
                    {inactiveBranches.map((b) => b.name).join(", ")} — enable &quot;Show
                    inactive branches&quot; to view details.
                  </p>
                )}
              </section>
            )}
          </>
        )}

        <Link
          href="/admin/jobs"
          className="mt-6 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
      </div>
    </div>
  );
}
