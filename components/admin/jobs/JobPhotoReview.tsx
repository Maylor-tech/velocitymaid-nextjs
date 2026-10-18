"use client";

import { useCallback, useEffect, useState } from "react";

interface ReviewPhoto {
  id: string;
  url: string;
  caption: string | null;
  category: string;
  slotKey: string | null;
}

interface ReviewSlot {
  key: string;
  label: string;
  required: boolean;
}

interface ReviewState {
  status: string;
  customerEmail: string | null;
  checklist: {
    arrivalCondition: "NORMAL" | "ISSUES" | null;
    slots: ReviewSlot[];
    photos: ReviewPhoto[];
    finish: {
      ok: boolean;
      missingAfter: Array<{ key: string; label: string }>;
    };
  };
  report: { status: string; publicToken: string; sentAt: string | null } | null;
  invoicePublicToken: string | null;
}

export function JobPhotoReview({ jobId }: { jobId: string }) {
  const [review, setReview] = useState<ReviewState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/jobs/${jobId}/photo-review`);
    const data = await res.json();
    if (res.ok) setReview(data as ReviewState);
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (body: Record<string, string>) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/photo-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (body.action === "send") setMessage("Report link sent. It was not sent automatically.");
      if (body.action === "approve") setMessage("Report approved. Send it when you are ready.");
      if (body.action === "override-finish") setMessage(data.message || "Submitted for QC.");
      if (body.action === "retake") setMessage("Retake requested. The slot is open again.");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  if (!review) return null;

  const groups = review.checklist.slots.map((slot) => ({
    slot,
    photos: review.checklist.photos.filter((photo) => photo.slotKey === slot.key),
  }));
  const unslotted = review.checklist.photos.filter((photo) => !photo.slotKey);

  return (
    <section className="rounded-lg border border-vm-border bg-vm-white p-6">
      <h2 className="font-semibold text-lg text-vm-navy mb-1">Photo review</h2>
      <p className="text-sm text-vm-muted mb-4">
        Arrival: {review.checklist.arrivalCondition === "ISSUES" ? "Issues" : review.checklist.arrivalCondition === "NORMAL" ? "Normal" : "Not recorded"}
        {review.report ? ` · Report ${review.report.status}` : " · No report yet"}
      </p>
      {!review.checklist.finish.ok && review.status === "IN_PROGRESS" && (
        <div className="mb-4 rounded-lg border border-vm-border bg-vm-surface p-3 text-sm text-vm-navy">
          <p className="mb-2">
            Missing required after photos:{" "}
            {review.checklist.finish.missingAfter.map((item) => item.label).join(", ") || "see arrival"}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act({ action: "override-finish" })}
            className="rounded-lg border border-vm-border px-3 py-2 text-sm font-semibold text-vm-navy"
          >
            Admin override — submit for QC
          </button>
        </div>
      )}
      <div className="space-y-4">
        {groups.map(({ slot, photos }) => (
          <div key={slot.key}>
            <p className="text-sm font-semibold text-vm-navy mb-2">
              {slot.label}
              {slot.required ? " · required" : ""}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.length === 0 && (
                <p className="text-xs text-vm-muted">No photo</p>
              )}
              {photos.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-lg border border-vm-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={slot.label} className="h-28 w-full object-cover" />
                  <figcaption className="flex items-center justify-between gap-2 px-2 py-1">
                    <span className="text-xs text-vm-muted">{photo.category}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act({ action: "retake", photoId: photo.id })}
                      className="text-xs font-semibold text-vm-navy"
                    >
                      Request retake
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
        {unslotted.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-vm-navy mb-2">Other photos</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {unslotted.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-lg border border-vm-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption || photo.category} className="h-28 w-full object-cover" />
                  <figcaption className="px-2 py-1 text-xs text-vm-muted">
                    {photo.caption || photo.category}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void act({ action: "approve" })}
          className="rounded-lg bg-vm-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy || !review.report || !review.customerEmail}
          onClick={() => void act({ action: "send" })}
          className="rounded-lg border border-vm-border px-4 py-2 text-sm font-semibold text-vm-navy disabled:opacity-50"
        >
          Send report
        </button>
        {review.report && (
          <a
            href={`/report/${review.report.publicToken}`}
            className="rounded-lg border border-vm-border px-4 py-2 text-sm font-semibold text-vm-navy"
          >
            Open report
          </a>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-vm-success">{message}</p>}
      {error && <p className="mt-3 text-sm text-vm-danger">{error}</p>}
    </section>
  );
}
