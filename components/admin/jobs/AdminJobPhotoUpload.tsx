"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Loader2, UploadCloud } from "lucide-react";
import {
  CLEAN_PHOTO_CATEGORIES,
  MAX_PHOTOS_PER_BATCH,
} from "@/lib/photos/cleanPhotoStorage";
import {
  FLAG_NOTE_MAX,
  FLAG_NOTE_PLACEHOLDER,
  photoFlagNoteError,
} from "@/lib/flags/jobFlagRules";
import { useJobPhotoUpload } from "@/lib/photos/useJobPhotoUpload";
import {
  PhotoQueueGrid,
  PhotoQueueItemErrors,
  PhotoQueueMessages,
  PhotoQueueWarnings,
} from "@/components/photos/PhotoQueueGrid";
import { PhotoSlotList, type SlotRow } from "@/components/cleaner/PhotoSlotList";

const LABELS: Record<string, string> = {
  BEFORE: "Before",
  AFTER: "After",
  ISSUE: "Issue",
  DAMAGE: "Damage",
  SUPPLY: "Supply",
  OTHER: "Other",
};

interface ChecklistPayload {
  slots: Array<{ key: string; label: string; room?: string; required: boolean }>;
  photos: Array<{ slotKey: string | null; category: string }>;
}

/**
 * Office-side photo upload for a job: the same room shot list cleaners use,
 * plus a drop zone for any other photos. Uses the same signed-upload path
 * (/api/jobs/[jobId]/photos/sign + register), which already accepts an admin
 * session. Nothing here changes job status, payment or payouts.
 */
export function AdminJobPhotoUpload({
  jobId,
  onUploaded,
}: {
  jobId: string;
  onUploaded?: () => void;
}) {
  const [category, setCategory] = useState("AFTER");
  const upload = useJobPhotoUpload(jobId, category);
  const inputRef = useRef<HTMLInputElement>(null);
  const [checklist, setChecklist] = useState<ChecklistPayload | null>(null);
  const [flagNote, setFlagNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryingKey, setRetryingKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const needsFlagNote =
    category === "DAMAGE" || category === "SUPPLY" || category === "ISSUE";

  const loadChecklist = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/photo-review`);
      const data = await res.json();
      if (res.ok && data.checklist) setChecklist(data.checklist as ChecklistPayload);
    } catch {
      // Shot list is optional; the drop zone still works without it.
    }
  }, [jobId]);

  useEffect(() => {
    void loadChecklist();
  }, [loadChecklist]);

  const changed = () => {
    void loadChecklist();
    onUploaded?.();
  };

  const slotRows: SlotRow[] = (checklist?.slots ?? []).map((slot) => ({
    key: slot.key,
    label: slot.label,
    room: slot.room ?? slot.label,
    required: slot.required,
    filled: (checklist?.photos ?? []).some(
      (photo) => photo.slotKey === slot.key && photo.category === "AFTER"
    ),
  }));

  const handleUpload = async () => {
    setSubmitError(null);
    const noteError = photoFlagNoteError(category, flagNote);
    if (noteError) {
      setSubmitError(noteError);
      return;
    }
    const { uploaded, hasFailures } = await upload.uploadAll(
      "Admin",
      needsFlagNote ? flagNote.trim() : undefined
    );
    if (uploaded.length > 0) changed();
    if (hasFailures) {
      setSubmitError(
        "Some photos did not upload. Click Retry on each failed photo, then upload again."
      );
    }
  };

  const handleRetry = async (key: string) => {
    setRetryingKey(key);
    const photo = await upload.retryOne(
      key,
      "Admin",
      needsFlagNote ? flagNote.trim() : undefined
    );
    setRetryingKey(null);
    if (photo) changed();
  };

  return (
    <section className="rounded-lg border border-vm-border bg-vm-white p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-lg text-vm-navy">Add photos</h2>
        <Link
          href={`/admin/jobs/${jobId}/complete`}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-vm-border px-3 text-sm font-semibold text-vm-navy hover:bg-vm-surface"
        >
          <ClipboardCheck className="h-4 w-4" />
          Fill in the job report
        </Link>
      </div>
      <p className="mb-4 text-sm text-vm-muted">
        Upload photos for this job yourself, from a phone or a computer. They go
        into the same report as the cleaner&apos;s photos. Nothing is sent to
        the customer from here.
      </p>

      {slotRows.length > 0 && (
        <PhotoSlotList
          jobId={jobId}
          slots={slotRows}
          issueNote=""
          onIssueNote={() => undefined}
          showIssueNote={false}
          uploadedBy="Admin"
          allowLibrary
          onUploaded={changed}
        />
      )}

      <h3 className="mb-2 font-body text-base font-semibold text-vm-navy">
        Other photos
      </h3>
      <div className="mb-3 flex flex-wrap gap-2">
        {CLEAN_PHOTO_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`inline-flex min-h-[40px] items-center rounded-full px-3 text-sm ${
              category === c ? "bg-vm-navy text-white" : "bg-gray-100 text-vm-text"
            }`}
          >
            {LABELS[c] ?? c}
          </button>
        ))}
      </div>

      {needsFlagNote ? (
        <div className="mb-3">
          <label
            htmlFor="admin-flag-photo-note"
            className="mb-1 block font-body text-sm text-vm-navy"
          >
            What did you notice?
          </label>
          <input
            id="admin-flag-photo-note"
            value={flagNote}
            maxLength={FLAG_NOTE_MAX}
            onChange={(event) => setFlagNote(event.target.value)}
            placeholder={FLAG_NOTE_PLACEHOLDER}
            className="min-h-[44px] w-full rounded-[10px] border border-vm-line bg-vm-surface px-3 font-body text-sm text-vm-navy"
          />
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) upload.addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-vm-cyan bg-vm-cyan/5" : "border-vm-border hover:border-vm-cyan"
        }`}
      >
        <UploadCloud className="h-7 w-7 text-vm-cyan" />
        <p className="mt-2 font-body text-sm text-vm-text">
          Drag photos here, or click to choose ({LABELS[category] ?? category})
        </p>
        <p className="mt-1 font-body text-xs text-vm-muted">
          JPG, PNG, WebP, HEIC, MP4 · up to {MAX_PHOTOS_PER_BATCH} at a time
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => {
            upload.addFiles(e.target.files ?? []);
            e.target.value = "";
          }}
        />
      </div>

      <PhotoQueueMessages messages={upload.fileMessages} />
      {upload.items.length > 0 && (
        <div className="mt-4">
          <PhotoQueueGrid
            items={upload.items}
            onRemove={upload.removeAt}
            onRetry={(key) => void handleRetry(key)}
            retryingKey={retryingKey}
          />
          <PhotoQueueWarnings items={upload.items} />
          <PhotoQueueItemErrors items={upload.items} />
        </div>
      )}
      {upload.readyCount > 0 && (
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={upload.uploading}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-vm-navy px-4 font-body text-sm font-semibold text-white disabled:opacity-50"
        >
          {upload.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Upload {upload.readyCount} photo{upload.readyCount > 1 ? "s" : ""}
        </button>
      )}
      {submitError && <p className="mt-2 text-sm text-red-700">{submitError}</p>}
    </section>
  );
}
