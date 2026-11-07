"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ReservationJob = {
  id: string;
  jobReference: string | null;
  status: string;
  preferredDate: string | null;
};

type ReservationRow = {
  id: string;
  guestCheckIn: string;
  guestCheckOut: string;
  bookingSource: string | null;
  proposedCleaningDate: string | null;
  proposedCleaningWindow: string | null;
  status: string;
  jobId: string | null;
  sourceDocumentRef: string | null;
  notes: string | null;
  job: ReservationJob | null;
  layers: {
    guestReservation: string;
    cleaningPlan: string;
    cleaningJob: string;
    isCleanerAssignment: false;
    needsJob: boolean;
  };
};

function formatStayDate(day: string | null): string {
  if (!day) return "No date";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return day;
  const stamp = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(stamp);
}

const STATUS_LABEL: Record<string, string> = {
  UNCONFIRMED: "Unconfirmed plan",
  HOST_CONFIRMATION_REQUIRED: "Host confirmation required",
  CONFIRMED: "Access window confirmed",
  HELD: "Scheduling conflict",
  CANCELLED: "Cancelled",
};
const STATUS_OPTIONS = [
  "UNCONFIRMED",
  "HOST_CONFIRMATION_REQUIRED",
  "CONFIRMED",
  "HELD",
  "CANCELLED",
] as const;

export function PropertyReservations({ propertyId }: { propertyId: string }) {
  const [propertyName, setPropertyName] = useState("");
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sourceDocumentRef, setSourceDocumentRef] = useState("");
  const [importText, setImportText] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [confirmApply, setConfirmApply] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/properties/${propertyId}/reservations`, {
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load reservations");
    setPropertyName(data.property?.name || data.property?.address || "Property");
    setRows(data.reservations ?? []);
  }, [propertyId]);

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [load]);

  const saveRow = async (row: ReservationRow, patch: Record<string, unknown>) => {
    if (patch.status && patch.status !== row.status) {
      const label = STATUS_LABEL[String(patch.status)] ?? String(patch.status);
      const accepted = window.confirm(
        `Change this guest reservation to "${label}"? This does not create a cleaning job, invoice, or assignment.`
      );
      if (!accepted) return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/reservations/${row.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMessage("Reservation updated. No cleaning job was created.");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const runImport = async (mode: "preview" | "apply") => {
    if (mode === "apply") {
      const accepted = window.confirm(
        "Save these reservation rows only? This does not create cleaning jobs, invoices, offers, or messages."
      );
      if (!accepted) return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const reservations = JSON.parse(importText) as unknown;
      const res = await fetch(`/api/admin/properties/${propertyId}/reservations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          sourceDocumentRef,
          reservations,
          createJobs: false,
          options: { acceptDateChanges: false, linkExistingJobs: false, reactivateCancelled: false },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      const lines = (data.preview?.rows ?? []).map(
        (row: { sourceLineKey: string; classification: string; apply: boolean; flags?: string[] }) =>
          `${row.sourceLineKey}: ${row.classification}${row.apply ? " (will save reservation)" : " (no write)"}${
            row.flags?.includes("manual-review-required") ? " — manual review" : ""
          }`
      );
      setPreviewText(lines.join("\n") || "No rows.");
      if (mode === "apply") {
        setMessage(
          `Saved ${data.result?.created ?? 0} reservation(s) and updated ${data.result?.updated ?? 0}. No jobs were created.`
        );
        setConfirmApply(false);
        await load();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="font-body text-xs uppercase tracking-wide text-vm-muted">Guest reservations</p>
        <h1 className="font-heading text-2xl text-vm-navy">{propertyName}</h1>
        <p className="mt-2 font-body text-sm text-vm-text">
          Guest reservation, cleaning plan, and confirmed cleaning job stay separate. An unconfirmed
          reservation is not a cleaner assignment. Dates are calendar days in America/New_York.
        </p>
      </div>

      {error && <p className="font-body text-sm text-red-700">{error}</p>}
      {message && <p className="font-body text-sm text-vm-navy">{message}</p>}

      {rows.length === 0 ? (
        <p className="font-body text-sm text-vm-muted">No guest reservations are stored for this property.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="rounded-lg border border-vm-border p-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="font-body text-xs uppercase text-vm-muted">Guest reservation</p>
                  <p className="font-heading text-sm text-vm-navy">
                    {formatStayDate(row.guestCheckIn)} to {formatStayDate(row.guestCheckOut)}
                  </p>
                  <p className="font-body text-xs text-vm-muted">{row.bookingSource || "Source not recorded"}</p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase text-vm-muted">Cleaning plan</p>
                  <p className="font-body text-sm text-vm-text">
                    {`${row.status === "CONFIRMED" ? "Confirmed access window" : "Proposed only"} ${formatStayDate(row.proposedCleaningDate)}, ${row.proposedCleaningWindow || "Allowed window not recorded"}`}
                  </p>
                  <p
                    className={`mt-1 inline-block rounded px-2 py-0.5 font-body text-xs ${
                      row.status === "HELD" || row.status === "HOST_CONFIRMATION_REQUIRED"
                        ? "bg-amber-100 text-amber-900"
                        : row.status === "CONFIRMED"
                          ? "bg-vm-success-bg text-vm-success"
                          : "bg-vm-surface text-vm-muted"
                    }`}
                  >
                    {STATUS_LABEL[row.status] ?? row.status}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase text-vm-muted">Confirmed cleaning job</p>
                  <p className="font-body text-sm text-vm-text">{row.layers.cleaningJob}</p>
                  {row.job ? (
                    <Link href={`/admin/jobs/${row.job.id}`} className="font-body text-sm text-vm-navy">
                      Open {row.job.jobReference || "job"}
                    </Link>
                  ) : (
                    <p className="font-body text-xs text-vm-muted">
                      {row.layers.needsJob
                        ? "This stay still needs a cleaning job. This screen does not create one."
                        : "Held and unconfirmed stays are not dispatched."}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="font-body text-xs text-vm-muted">
                  Confirmation
                  <select
                    className="mt-1 block rounded border border-vm-border px-2 py-1 text-sm text-vm-text"
                    value={row.status}
                    disabled={busy}
                    onChange={(event) => saveRow(row, { status: event.target.value })}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="font-body text-xs text-vm-muted">
                  Access window
                  <input
                    className="mt-1 block rounded border border-vm-border px-2 py-1 text-sm text-vm-text"
                    defaultValue={row.proposedCleaningWindow ?? ""}
                    placeholder="7:00 AM - 8:00 PM"
                    disabled={busy}
                    onBlur={(event) => {
                      if (event.target.value !== (row.proposedCleaningWindow ?? "")) {
                        saveRow(row, { proposedCleaningWindow: event.target.value });
                      }
                    }}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-lg border border-vm-border p-4">
        <h2 className="font-heading text-lg text-vm-navy">Import preview</h2>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Saving here stores reservation rows only. It does not create jobs, invoices, offers, or messages.
        </p>
        <label className="mt-3 block font-body text-xs text-vm-muted">
          Source document
          <input
            className="mt-1 block w-full rounded border border-vm-border px-2 py-1 text-sm"
            value={sourceDocumentRef}
            onChange={(event) => setSourceDocumentRef(event.target.value)}
          />
        </label>
        <label className="mt-3 block font-body text-xs text-vm-muted">
          Reservation JSON
          <textarea
            className="mt-1 block min-h-28 w-full rounded border border-vm-border px-2 py-1 font-mono text-xs"
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded bg-vm-navy px-3 py-2 font-body text-sm text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => runImport("preview")}
          >
            Preview import
          </button>
          <label className="flex items-center gap-2 font-body text-xs text-vm-text">
            <input
              type="checkbox"
              checked={confirmApply}
              onChange={(event) => setConfirmApply(event.target.checked)}
            />
            Save reservation rows only
          </label>
          <button
            type="button"
            className="rounded border border-vm-navy px-3 py-2 font-body text-sm text-vm-navy disabled:opacity-50"
            disabled={busy || !confirmApply}
            onClick={() => runImport("apply")}
          >
            Save reservations
          </button>
        </div>
        {previewText && (
          <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-vm-text">{previewText}</pre>
        )}
      </div>
    </section>
  );
}
