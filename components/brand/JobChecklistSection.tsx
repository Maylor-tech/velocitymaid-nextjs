"use client";

import { useCallback, useEffect, useState } from "react";
import { CareChecklist } from "@/components/brand";
import type { CareChecklistMode } from "@/components/brand";
import { buildAuditLogFromItems } from "@/lib/brand/checklistStorage";
import { Loader2 } from "lucide-react";

interface JobChecklistSectionProps {
  jobId: string;
  mode: CareChecklistMode;
  apiBase: "customer" | "admin";
  title?: string;
  defaultExpanded?: boolean;
}

type LoadState = "loading" | "ready" | "error";

export function JobChecklistSection({
  jobId,
  mode,
  apiBase,
  title,
  defaultExpanded = true,
}: JobChecklistSectionProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [auditLog, setAuditLog] = useState<
    Array<{ itemId: string; completedAt: string; completedBy?: string }>
  >([]);

  const fetchChecklist = useCallback(async () => {
    setLoadState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/${apiBase}/jobs/${jobId}/checklist`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load checklist");
      }
      setCompletedIds(data.completedIds ?? []);
      if (mode === "audit" && data.items) {
        setAuditLog(buildAuditLogFromItems(data.items));
      }
      setLoadState("ready");
    } catch (err) {
      setLoadState("error");
      setError(err instanceof Error ? err.message : "Failed to load checklist");
    }
  }, [jobId, apiBase, mode]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  if (loadState === "loading") {
    return (
      <div className="card-brand flex items-center gap-3 text-brand-slate/70">
        <Loader2 className="w-5 h-5 animate-spin text-brand-forest" />
        <span className="text-sm font-sans">Loading hospitality standards…</span>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="calm-alert">
        <p className="text-sm font-sans text-brand-slate">{error}</p>
        <button
          type="button"
          onClick={fetchChecklist}
          className="mt-2 text-xs font-sans font-bold uppercase tracking-wider text-brand-forest hover:text-brand-gold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <CareChecklist
      mode={mode}
      completedIds={completedIds}
      auditLog={mode === "audit" ? auditLog : undefined}
      title={title}
      defaultExpanded={defaultExpanded}
    />
  );
}
