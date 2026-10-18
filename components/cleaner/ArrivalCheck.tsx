"use client";

import { useState } from "react";

export function ArrivalCheck({
  jobId,
  value,
  onSaved,
}: {
  jobId: string;
  value: "NORMAL" | "ISSUES" | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState<"NORMAL" | "ISSUES" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (arrivalCondition: "NORMAL" | "ISSUES") => {
    setSaving(arrivalCondition);
    setError(null);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/arrival`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrivalCondition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save arrival");
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save arrival");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-vm-navy mb-2">Arrival</h3>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void choose("NORMAL")}
          disabled={saving != null}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            value === "NORMAL"
              ? "bg-vm-navy text-white"
              : "bg-vm-surface text-vm-navy border border-vm-border"
          }`}
        >
          {saving === "NORMAL" ? "Saving..." : "Normal"}
        </button>
        <button
          type="button"
          onClick={() => void choose("ISSUES")}
          disabled={saving != null}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            value === "ISSUES"
              ? "bg-vm-navy text-white"
              : "bg-vm-surface text-vm-navy border border-vm-border"
          }`}
        >
          {saving === "ISSUES" ? "Saving..." : "Issues"}
        </button>
      </div>
      {value === "ISSUES" && (
        <p className="mt-2 text-sm text-vm-muted">
          Issues needs at least one Before photo before Finish Job.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-vm-danger">{error}</p>}
    </div>
  );
}
