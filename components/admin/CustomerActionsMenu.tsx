'use client';

import { useEffect, useRef, useState } from 'react';
import { Archive, Loader2, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';

type LifecycleAction = 'archive' | 'restore' | 'delete';

interface CustomerActionsMenuProps {
  customerId: string;
  customerName: string;
  isArchived: boolean;
  recordKind?: string;
  jobCount?: number;
  invoiceCount?: number;
  onChanged?: (action: LifecycleAction) => void;
}

export function CustomerActionsMenu({
  customerId,
  customerName,
  isArchived,
  recordKind = 'STANDARD',
  jobCount = 0,
  invoiceCount = 0,
  onChanged,
}: CustomerActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<LifecycleAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const run = async (action: LifecycleAction) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/lifecycle`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Action failed');
      }
      setConfirm(null);
      setOpen(false);
      onChanged?.(action);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmCopy =
    confirm === 'archive'
      ? {
          title: 'Archive customer?',
          body: `${customerName} will be hidden from the Active customer list. Jobs, invoices, and portal history stay intact.`,
          cta: 'Archive',
          danger: false,
        }
      : confirm === 'restore'
        ? {
            title: 'Restore customer?',
            body: `${customerName} will appear in the Active customer list again.`,
            cta: 'Restore',
            danger: false,
          }
        : {
            title: 'Delete permanently?',
            body:
              jobCount > 0 || invoiceCount > 0
                ? 'This customer has linked business records and cannot be deleted. Archive instead.'
                : `Permanently delete ${customerName}? This only works when there are zero jobs, invoices, payments, and other operational records.`,
            cta: 'Delete permanently',
            danger: true,
          };

  return (
    <div className="relative inline-block text-left" ref={rootRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
          setError(null);
        }}
        className="inline-flex items-center justify-center rounded-md border border-vm-border bg-vm-white p-1.5 text-vm-navy hover:bg-vm-surface"
        aria-label="Customer actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && !confirm && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-vm-border bg-vm-white py-1 shadow-lg">
          {!isArchived ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-body text-sm text-vm-text hover:bg-vm-surface"
              onClick={() => setConfirm('archive')}
            >
              <Archive className="h-4 w-4 text-vm-muted" />
              Archive customer
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-body text-sm text-vm-text hover:bg-vm-surface"
              onClick={() => setConfirm('restore')}
            >
              <RotateCcw className="h-4 w-4 text-vm-muted" />
              Restore customer
            </button>
          )}
          {recordKind !== 'SYSTEM' && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-body text-sm text-vm-danger hover:bg-vm-danger-bg"
              onClick={() => setConfirm('delete')}
            >
              <Trash2 className="h-4 w-4" />
              Delete permanently
            </button>
          )}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-vm-navy/40 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-vm-border bg-vm-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="font-heading text-lg font-semibold text-vm-navy">
              {confirmCopy.title}
            </h3>
            <p className="mt-2 font-body text-sm text-vm-muted">{confirmCopy.body}</p>
            {error && (
              <p className="mt-3 rounded-lg bg-vm-danger-bg px-3 py-2 font-body text-sm text-vm-danger">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setConfirm(null);
                  setError(null);
                }}
                className="rounded-lg border border-vm-border px-4 py-2 font-heading text-sm font-semibold text-vm-navy hover:bg-vm-surface disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(confirm)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-heading text-sm font-semibold disabled:opacity-60 ${
                  confirmCopy.danger
                    ? 'bg-vm-danger text-vm-white hover:opacity-90'
                    : 'bg-vm-navy text-vm-white hover:opacity-90'
                }`}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {confirmCopy.cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
