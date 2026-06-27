"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, UserPlus, Users, ClipboardList } from "lucide-react";
import { KpiCard } from "@/components/admin/ds/KpiCard";

interface RosterMember {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  branchName: string | null;
  publicDisplayName: string | null;
  jobTitle: string | null;
  memberStatus: string;
  certificationLabel: string;
  isInternalTeam: boolean;
}

export default function AdminCleanersPage() {
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [newApplications, setNewApplications] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rosterRes, appsRes] = await Promise.all([
        fetch("/api/admin/cleaners/roster"),
        fetch("/api/admin/cleaners/applications"),
      ]);
      const roster = await rosterRes.json();
      const apps = await appsRes.json();
      if (roster.success) setMembers(roster.cleaners ?? []);
      if (apps.success) setNewApplications(apps.newCount ?? 0);
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
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-vm-navy">Cleaners & Team</h1>
            <p className="mt-1 font-body text-sm text-vm-muted">
              Manage certified professionals, internal team members, and applicant pipeline.
            </p>
          </div>
          <Link
            href="/admin/cleaners/new"
            className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-4 py-2.5 font-heading text-sm font-bold text-white"
          >
            <UserPlus className="h-4 w-4" /> Add team member
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <KpiCard label="Active team" value={members.filter((m) => m.memberStatus === "ACTIVE").length} icon={<Users className="h-5 w-5" />} />
          <Link href="/admin/cleaners/applications" className="block">
            <KpiCard
              label="Cleaner applications"
              value={newApplications > 0 ? `${newApplications} New` : "0 New"}
              subtitle="Review talent portal submissions"
              icon={<ClipboardList className="h-5 w-5" />}
            />
          </Link>
          <KpiCard label="Internal certified" value={members.filter((m) => m.isInternalTeam).length} icon={<GraduationCap className="h-5 w-5" />} />
        </div>

        <div className="mb-4 flex gap-3">
          <Link href="/admin/cleaners/applications" className="rounded-lg border border-vm-cyan bg-vm-cyan-tint px-4 py-2 font-body text-sm font-semibold text-vm-navy">
            View applications
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-vm-cyan" /></div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-vm-border bg-vm-white py-16 text-center">
            <p className="font-heading text-lg text-vm-navy">No cleaners have been added yet.</p>
            <p className="mt-2 font-body text-sm text-vm-muted">
              Add Brian, Caryll, or invite a new applicant from the talent portal.
            </p>
            <Link href="/admin/cleaners/new" className="mt-4 inline-flex rounded-lg bg-vm-navy px-4 py-2 font-body text-sm text-white">
              Add team member
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-vm-border overflow-hidden rounded-xl border border-vm-border bg-vm-white">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-heading font-semibold text-vm-navy">{m.publicDisplayName || m.name || m.email}</p>
                  <p className="font-body text-sm text-vm-muted">{m.jobTitle || "Cleaning professional"} · {m.branchName || "—"}</p>
                  <p className="font-body text-xs text-vm-muted">{m.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-vm-surface px-2 py-0.5 font-body text-xs text-vm-muted">{m.memberStatus}</span>
                  <span className="rounded-full bg-vm-success-bg px-2 py-0.5 font-body text-xs text-vm-success">{m.certificationLabel}</span>
                  {m.isInternalTeam && (
                    <span className="rounded-full bg-vm-cyan-tint px-2 py-0.5 font-body text-xs text-vm-navy">Internal</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
