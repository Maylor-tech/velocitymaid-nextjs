"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  Loader2,
  CheckCircle,
  X,
  Film,
  MapPin,
} from "lucide-react";

interface Props {
  jobId: string;
  address: string | null;
}

const MAX_FILES = 20;

export default function CleanerUploadClient({ jobId, address }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const list = Array.from(incoming).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (list.length === 0) return;
    setError(null);
    setFiles((prev) => [...prev, ...list].slice(0, MAX_FILES));
    setPreviews((prev) =>
      [
        ...prev,
        ...list.map((f) =>
          f.type.startsWith("image/") ? URL.createObjectURL(f) : ""
        ),
      ].slice(0, MAX_FILES)
    );
  }, []);

  const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("uploadedBy", "Cleaner (mobile)");

      const res = await fetch(`/api/jobs/${jobId}/photos`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Upload failed. Please try again.");
      }
      previews.forEach((url) => url && URL.revokeObjectURL(url));
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface p-6">
        <div className="w-full max-w-sm rounded-2xl border border-green-200 bg-vm-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-vm-success-bg">
            <CheckCircle className="h-9 w-9 text-green-600" />
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
      {/* Header */}
      <header className="bg-vm-navy px-5 py-5 text-center">
        <span className="font-heading text-lg font-bold uppercase tracking-widest text-vm-white">
          VelocityMaid
        </span>
      </header>

      <main className="mx-auto max-w-md px-5 py-6">
        {/* Property */}
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

        {/* Camera (opens phone camera directly) */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-vm-cyan px-5 py-5 font-heading text-lg font-semibold text-vm-navy transition-opacity active:opacity-80"
        >
          <Camera className="h-7 w-7" />
          Take a photo
        </button>

        {/* Tap-to-upload area (gallery) */}
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
            Photos or video · up to {MAX_FILES} files
          </span>
        </button>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={onCameraChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={onGalleryChange}
        />

        {/* Thumbnails */}
        {files.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 font-body text-sm font-medium text-vm-text">
              {files.length} selected
            </p>
            <div className="grid grid-cols-3 gap-3">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="relative overflow-hidden rounded-xl border border-vm-border bg-vm-white"
                >
                  {previews[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previews[i]}
                      alt={file.name}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center bg-vm-surface">
                      <Film className="h-7 w-7 text-vm-muted" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-vm-navy/80 p-1.5 text-vm-white"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center font-body text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || files.length === 0}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-vm-navy px-5 py-4 font-heading text-lg font-semibold text-vm-white transition-opacity active:opacity-80 disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Uploading…
            </>
          ) : files.length > 0 ? (
            `Submit ${files.length} Photo${files.length === 1 ? "" : "s"}`
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
