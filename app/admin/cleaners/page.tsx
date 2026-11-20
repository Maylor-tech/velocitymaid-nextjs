"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, UserPlus, Users, ClipboardList } from "lucide-react";
import { KpiCard } from "@/components/admin/ds/KpiCard";

interface RosterPaperwork {
  type: "W9" | "W4_I9" | "NONE";
  status: "ON_FILE" | "MISSING";
  on?: string | null;
}

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
  paperwork?: RosterPaperwork;
}

function paperworkLine(paperwork?: RosterPaperwork): string {
  if (paperwork?.status === "ON_FILE" && (paperwork.type === "W9" || paperwork.type === "W4_I9")) {
    const kind = paperwork.type === "W4_I9" ? "W-4 and I-9" : "W-9";
    return `Tax paperwork · ${kind} on file${paperwork.on ? ` · ${paperwork.on}` : ""}`;
  }
  return "Tax paperwork · missing";
}

export default function AdminCleanersPage() {
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [newApplications, setNewApplications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paperType, setPaperType] = useState<"W9" | "W4_I9">("W9");
  const [paperOn, setPaperOn] = useState("");
  const [paperError, setPaperError] = useState<string | null>(null);
  const [paperSaving, setPaperSaving] = useState(false);

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

  const missingActive = members.filter(
    (member) => member.memberStatus === "ACTIVE" && member.paperwork?.status !== "ON_FILE"
  );

  const savePaperwork = async (cleanerId: string) => {
    setPaperSaving(true);
    setPaperError(null);
    try {
      const res = await fetch(`/api/admin/cleaners/${cleanerId}/tax-paperwork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: paperType, on: paperOn }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Could not save tax paperwork");
      setEditingId(null);
      await load();
    } catch (err) {
      setPaperError(err instanceof Error ? err.message : "Could not save tax paperwork");
    } finally {
      setPaperSaving(false);
    }
  };

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

        {missingActive.length > 0 ? (
          <p className="mb-4 rounded-[14px] border border-vm-border bg-vm-canvas px-4 py-3 font-body text-sm text-vm-text">
            Tax paperwork is missing for {missingActive.length} active cleaner{missingActive.length === 1 ? "" : "s"}. Solo percentage offers stay blocked until it is on file.
          </p>
        ) : null}

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
                  <p className="font-body text-sm text-vm-text">{paperworkLine(m.paperwork)}</p>
                  <p className="font-body text-xs text-vm-muted">{m.email}</p>
                  {editingId === m.id ? (
                    <form
                      className="mt-3 grid max-w-sm gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void savePaperwork(m.id);
                      }}
                    >
                      <label className="font-body text-sm text-vm-text" htmlFor={`paper-type-${m.id}`}>
                        Type
                        <select
                          id={`paper-type-${m.id}`}
                          value={paperType}
                          onChange={(event) => setPaperType(event.target.value as "W9" | "W4_I9")}
                          className="mt-1 block min-h-11 w-full rounded-[10px] border border-vm-border bg-white px-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
                        >
                          <option value="W9">W-9</option>
                          <option value="W4_I9">W-4 and I-9</option>
                        </select>
                      </label>
                      <label className="font-body text-sm text-vm-text" htmlFor={`paper-on-${m.id}`}>
                        On file date
                        <input
                          id={`paper-on-${m.id}`}
                          type="date"
                          required
                          value={paperOn}
                          onChange={(event) => setPaperOn(event.target.value)}
                          className="mt-1 block min-h-11 w-full rounded-[10px] border border-vm-border px-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
                        />
                      </label>
                      {paperError ? <p className="font-body text-sm text-vm-text">{paperError}</p> : null}
                      <button
                        type="submit"
                        disabled={paperSaving}
                        className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-semibold text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-60"
                      >
                        {paperSaving ? "Saving…" : "Mark tax paperwork on file"}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(m.id);
                        setPaperType(m.paperwork?.type === "W4_I9" ? "W4_I9" : "W9");
                        setPaperOn(m.paperwork?.on || "");
                        setPaperError(null);
                      }}
                      className="mt-2 inline-flex min-h-11 items-center rounded-[10px] border border-vm-border px-4 font-body text-sm font-semibold text-vm-text focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
                    >
                      Mark tax paperwork on file
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-vm-surface px-2 py-0.5 font-body text-xs text-vm-muted">{m.memberStatus}</span>
                  <span className="rounded-full bg-vm-success-bg px-2 py-0.5 font-body text-xs text-vm-success">{m.certificationLabel}</span>
                  {m.isInternalTeam && (
                    <span className="rounded-full bg-vm-cyan-tint px-2 py-0.5 font-body text-xs text-vm-navy">Internal</span>
                  )}
                  <Link
                    href={`/admin/cleaners/${m.id}/worker-record`}
                    className="rounded-lg border border-vm-border px-3 py-1 font-body text-xs font-semibold text-vm-navy hover:bg-vm-surface"
                  >
                    Worker record
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
