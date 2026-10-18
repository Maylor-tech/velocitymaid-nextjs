"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { CLEAN_PHOTO_CATEGORIES } from '@/lib/photos/cleanPhotoStorage';
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
}: {
  jobId: string;
  uploadedBy?: string;
  slotMode?: boolean;
}) {
  const [category, setCategory] = useState('AFTER');
  const upload = useJobPhotoUpload(jobId, category);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistPayload | null>(null);
  const [issueNote, setIssueNote] = useState("");

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
    const { hasFailures } = await upload.uploadAll(uploadedBy);
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
            onUploaded={() => void loadChecklist()}
          />
        </>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {CLEAN_PHOTO_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-sm ${
              category === c
                ? 'bg-vm-navy text-white'
                : 'bg-gray-100 text-vm-text'
            }`}
          >
            {LABELS[c]}
          </button>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime"
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
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300"
      >
        <Camera className="h-4 w-4" />
        Add more photos
      </button>
      <PhotoQueueMessages messages={upload.fileMessages} />
      <PhotoQueueItemErrors items={upload.items} />
      <PhotoQueueGrid
        items={upload.items}
        onRemove={upload.removeAt}
        onRetry={(key) => upload.retryOne(key, uploadedBy)}
      />
      {upload.readyCount > 0 && (
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={upload.uploading}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-vm-navy text-white rounded-lg disabled:opacity-50"
        >
          {upload.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Upload {upload.readyCount}
        </button>
      )}
      {submitError && <p className="mt-2 text-sm text-red-700">{submitError}</p>}
    </div>
  );
}
