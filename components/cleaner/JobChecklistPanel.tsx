"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CareChecklist } from "@/components/brand";
import { Loader2, Check } from "lucide-react";

interface JobChecklistPanelProps {
  jobId: string;
  active?: boolean;
}

type PanelState = "loading" | "ready" | "error" | "saving";

export function JobChecklistPanel({ jobId, active = true }: JobChecklistPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [savedHint, setSavedHint] = useState(false);
  const saveHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchChecklist = useCallback(async () => {
    setPanelState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/checklist`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load checklist");
      }
      setCompletedIds(data.completedIds ?? []);
      setPanelState("ready");
    } catch (err) {
      setPanelState("error");
      setError(err instanceof Error ? err.message : "Failed to load checklist");
    }
  }, [jobId]);

  useEffect(() => {
    if (active) fetchChecklist();
  }, [active, fetchChecklist]);

  useEffect(() => {
    return () => {
      if (saveHintTimer.current) clearTimeout(saveHintTimer.current);
    };
  }, []);

  const showSavedHint = () => {
    setSavedHint(true);
    if (saveHintTimer.current) clearTimeout(saveHintTimer.current);
    saveHintTimer.current = setTimeout(() => setSavedHint(false), 2000);
  };

  const handleToggle = async (itemId: string, checked: boolean) => {
    const previous = completedIds;
    const optimistic = checked
      ? [...new Set([...previous, itemId])]
      : previous.filter((id) => id !== itemId);
    setCompletedIds(optimistic);
    setPanelState("saving");
    setError(null);

    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistItemId: itemId, completed: checked }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save");
      }
      setCompletedIds(data.completedIds ?? optimistic);
      setPanelState("ready");
      showSavedHint();
    } catch (err) {
      setCompletedIds(previous);
      setPanelState("ready");
      setError(err instanceof Error ? err.message : "Failed to save checklist");
    }
  };

  if (!active) return null;

  if (panelState === "loading") {
    return (
      <div className="mt-4 flex items-center gap-2 text-brand-slate/70">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-sans">Loading checklist…</span>
      </div>
    );
  }

  if (panelState === "error" && completedIds.length === 0) {
    return (
      <div className="mt-4 calm-alert">
        <p className="text-sm font-sans">{error}</p>
        <button
          type="button"
          onClick={fetchChecklist}
          className="mt-2 text-xs font-bold uppercase tracking-wider text-brand-forest"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2 mb-2 min-h-[20px]">
        {panelState === "saving" && (
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-slate/50 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving…
          </span>
        )}
        {savedHint && panelState === "ready" && (
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1 ml-auto">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
        {error && panelState === "ready" && (
          <span className="text-[10px] font-sans text-destructive ml-auto">{error}</span>
        )}
      </div>
      <CareChecklist
        mode="interactive"
        completedIds={completedIds}
        onToggle={handleToggle}
        title="50-Point Service Checklist"
        defaultExpanded={false}
      />
    </div>
  );
}
