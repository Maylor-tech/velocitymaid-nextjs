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

type Stage = "preparing" | "uploading" | "saving";

const STAGE_LABEL: Record<Stage, string> = {
  preparing: "Preparing photo…",
  uploading: "Uploading…",
  saving: "Saving…",
};

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
  const attempts = useRef<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<{
    key: string;
    file: File;
    category: string;
    slotKey?: string;
    caption?: string;
  } | null>(null);

  const attemptFor = (key: string) => {
    if (!attempts.current[key]) {
      attempts.current[key] = `slot-${key}-${Date.now().toString(36)}`;
    }
    return attempts.current[key];
  };

  const upload = async (
    file: File,
    category: string,
    slotKey?: string,
    caption?: string
  ) => {
    const key = slotKey || category;
    setError(null);
    setFailed(null);
    setBusyKey(key);
    setStage("preparing");
    try {
      await uploadSingleJobPhoto({
        jobId,
        file,
        uploadedBy,
        category,
        slotKey,
        caption,
        attemptId: attemptFor(key),
        onStage: setStage,
      });
      delete attempts.current[key];
      onUploaded();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed. Tap Retry.";
      setError(message);
      setFailed({ key, file, category, slotKey, caption });
    } finally {
      setBusyKey(null);
      setStage(null);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="mb-2 font-body text-base font-semibold text-vm-navy">Shot list</h3>
      <p className="mb-3 font-body text-sm text-vm-text">
        One photo per room. Use the camera, then tap Retry if the signal drops. A retry does not add a second photo.
      </p>
      {showIssueNote && (
        <div className="mb-3">
          <label className="mb-1 block font-body text-sm text-vm-navy" htmlFor="issue-note">
            Before photo note
          </label>
          <input
            id="issue-note"
            value={issueNote}
            onChange={(event) => onIssueNote(event.target.value)}
            placeholder="What did you notice on arrival?"
            className="min-h-12 w-full rounded-[10px] border border-vm-line bg-vm-surface px-3 font-body text-sm text-vm-navy"
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
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-vm-line px-3 font-body text-sm font-semibold text-vm-navy outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
          >
            {busyKey === "BEFORE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {busyKey === "BEFORE" && stage ? STAGE_LABEL[stage] : "Before photo"}
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {slots.map((slot) => (
          <li key={slot.key} className="rounded-[10px] border border-vm-line px-3 py-3">
            <p className="font-body text-sm font-semibold text-vm-navy">{slot.label}</p>
            <p className="font-body text-sm text-vm-text">
              {slot.room}
              {slot.required ? " · required after" : ""}
              {slot.filled ? " · done" : " · needed"}
            </p>
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
                if (file) {
                  delete attempts.current[slot.key];
                  void upload(file, "AFTER", slot.key, slot.label);
                }
              }}
            />
            <button
              type="button"
              onClick={() => inputs.current[slot.key]?.click()}
              disabled={busyKey != null}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-vm-navy px-3 font-body text-sm font-semibold text-white outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-50"
            >
              {busyKey === slot.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {busyKey === slot.key && stage
                ? STAGE_LABEL[stage]
                : slot.filled
                  ? "Retake"
                  : "Photo"}
            </button>
          </li>
        ))}
      </ul>
      {failed ? (
        <button
          type="button"
          onClick={() =>
            void upload(failed.file, failed.category, failed.slotKey, failed.caption)
          }
          disabled={busyKey != null}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-[10px] border border-vm-line bg-vm-surface px-3 font-body text-sm font-semibold text-vm-navy outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
        >
          Retry
        </button>
      ) : null}
      {error ? <p className="mt-2 font-body text-sm text-vm-danger">{error}</p> : null}
    </div>
  );
}
