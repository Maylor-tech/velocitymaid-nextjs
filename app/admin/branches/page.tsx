"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="p-7 pb-24">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-heading text-2xl font-bold text-vm-navy">Branches</h1>
        <p className="mt-1 font-body text-sm text-vm-muted">Markets, service areas, and branch operations.</p>

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-vm-cyan" /></div>
        ) : error ? (
          <p className="mt-6 font-body text-sm text-vm-danger">{error}</p>
        ) : branches.length === 0 ? (
          <p className="mt-6 font-body text-sm text-vm-muted">No branches configured.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {branches.map((b) => (
              <li key={b.id} className="rounded-xl border border-vm-border bg-vm-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-vm-cyan" />
                  <div>
                    <p className="font-heading text-lg font-semibold text-vm-navy">{b.name}</p>
                    <p className="font-body text-sm text-vm-muted">{[b.city, b.state].filter(Boolean).join(", ") || b.slug}</p>
                    <p className="mt-1 font-body text-xs uppercase tracking-wide text-vm-muted">{b.status}</p>
                    {b._count && (
                      <p className="mt-2 font-body text-xs text-vm-muted">
                        {b._count.Job} jobs · {b._count.CleanerApplication} applications · {b._count.Customer} customers
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Link href="/admin/jobs" className="mt-6 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
      </div>
    </div>
  );
}
