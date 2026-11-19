"use client";

import { useState } from "react";
import {
  FLAG_NOTE_MAX,
  FLAG_NOTE_PLACEHOLDER,
  arrivalNoteError,
} from "@/lib/flags/jobFlagRules";

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
  const [note, setNote] = useState("");
  const [showIssuesNote, setShowIssuesNote] = useState(value === "ISSUES");

  const save = async (arrivalCondition: "NORMAL" | "ISSUES", issueNote?: string) => {
    setSaving(arrivalCondition);
    setError(null);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/arrival`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrivalCondition,
          note: issueNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save arrival");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save arrival");
    } finally {
      setSaving(null);
    }
  };

  const saveIssues = () => {
    const noteError = arrivalNoteError(note);
    if (noteError) {
      setError(noteError);
      return;
    }
    void save("ISSUES", note.trim());
  };

  return (
    <div className="mb-6">
      <h3 className="mb-2 font-body text-base font-semibold text-vm-navy">Arrival</h3>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setShowIssuesNote(false);
            void save("NORMAL");
          }}
          disabled={saving != null}
          className={`inline-flex min-h-12 w-full items-center justify-center rounded-[10px] px-4 font-body text-sm font-semibold outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan ${
            value === "NORMAL"
              ? "bg-vm-navy text-white"
              : "border border-vm-line bg-vm-surface text-vm-navy"
          }`}
        >
          {saving === "NORMAL" ? "Saving..." : "Normal"}
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowIssuesNote(true);
          }}
          disabled={saving != null}
          className={`inline-flex min-h-12 w-full items-center justify-center rounded-[10px] px-4 font-body text-sm font-semibold outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan ${
            value === "ISSUES" || showIssuesNote
              ? "bg-vm-navy text-white"
              : "border border-vm-line bg-vm-surface text-vm-navy"
          }`}
        >
          Issues
        </button>
      </div>
      {showIssuesNote ? (
        <div className="mt-3">
          <label htmlFor="arrival-flag-note" className="mb-1 block font-body text-sm text-vm-navy">
            What did you notice?
          </label>
          <input
            id="arrival-flag-note"
            value={note}
            maxLength={FLAG_NOTE_MAX}
            onChange={(event) => setNote(event.target.value)}
            placeholder={FLAG_NOTE_PLACEHOLDER}
            className="min-h-12 w-full rounded-[10px] border border-vm-line bg-vm-surface px-3 font-body text-sm text-vm-navy outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
          />
          <p className="mt-2 font-body text-sm text-vm-text">
            Anything noticed during the clean is saved with the job. A before photo is still required.
          </p>
          <button
            type="button"
            onClick={saveIssues}
            disabled={saving != null}
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-semibold text-white outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-60"
          >
            {saving === "ISSUES" ? "Saving..." : "Save issues"}
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 font-body text-sm text-vm-danger">{error}</p> : null}
    </div>
  );
}
