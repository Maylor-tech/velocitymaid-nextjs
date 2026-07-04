"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  UploadCloud,
  CheckCircle,
  Link2,
} from "lucide-react";

interface JobInfo {
  id: string;
  customerName: string | null;
  address: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  customer: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  } | null;
  branch: { name: string } | null;
}

import { useJobPhotoUpload } from "@/lib/photos/useJobPhotoUpload";
import { MAX_PHOTOS_PER_BATCH } from "@/lib/photos/cleanPhotoStorage";
import {
  PhotoQueueGrid,
  PhotoQueueItemErrors,
  PhotoQueueMessages,
  PhotoQueueWarnings,
} from "@/components/photos/PhotoQueueGrid";

export default function MarkCleanCompletePage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    items: queueItems,
    fileMessages,
    uploading,
    readyCount,
    uploadedPhotos,
    addFiles,
    removeAt,
    uploadAll,
    retryOne,
    setFileMessages,
  } = useJobPhotoUpload(jobId);

  const [retryingKey, setRetryingKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyUploadLink = async () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/cleaner/upload/${jobId}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      window.prompt("Copy this upload link:", url);
    }
  };

  const [completedBy, setCompletedBy] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [issuesFound, setIssuesFound] = useState("");
  const [supplyRequests, setSupplyRequests] = useState("");
  const [sendNotification, setSendNotification] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    name: string;
    email: string;
    notified: boolean;
  } | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/jobs/${jobId}`);
        const data = await res.json();
        if (!active) return;
        if (data.success) {
          setJob(data.job as JobInfo);
        } else {
          setLoadError(data.error || "Failed to load job");
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load job"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [jobId]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const handleRetry = async (key: string) => {
    setRetryingKey(key);
    setFormError(null);
    await retryOne(key, completedBy.trim() || "Admin");
    setRetryingKey(null);
  };

  const handleUpload = async () => {
    if (readyCount === 0) return;
    setFormError(null);
    setFileMessages([]);
    const { hasFailures } = await uploadAll(completedBy.trim() || "Admin");
    if (hasFailures) {
      setFormError(
        "Some photos did not upload. Tap Retry on each failed file, then upload again."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!completedBy.trim()) {
      setFormError("Please enter who completed the clean.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedBy: completedBy.trim(),
          cleanDurationMins: durationMins ? Number(durationMins) : undefined,
          internalNotes: internalNotes.trim() || undefined,
          issuesFound: issuesFound.trim() || undefined,
          supplyRequests: supplyRequests.trim() || undefined,
          sendNotification,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to mark complete");
      }
      const clientName =
        job?.customerName ||
        [job?.customer?.firstName, job?.customer?.lastName]
          .filter(Boolean)
          .join(" ") ||
        "The client";
      setSuccess({
        name: clientName,
        email: job?.customer?.email || "",
        notified: Boolean(data.notifiedAt),
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to mark complete");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Not scheduled";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vm-surface p-6">
        <div className="mx-auto max-w-3xl py-16 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-vm-cyan" />
          <p className="mt-4 font-body text-vm-muted">Loading job…</p>
        </div>
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className="min-h-screen bg-vm-surface p-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/admin/jobs"
            className="mb-4 inline-flex items-center font-body text-vm-cyan-dark hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
          <div className="rounded-lg border border-vm-border bg-vm-white p-6">
            <p className="font-body text-vm-danger">
              {loadError || "Job not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const clientName =
    job.customerName ||
    [job.customer?.firstName, job.customer?.lastName].filter(Boolean).join(" ") ||
    "N/A";

  if (success) {
    return (
      <div className="min-h-screen bg-vm-surface p-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-vm-success/30 bg-vm-success-bg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-vm-success" />
              <div>
                <h2 className="font-heading text-lg font-semibold text-vm-navy">
                  Clean marked complete.
                </h2>
                <p className="mt-1 font-body text-vm-text">
                  {success.notified && success.email
                    ? `${success.name} has been notified at ${success.email}.`
                    : `${success.name}'s clean was recorded. No notification email was sent.`}
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/admin/jobs"
            className="mt-6 inline-flex items-center font-body text-vm-cyan-dark hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vm-surface p-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/jobs"
          className="mb-4 inline-flex items-center font-body text-vm-cyan-dark hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>

        <h1 className="mb-6 font-heading text-2xl font-semibold text-vm-navy">
          Mark Clean Complete — {job.address || "Property"}
        </h1>

        {/* Client info (read-only) */}
        <section className="mb-6 rounded-xl border border-vm-border bg-vm-white p-6">
          <h2 className="mb-4 font-heading text-base font-semibold text-vm-navy">
            Client &amp; Booking
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-body text-xs uppercase tracking-wide text-vm-muted">
                Client
              </dt>
              <dd className="font-body text-vm-text">{clientName}</dd>
            </div>
            <div>
              <dt className="font-body text-xs uppercase tracking-wide text-vm-muted">
                Email
              </dt>
              <dd className="font-body text-vm-text">
                {job.customer?.email || "N/A"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-body text-xs uppercase tracking-wide text-vm-muted">
                Property address
              </dt>
              <dd className="font-body text-vm-text">{job.address || "N/A"}</dd>
            </div>
            <div>
              <dt className="font-body text-xs uppercase tracking-wide text-vm-muted">
                Scheduled date
              </dt>
              <dd className="font-body text-vm-text">
                {formatDate(job.preferredDate)}
                {job.preferredTime ? ` · ${job.preferredTime}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-body text-xs uppercase tracking-wide text-vm-muted">
                Branch
              </dt>
              <dd className="font-body text-vm-text">
                {job.branch?.name || "N/A"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Photo upload */}
        <section className="mb-6 rounded-xl border border-vm-border bg-vm-white p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-base font-semibold text-vm-navy">
              Upload photos from the clean
            </h2>
            <button
              type="button"
              onClick={handleCopyUploadLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-vm-navy/20 bg-vm-navy/5 px-3 py-1.5 font-heading text-xs font-semibold text-vm-navy transition-colors hover:bg-vm-navy/10"
            >
              {linkCopied ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-vm-success" />
                  Link copied!
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  Copy Caryll&apos;s upload link
                </>
              )}
            </button>
          </div>
          <p className="-mt-2 mb-4 font-body text-xs text-vm-muted">
            Text this link to the cleaner — they can upload photos from their
            phone with no login.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-vm-cyan bg-vm-cyan/5"
                : "border-vm-border hover:border-vm-cyan"
            }`}
          >
            <UploadCloud className="h-8 w-8 text-vm-cyan" />
            <p className="mt-2 font-body text-sm text-vm-text">
              Drag &amp; drop photos here, or click to choose
            </p>
            <p className="mt-1 font-body text-xs text-vm-muted">
              JPG, PNG, WebP, HEIC, MP4 · up to {MAX_PHOTOS_PER_BATCH} files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.heic,.heif"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {queueItems.length > 0 && (
            <div className="mt-4">
              <PhotoQueueGrid
                items={queueItems}
                onRemove={removeAt}
                onRetry={handleRetry}
                retryingKey={retryingKey}
              />
              <PhotoQueueWarnings items={queueItems} />
              <PhotoQueueItemErrors items={queueItems} />
              {readyCount > 0 && (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-vm-navy px-4 py-2 font-heading text-sm font-semibold text-vm-white disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      Upload {readyCount} photo
                      {readyCount > 1 ? "s" : ""}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <PhotoQueueMessages messages={fileMessages} />

          {uploadedPhotos.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 font-body text-sm font-medium text-vm-text">
                {uploadedPhotos.length} photo
                {uploadedPhotos.length > 1 ? "s" : ""} uploaded
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {uploadedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-lg border border-vm-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt="Uploaded clean photo"
                      className="h-24 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Completion form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-vm-border bg-vm-white p-6"
        >
          <h2 className="mb-4 font-heading text-base font-semibold text-vm-navy">
            Completion details
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="completedBy"
                className="mb-1 block font-body text-sm font-medium text-vm-text"
              >
                Completed by
              </label>
              <input
                id="completedBy"
                type="text"
                value={completedBy}
                onChange={(e) => setCompletedBy(e.target.value)}
                placeholder="Cleaner name"
                className="w-full rounded-lg border border-vm-border px-3 py-2 font-body text-vm-text outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30"
              />
            </div>

            <div>
              <label
                htmlFor="duration"
                className="mb-1 block font-body text-sm font-medium text-vm-text"
              >
                Duration
              </label>
              <input
                id="duration"
                type="number"
                min={0}
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                placeholder="Minutes (e.g. 150 for 2.5hrs)"
                className="w-full rounded-lg border border-vm-border px-3 py-2 font-body text-vm-text outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30"
              />
            </div>

            <div>
              <label
                htmlFor="internalNotes"
                className="mb-1 block font-body text-sm font-medium text-vm-text"
              >
                Internal notes
              </label>
              <textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                placeholder="Notes for VelocityMaid only — not sent to client"
                className="w-full rounded-lg border border-vm-border px-3 py-2 font-body text-vm-text outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30"
              />
            </div>

            <div>
              <label htmlFor="issuesFound" className="mb-1 block font-body text-sm font-medium text-vm-text">
                Issues found (included in completion report)
              </label>
              <textarea
                id="issuesFound"
                value={issuesFound}
                onChange={(e) => setIssuesFound(e.target.value)}
                rows={2}
                placeholder="Any damage, maintenance, or guest issues noticed"
                className="w-full rounded-lg border border-vm-border px-3 py-2 font-body text-vm-text outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30"
              />
            </div>

            <div>
              <label htmlFor="supplyRequests" className="mb-1 block font-body text-sm font-medium text-vm-text">
                Supply requests
              </label>
              <textarea
                id="supplyRequests"
                value={supplyRequests}
                onChange={(e) => setSupplyRequests(e.target.value)}
                rows={2}
                placeholder="Items to restock or replace for the host"
                className="w-full rounded-lg border border-vm-border px-3 py-2 font-body text-vm-text outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30"
              />
            </div>

            <div className="rounded-lg bg-vm-surface p-4">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="font-body text-sm font-medium text-vm-text">
                  Send notification email to client
                </span>
                <span className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={sendNotification}
                    onChange={(e) => setSendNotification(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="h-6 w-11 rounded-full bg-vm-border transition-colors peer-checked:bg-vm-cyan" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-vm-white transition-transform peer-checked:translate-x-5" />
                </span>
              </label>

              {sendNotification && (
                <div className="mt-4 rounded-lg border border-vm-border bg-vm-white p-4">
                  <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-wide text-vm-muted">
                    Client will receive
                  </p>
                  <ul className="space-y-1 font-body text-sm text-vm-text">
                    <li>
                      • Subject: “Your VelocityMaid clean is complete —{" "}
                      {job.address || "your property"}”
                    </li>
                    <li>• A clean summary (property, date, duration)</li>
                    <li>
                      • {uploadedPhotos.length} photo
                      {uploadedPhotos.length === 1 ? "" : "s"} from the clean
                    </li>
                    <li>• A PayPal payment link (if a balance is due)</li>
                  </ul>
                  <p className="mt-2 font-body text-xs text-vm-muted">
                    Sent to {job.customer?.email || "the client's email on file"}
                  </p>
                </div>
              )}
            </div>

            {formError && (
              <p className="font-body text-sm text-vm-danger">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-vm-cyan px-4 py-3 font-heading font-semibold text-vm-navy transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : sendNotification ? (
                "Mark Complete & Notify Client"
              ) : (
                "Mark Complete"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
