'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  Receipt,
  Mail,
  Star,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import type { JobBillingWorkflowStatus } from '@/lib/billing/jobBillingSteps';

interface JobBillingWorkflowPanelProps {
  jobId: string;
  jobCompleted: boolean;
}

type StepKey = keyof JobBillingWorkflowStatus['steps'];

const STEP_ORDER: StepKey[] = [
  'completionReport',
  'invoice',
  'payment',
  'receipt',
  'reviewRequest',
];

const STEP_LABELS: Record<StepKey, string> = {
  completionReport: 'Completion report',
  invoice: 'Invoice',
  payment: 'Payment recorded',
  receipt: 'Receipt',
  reviewRequest: 'Review request',
};

function stateIcon(state: string) {
  if (state === 'done') return <CheckCircle2 className="h-5 w-5 text-vm-success" />;
  if (state === 'ready') return <Circle className="h-5 w-5 text-vm-cyan" />;
  return <Circle className="h-5 w-5 text-vm-muted/40" />;
}

export function JobBillingWorkflowPanel({ jobId, jobCompleted }: JobBillingWorkflowPanelProps) {
  const [workflow, setWorkflow] = useState<JobBillingWorkflowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CHECK');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/billing`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setWorkflow(data.workflow);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runAction = async (action: string, body: Record<string, unknown> = {}) => {
    setBusy(action);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Action failed');
      if (data.email?.skippedReason) {
        setMessage(`Done (email skipped: ${data.email.skippedReason})`);
      } else if (data.email && !data.email.sent) {
        setMessage('Saved — email not sent (check Resend config)');
      } else {
        setMessage('Success');
      }
      await refresh();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  if (loading && !workflow) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!workflow) return null;

  const s = workflow.steps;

  return (
    <div className="rounded-xl border border-vm-border bg-vm-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold text-vm-navy">
            Billing &amp; completion workflow
          </h2>
          <p className="font-body text-sm text-vm-muted">
            Document the service, invoice the client, record payment, and request a review.
          </p>
        </div>
        {!jobCompleted && (
          <span className="rounded-full bg-vm-warning-bg px-3 py-1 font-body text-xs font-medium text-vm-warning">
            Mark job complete first for full workflow
          </span>
        )}
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-vm-surface px-3 py-2 font-body text-sm text-vm-navy">{message}</p>
      )}

      <ol className="mb-6 space-y-3">
        {STEP_ORDER.map((key) => {
          const step = s[key];
          const state = 'state' in step ? step.state : 'pending';
          return (
            <li
              key={key}
              className="flex items-start gap-3 rounded-lg border border-vm-border/60 bg-vm-surface/50 px-4 py-3"
            >
              {stateIcon(state)}
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-vm-navy">{STEP_LABELS[key]}</p>
                {key === 'completionReport' && s.completionReport.reportNumber && (
                  <p className="font-body text-xs text-vm-muted">
                    #{s.completionReport.reportNumber}
                    {s.completionReport.status ? ` · ${s.completionReport.status}` : ''}
                  </p>
                )}
                {key === 'invoice' && s.invoice.invoiceNumber && (
                  <p className="font-body text-xs text-vm-muted">
                    #{s.invoice.invoiceNumber}
                    {s.invoice.balanceDueFormatted ? ` · Due ${s.invoice.balanceDueFormatted}` : ''}
                  </p>
                )}
                {key === 'payment' && s.payment.amountPaidFormatted && (
                  <p className="font-body text-xs text-vm-muted">
                    Paid {s.payment.amountPaidFormatted}
                    {s.payment.balanceDueFormatted !== '$0.00'
                      ? ` · Balance ${s.payment.balanceDueFormatted}`
                      : ''}
                  </p>
                )}
                {key === 'receipt' && s.receipt.count > 0 && (
                  <p className="font-body text-xs text-vm-muted">
                    {s.receipt.count} receipt(s)
                    {s.receipt.latestReceiptNumber ? ` · #${s.receipt.latestReceiptNumber}` : ''}
                  </p>
                )}
                {key === 'reviewRequest' && s.reviewRequest.sentAt && (
                  <p className="font-body text-xs text-vm-muted">Sent</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide ${
                  state === 'done'
                    ? 'bg-vm-success-bg text-vm-success'
                    : state === 'ready'
                      ? 'bg-vm-cyan-tint text-vm-cyan-dark'
                      : 'bg-vm-surface text-vm-muted'
                }`}
              >
                {state}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        <ActionButton
          busy={busy === 'generate_report'}
          disabled={!!busy}
          icon={<FileText className="h-4 w-4" />}
          label="Generate report"
          onClick={() => runAction('generate_report', { sendEmail: true })}
        />
        <ActionButton
          busy={busy === 'generate_invoice'}
          disabled={!!busy || !!s.invoice.invoiceId}
          icon={<DollarSign className="h-4 w-4" />}
          label={s.invoice.invoiceId ? 'Invoice linked' : 'Generate invoice'}
          onClick={() => runAction('generate_invoice')}
        />
        <ActionButton
          busy={busy === 'send_invoice'}
          disabled={!!busy || !s.invoice.invoiceId}
          icon={<Mail className="h-4 w-4" />}
          label="Send invoice"
          onClick={() => runAction('send_invoice')}
        />
        <ActionButton
          busy={busy === 'generate_receipt'}
          disabled={!!busy || s.payment.paymentCount === 0}
          icon={<Receipt className="h-4 w-4" />}
          label="Generate receipt"
          onClick={() => runAction('generate_receipt', { sendEmail: true })}
        />
        <ActionButton
          busy={busy === 'send_review'}
          disabled={!!busy}
          icon={<Star className="h-4 w-4" />}
          label="Send review request"
          onClick={() => runAction('send_review')}
        />
      </div>

      {s.invoice.invoiceId && s.payment.state !== 'done' && (
        <div className="mt-4 rounded-lg border border-vm-border p-4">
          <p className="mb-2 font-body text-sm font-medium text-vm-navy">Record payment</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="rounded-lg border border-vm-border px-3 py-2 font-body text-sm"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-lg border border-vm-border px-3 py-2 font-body text-sm"
            >
              {['CHECK', 'CASH', 'STRIPE', 'ZELLE', 'VENMO', 'BANK_TRANSFER', 'OTHER'].map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!!busy || !paymentAmount}
              onClick={() =>
                runAction('record_payment', {
                  amount: Number(paymentAmount),
                  paymentMethod,
                  sendEmails: true,
                })
              }
              className="rounded-lg bg-vm-navy px-4 py-2 font-body text-sm font-semibold text-white hover:bg-vm-navy/90 disabled:opacity-50"
            >
              {busy === 'record_payment' ? 'Recording…' : 'Record payment'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 font-body text-xs">
        {s.completionReport.viewUrl && (
          <a href={s.completionReport.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-vm-cyan-dark hover:underline">
            View report <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {s.invoice.viewUrl && (
          <a href={s.invoice.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-vm-cyan-dark hover:underline">
            View invoice <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {s.invoice.invoiceId && (
          <Link href={`/admin/invoices/${s.invoice.invoiceId}/edit`} className="text-vm-cyan-dark hover:underline">
            Edit invoice (line items &amp; email) →
          </Link>
        )}
        {s.invoice.invoiceId && (
          <Link href={`/admin/invoices/${s.invoice.invoiceId}`} className="text-vm-cyan-dark hover:underline">
            Admin invoice →
          </Link>
        )}
        {s.receipt.viewUrl && (
          <a href={s.receipt.viewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-vm-cyan-dark hover:underline">
            View receipt <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  busy,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="inline-flex items-center gap-2 rounded-lg border border-vm-border bg-vm-white px-3 py-2 font-body text-sm font-medium text-vm-navy hover:bg-vm-surface disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}
