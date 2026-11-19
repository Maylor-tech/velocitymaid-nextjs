"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { CLEAN_PHOTO_CATEGORIES } from '@/lib/photos/cleanPhotoStorage';
import {
  FLAG_NOTE_MAX,
  FLAG_NOTE_PLACEHOLDER,
  photoFlagNoteError,
} from '@/lib/flags/jobFlagRules';
import { useJobPhotoUpload } from '@/lib/photos/useJobPhotoUpload';
import {
  PhotoQueueGrid,
  PhotoQueueItemErrors,
  PhotoQueueMessages,
} from '@/components/photos/PhotoQueueGrid';
import { ArrivalCheck } from '@/components/cleaner/ArrivalCheck';
import { PhotoSlotList, type SlotRow } from '@/components/cleaner/PhotoSlotList';

const LABELS: Record<string, string> = {
  BEFORE: 'Before',
  AFTER: 'After',
  ISSUE: 'Issue',
  DAMAGE: 'Damage',
  SUPPLY: 'Supply',
  OTHER: 'Other',
};

interface ChecklistPayload {
  arrivalCondition: "NORMAL" | "ISSUES" | null;
  slots: Array<{ key: string; label: string; room: string; required: boolean }>;
  photos: Array<{ slotKey: string | null; category: string }>;
}

export function JobPhotoCapture({
  jobId,
  uploadedBy,
  slotMode = false,
  onChanged,
}: {
  jobId: string;
  uploadedBy?: string;
  slotMode?: boolean;
  onChanged?: () => void;
}) {
  const [category, setCategory] = useState('AFTER');
  const upload = useJobPhotoUpload(jobId, category);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistPayload | null>(null);
  const [issueNote, setIssueNote] = useState("");
  const [flagNote, setFlagNote] = useState("");
  const needsFlagNote =
    category === "DAMAGE" || category === "SUPPLY" || category === "ISSUE";

  const loadChecklist = useCallback(async () => {
    if (!slotMode) return;
    const res = await fetch(`/api/cleaner/jobs/${jobId}/photo-checklist`);
    const data = await res.json();
    if (res.ok && data.checklist) setChecklist(data.checklist as ChecklistPayload);
  }, [jobId, slotMode]);

  useEffect(() => {
    void loadChecklist();
  }, [loadChecklist]);

  const slotRows: SlotRow[] = (checklist?.slots ?? []).map((slot) => ({
    ...slot,
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
    const { hasFailures } = await upload.uploadAll(
      uploadedBy,
      needsFlagNote ? flagNote.trim() : undefined
    );
    if (hasFailures) {
      setSubmitError('Some photos failed. Retry, then submit again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="font-semibold text-lg mb-2">Photos</h2>
      <p className="text-sm text-vm-muted mb-4">
        Operational evidence only. Photos are not sent to the customer from this screen.
      </p>
      {slotMode && (
        <>
          <ArrivalCheck
            jobId={jobId}
            value={checklist?.arrivalCondition ?? null}
            onSaved={() => void loadChecklist()}
          />
          <PhotoSlotList
            jobId={jobId}
            slots={slotRows}
            issueNote={issueNote}
            onIssueNote={setIssueNote}
            showIssueNote={checklist?.arrivalCondition === "ISSUES"}
            uploadedBy={uploadedBy}
            onUploaded={() => {
              void loadChecklist();
              onChanged?.();
            }}
          />
        </>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {CLEAN_PHOTO_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`inline-flex min-h-[44px] items-center rounded-full px-3 text-sm ${
              category === c
                ? 'bg-vm-navy text-white'
                : 'bg-gray-100 text-vm-text'
            }`}
          >
            {LABELS[c]}
          </button>
        ))}
      </div>
      {needsFlagNote ? (
        <div className="mb-4">
          <label htmlFor="flag-photo-note" className="mb-1 block font-body text-sm text-vm-navy">
            What did you notice?
          </label>
          <input
            id="flag-photo-note"
            value={flagNote}
            maxLength={FLAG_NOTE_MAX}
            onChange={(event) => setFlagNote(event.target.value)}
            placeholder={FLAG_NOTE_PLACEHOLDER}
            className="min-h-[44px] w-full rounded-[10px] border border-vm-line bg-vm-surface px-3 font-body text-sm text-vm-navy outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
          />
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          upload.addFiles(e.target.files ?? []);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-vm-line px-4 font-body text-sm font-semibold text-vm-navy"
      >
        <Camera className="h-4 w-4" />
        Add more photos
      </button>
      <PhotoQueueMessages messages={upload.fileMessages} />
      <PhotoQueueItemErrors items={upload.items} />
      <PhotoQueueGrid
        items={upload.items}
        onRemove={upload.removeAt}
        onRetry={(key) =>
          upload.retryOne(key, uploadedBy, needsFlagNote ? flagNote.trim() : undefined)
        }
      />
      {upload.readyCount > 0 && (
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={upload.uploading}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-vm-navy px-4 font-body text-sm font-semibold text-white disabled:opacity-50"
        >
          {upload.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Upload {upload.readyCount}
        </button>
      )}
      {submitError && <p className="mt-2 text-sm text-red-700">{submitError}</p>}
    </div>
  );
}
