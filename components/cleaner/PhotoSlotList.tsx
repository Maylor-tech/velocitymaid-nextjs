"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadSingleJobPhoto } from "@/lib/photos/uploadJobPhotos";

export interface SlotRow {
  key: string;
  label: string;
  room: string;
  required: boolean;
  filled: boolean;
}

export function PhotoSlotList({
  jobId,
  slots,
  issueNote,
  onIssueNote,
  showIssueNote,
  uploadedBy,
  onUploaded,
}: {
  jobId: string;
  slots: SlotRow[];
  issueNote: string;
  onIssueNote: (value: string) => void;
  showIssueNote: boolean;
  uploadedBy?: string;
  onUploaded: () => void;
}) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const beforeRef = useRef<HTMLInputElement | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, category: string, slotKey?: string, caption?: string) => {
    setError(null);
    setBusyKey(slotKey || category);
    try {
      await uploadSingleJobPhoto({
        jobId,
        file,
        uploadedBy,
        category,
        slotKey,
        caption,
      });
      onUploaded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-vm-navy mb-2">Shot list</h3>
      <p className="text-sm text-vm-muted mb-3">
        One photo per slot. Required after photos must be filled before Finish Job.
      </p>
      {showIssueNote && (
        <div className="mb-3">
          <label className="block text-sm text-vm-navy mb-1" htmlFor="issue-note">
            Issue note
          </label>
          <input
            id="issue-note"
            value={issueNote}
            onChange={(event) => onIssueNote(event.target.value)}
            placeholder="One line"
            className="w-full rounded-lg border border-vm-border bg-vm-white px-3 py-2 text-sm text-vm-navy"
          />
          <input
            ref={beforeRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file, "BEFORE", undefined, issueNote || undefined);
            }}
          />
          <button
            type="button"
            onClick={() => beforeRef.current?.click()}
            disabled={busyKey != null}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-vm-border px-3 py-2 text-sm text-vm-navy"
          >
            {busyKey === "BEFORE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Before photo
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {slots.map((slot) => (
          <li key={slot.key} className="flex items-center justify-between gap-3 rounded-lg border border-vm-border px-3 py-2">
            <div>
              <p className="text-sm font-medium text-vm-navy">{slot.label}</p>
              <p className="text-xs text-vm-muted">
                {slot.room}
                {slot.required ? " · required after" : ""}
                {slot.filled ? " · done" : ""}
              </p>
            </div>
            <input
              ref={(node) => {
                inputs.current[slot.key] = node;
              }}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void upload(file, "AFTER", slot.key, slot.label);
              }}
            />
            <button
              type="button"
              onClick={() => inputs.current[slot.key]?.click()}
              disabled={busyKey != null}
              className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busyKey === slot.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {slot.filled ? "Retake" : "Photo"}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-vm-danger">{error}</p>}
    </div>
  );
}
