"use client";

import { useCallback, useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  Loader2,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { MAX_PHOTOS_PER_BATCH } from "@/lib/photos/cleanPhotoStorage";
import { useJobPhotoUpload } from "@/lib/photos/useJobPhotoUpload";
import {
  PhotoQueueGrid,
  PhotoQueueItemErrors,
  PhotoQueueMessages,
  PhotoQueueWarnings,
} from "@/components/photos/PhotoQueueGrid";

interface Props {
  jobId: string;
  address: string | null;
}

export default function CleanerUploadClient({ jobId, address }: Props) {
  const {
    items,
    fileMessages,
    uploading,
    readyCount,
    addFiles,
    removeAt,
    uploadAll,
    retryOne,
  } = useJobPhotoUpload(jobId);

  const [retryingKey, setRetryingKey] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files ?? []);
    e.target.value = "";
  };

  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files ?? []);
    e.target.value = "";
  };

  const handleRetry = useCallback(
    async (key: string) => {
      setRetryingKey(key);
      setSubmitError(null);
      await retryOne(key, "Cleaner (mobile)");
      setRetryingKey(null);
    },
    [retryOne]
  );

  const handleSubmit = async () => {
    if (readyCount === 0) return;
    setSubmitError(null);

    const { hasFailures } = await uploadAll("Cleaner (mobile)");

    if (hasFailures) {
      setSubmitError(
        "Some photos did not upload. Tap Retry on each failed file, then submit again."
      );
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface p-6">
        <div className="w-full max-w-sm rounded-2xl border border-vm-success/30 bg-vm-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-vm-success-bg">
            <CheckCircle className="h-9 w-9 text-vm-success" />
          </div>
          <h1 className="mt-5 font-heading text-2xl font-semibold text-vm-navy">
            Photos uploaded.
          </h1>
          <p className="mt-1 font-body text-lg text-vm-text">Great work today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vm-surface">
      <header className="bg-vm-navy px-5 py-5 text-center">
        <span className="font-heading text-lg font-bold uppercase tracking-widest text-vm-white">
          VelocityMaid
        </span>
      </header>

      <main className="mx-auto max-w-md px-5 py-6">
        <div className="rounded-2xl border border-vm-border bg-vm-white p-5">
          <p className="font-body text-xs uppercase tracking-wide text-vm-muted">
            Property
          </p>
          <p className="mt-1 flex items-start gap-2 font-heading text-lg font-semibold text-vm-navy">
            <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-vm-cyan" />
            {address || "Your scheduled clean"}
          </p>
        </div>

        <h1 className="mt-6 text-center font-heading text-xl font-semibold text-vm-navy">
          Upload your photos from this clean
        </h1>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-vm-cyan px-5 py-5 font-heading text-lg font-semibold text-vm-navy transition-opacity active:opacity-80"
        >
          <Camera className="h-7 w-7" />
          Take a photo
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-vm-border bg-vm-white px-5 py-8 text-center transition-colors active:border-vm-cyan"
        >
          <ImagePlus className="h-8 w-8 text-vm-cyan" />
          <span className="font-body text-base font-medium text-vm-text">
            Tap to choose from your photos
          </span>
          <span className="font-body text-xs text-vm-muted">
            Photos or video · up to {MAX_PHOTOS_PER_BATCH} files · HEIC OK
          </span>
        </button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*,.heic,.heif"
          capture="environment"
          className="hidden"
          onChange={onCameraChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*,.heic,.heif"
          multiple
          className="hidden"
          onChange={onGalleryChange}
        />

        {items.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 font-body text-sm font-medium text-vm-text">
              {items.length} selected
            </p>
            <PhotoQueueGrid
              items={items}
              onRemove={removeAt}
              onRetry={handleRetry}
              retryingKey={retryingKey}
            />
            <PhotoQueueWarnings items={items} />
            <PhotoQueueItemErrors items={items} />
          </div>
        )}

        <PhotoQueueMessages messages={fileMessages} />

        {submitError && (
          <p className="mt-4 rounded-lg bg-vm-danger-bg px-4 py-3 text-center font-body text-sm text-vm-danger">
            {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={uploading || readyCount === 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-vm-navy px-5 py-4 font-heading text-lg font-semibold text-vm-white transition-opacity active:opacity-80 disabled:opacity-40"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading…
            </>
          ) : readyCount > 0 ? (
            `Submit ${readyCount} Photo${readyCount === 1 ? "" : "s"}`
          ) : items.length > 0 ? (
            "All photos uploaded"
          ) : (
            "Submit Photos"
          )}
        </button>

        <p className="mt-4 pb-8 text-center font-body text-xs text-vm-muted">
          No login needed — just snap, select, and submit.
        </p>
      </main>
    </div>
  );
}
