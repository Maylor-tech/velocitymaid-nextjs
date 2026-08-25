'use client';

/**
 * Incident #001 — Phase 1 send-dialog (operator surface for the API send gate).
 *
 * This dialog is a thin surface over the already-enforced server gate
 * (`validateInvoiceSendable`). It never decides whether a send is allowed; it
 * collects exactly what the API contract requires:
 *   - required reimbursement-completeness confirmation (C8b), and
 *   - explicit acknowledgement (with a reason) for the only two overridable
 *     warnings: job-total mismatch and recent-send conflict.
 *
 * Hard validation errors are shown read-only with NO override control. The
 * transport is injected via `send` so the same dialog works for both the direct
 * invoice send route and the job-billing send action.
 */

import { useState } from 'react';
import { AlertTriangle, Loader2, ShieldCheck, XCircle } from 'lucide-react';

export interface SendInvoiceFinding {
  code: string;
  message: string;
}

export interface SendInvoicePayload {
  reimbursementsConfirmed: boolean;
  acknowledgeWarnings: string[];
  acknowledgeWarningReasons: Record<string, string>;
}

export interface SendInvoiceResponse {
  status: number;
  success: boolean;
  code?: string;
  error?: string;
  errors?: SendInvoiceFinding[];
  warnings?: SendInvoiceFinding[];
  email?: { sent: boolean; skippedReason?: string };
}

interface SendInvoiceDialogProps {
  open: boolean;
  invoiceLabel?: string;
  onClose: () => void;
  onSent: (response: SendInvoiceResponse) => void;
  send: (payload: SendInvoicePayload) => Promise<SendInvoiceResponse>;
}

const CONFIRM_LABEL =
  'I confirm all known reimbursements, purchases, errands, and approved add-ons have been added to this invoice, or none exist.';

const WARNING_TITLES: Record<string, string> = {
  INVOICE_JOB_TOTAL_MISMATCH: 'Invoice total differs from the job total',
  INVOICE_RECENT_SEND_CONFLICT: 'Another invoice was sent to this customer/property recently',
};

export function SendInvoiceDialog({
  open,
  invoiceLabel,
  onClose,
  onSent,
  send,
}: SendInvoiceDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [warnings, setWarnings] = useState<SendInvoiceFinding[]>([]);
  const [acks, setAcks] = useState<Record<string, { checked: boolean; reason: string }>>({});
  const [errors, setErrors] = useState<SendInvoiceFinding[]>([]);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const allWarningsAcknowledged =
    warnings.length === 0 ||
    warnings.every((w) => acks[w.code]?.checked && acks[w.code]?.reason.trim().length > 0);

  const canSubmit = confirmed && allWarningsAcknowledged && !submitting;

  const reset = () => {
    setConfirmed(false);
    setWarnings([]);
    setAcks({});
    setErrors([]);
    setNotice('');
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setNotice('');
    setErrors([]);
    try {
      const acknowledgeWarnings = warnings.filter((w) => acks[w.code]?.checked).map((w) => w.code);
      const acknowledgeWarningReasons: Record<string, string> = {};
      for (const code of acknowledgeWarnings) {
        acknowledgeWarningReasons[code] = acks[code]?.reason.trim() ?? '';
      }

      const res = await send({
        reimbursementsConfirmed: confirmed,
        acknowledgeWarnings,
        acknowledgeWarningReasons,
      });

      if (res.success) {
        onSent(res);
        reset();
        return;
      }

      if (res.code === 'INVOICE_SEND_WARNINGS' && res.warnings?.length) {
        setWarnings(res.warnings);
        setAcks((prev) => {
          const next = { ...prev };
          for (const w of res.warnings!) {
            if (!next[w.code]) next[w.code] = { checked: false, reason: '' };
          }
          return next;
        });
        setNotice('Review and acknowledge the warning(s) below to continue.');
        return;
      }

      if (res.code === 'INVOICE_SEND_BLOCKED' && res.errors?.length) {
        setErrors(res.errors);
        return;
      }

      if (res.code === 'INVOICE_ALREADY_SENT') {
        setNotice('This invoice was already sent. Nothing more to do.');
        // Surface upstream so the parent can refresh state.
        onSent(res);
        return;
      }

      if (res.code === 'INVOICE_SENT_EMAIL_FAILED') {
        setNotice(
          res.error ||
            'Invoice was marked sent but the email failed to dispatch. Retry sending the email.'
        );
        onSent(res);
        return;
      }

      setNotice(res.error || 'Failed to send invoice.');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to send invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
      <div className="w-full max-w-lg rounded-xl bg-vm-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-vm-cyan-dark" />
          <div>
            <h3 className="font-heading text-lg font-bold text-vm-navy">
              Send invoice{invoiceLabel ? ` ${invoiceLabel}` : ''}
            </h3>
            <p className="font-body text-sm text-vm-muted">
              Confirm the invoice is complete before it is emailed to the client.
            </p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 rounded-lg border border-vm-danger/30 bg-vm-danger-bg p-3">
            <p className="mb-1 flex items-center gap-2 font-heading text-sm font-semibold text-vm-danger">
              <XCircle className="h-4 w-4" /> This invoice cannot be sent
            </p>
            <ul className="ml-6 list-disc space-y-1 font-body text-sm text-vm-danger">
              {errors.map((e) => (
                <li key={e.code}>{e.message}</li>
              ))}
            </ul>
            <p className="mt-2 font-body text-xs text-vm-danger/80">
              These are hard validation failures and cannot be overridden. Fix the invoice and try again.
            </p>
          </div>
        )}

        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-vm-border bg-vm-surface/50 p-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-vm-cyan"
          />
          <span className="font-body text-sm text-vm-navy">{CONFIRM_LABEL}</span>
        </label>

        {warnings.length > 0 && (
          <div className="mb-4 space-y-3">
            {warnings.map((w) => {
              const ack = acks[w.code] ?? { checked: false, reason: '' };
              return (
                <div key={w.code} className="rounded-lg border border-vm-warning/40 bg-vm-warning-bg p-3">
                  <p className="mb-1 flex items-center gap-2 font-heading text-sm font-semibold text-vm-warning">
                    <AlertTriangle className="h-4 w-4" />
                    {WARNING_TITLES[w.code] ?? 'Warning'}
                  </p>
                  <p className="mb-2 font-body text-sm text-vm-navy">{w.message}</p>
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={ack.checked}
                      onChange={(e) =>
                        setAcks((prev) => ({
                          ...prev,
                          [w.code]: { ...ack, checked: e.target.checked },
                        }))
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-vm-warning"
                    />
                    <span className="font-body text-sm text-vm-navy">
                      Acknowledge and send anyway
                    </span>
                  </label>
                  {ack.checked && (
                    <textarea
                      rows={2}
                      required
                      value={ack.reason}
                      onChange={(e) =>
                        setAcks((prev) => ({
                          ...prev,
                          [w.code]: { ...ack, reason: e.target.value },
                        }))
                      }
                      placeholder="Reason (required) — why is sending correct despite this warning?"
                      className="mt-2 w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {notice && (
          <p className="mb-4 rounded-lg bg-vm-surface px-3 py-2 font-body text-sm text-vm-navy">{notice}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-vm-cyan py-2.5 font-heading text-sm font-bold uppercase tracking-wider text-vm-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {warnings.length > 0 ? 'Acknowledge & send' : 'Send invoice'}
          </button>
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="flex-1 rounded-lg border border-vm-border py-2.5 font-body text-sm text-vm-navy disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
