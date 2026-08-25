'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Loader2,
  Mail,
  Pencil,
  Printer,
  Send,
} from 'lucide-react';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument';
import {
  SendInvoiceDialog,
  type SendInvoicePayload,
  type SendInvoiceResponse,
} from '@/components/admin/invoices/SendInvoiceDialog';
import type { InvoicePaymentMethod } from '@prisma/client';

const PAYMENT_METHODS: InvoicePaymentMethod[] = [
  'CASH', 'CHECK', 'STRIPE', 'ZELLE', 'VENMO', 'BANK_TRANSFER', 'OTHER',
];

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>('CHECK');
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/invoices/${id}`);
    const data = await res.json();
    if (data.success) setInvoice(data.invoice);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const sendInvoice = async (payload: SendInvoicePayload): Promise<SendInvoiceResponse> => {
    const res = await fetch(`/api/admin/invoices/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return {
      status: res.status,
      success: !!data.success,
      code: data.code,
      error: data.error,
      errors: data.errors,
      warnings: data.warnings,
      email: data.email,
    };
  };

  const handleSent = (res: SendInvoiceResponse) => {
    setShowSend(false);
    if (res.success) {
      setToast(res.email?.sent === false ? 'Invoice sent (email not dispatched)' : 'Invoice sent');
    } else if (res.code === 'INVOICE_ALREADY_SENT') {
      setToast('Invoice was already sent');
    } else if (res.code === 'INVOICE_SENT_EMAIL_FAILED') {
      setToast('Invoice marked sent — email failed, retry from Send email');
    }
    load();
    setTimeout(() => setToast(''), 4000);
  };

  const action = async (path: string, body?: object) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/${path}`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setToast('Done');
      if (data.invoice) setInvoice(data.invoice);
      else await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
      setTimeout(() => setToast(''), 3000);
    }
  };

  if (loading || !invoice) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/${invoice.publicToken}`;

  return (
    <div className="p-7 print:p-0">
      <div className="mb-6 print:hidden">
        <Link href="/admin/invoices" className="inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Invoices
        </Link>
        {toast && (
          <p className="mt-2 rounded-lg bg-vm-navy px-4 py-2 font-body text-sm text-vm-white">{toast}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => window.print()}
            className="inline-flex items-center gap-1 rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy hover:bg-vm-surface">
            <Printer className="h-4 w-4" /> Print
          </button>
          <Link href={`/admin/invoices/${id}/edit`}
            className="inline-flex items-center gap-1 rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy hover:bg-vm-surface">
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          {invoice.status === 'DRAFT' && (
            <button type="button" disabled={busy} onClick={() => setShowSend(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-vm-cyan px-3 py-2 font-body text-sm font-semibold text-vm-navy">
              <Send className="h-4 w-4" /> Send invoice
            </button>
          )}
          {invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
            <button type="button" disabled={busy} onClick={() => action('remind')}
              className="inline-flex items-center gap-1 rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy">
              <Mail className="h-4 w-4" /> Send reminder
            </button>
          )}
          {invoice.balanceDue > 0 && invoice.status !== 'CANCELLED' && (
            <>
              <button type="button" onClick={() => { setPaymentAmount(String(invoice.balanceDue)); setShowPayment(true); }}
                className="inline-flex items-center gap-1 rounded-lg bg-vm-navy px-3 py-2 font-body text-sm font-semibold text-vm-white">
                Add payment
              </button>
              <button type="button" disabled={busy} onClick={() => action('mark-paid')}
                className="inline-flex items-center gap-1 rounded-lg bg-vm-success px-3 py-2 font-body text-sm font-semibold text-vm-white">
                <CheckCircle2 className="h-4 w-4" /> Mark paid
              </button>
            </>
          )}
          {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
            <button type="button" disabled={busy} onClick={() => action('cancel')}
              className="inline-flex items-center gap-1 rounded-lg border border-vm-danger/30 px-3 py-2 font-body text-sm text-vm-danger">
              <Ban className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
        <p className="mt-3 font-body text-xs text-vm-muted">
          Client link: <a href={publicUrl} className="text-vm-cyan-dark underline" target="_blank" rel="noreferrer">{publicUrl}</a>
        </p>
      </div>

      <InvoiceDocument invoice={invoice} />

      {invoice.payments.length > 0 && (
        <div className="mt-6 rounded-xl border border-vm-border bg-vm-white p-6 print:hidden">
          <h2 className="mb-4 font-heading text-lg font-semibold text-vm-navy">Payment history</h2>
          <ul className="space-y-2">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 border-b border-vm-border py-2 font-body text-sm">
                <span>{p.paymentDateFormatted} · {p.paymentMethod}</span>
                <span className="font-semibold text-vm-success">{p.amountFormatted}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <SendInvoiceDialog
        open={showSend}
        invoiceLabel={invoice.invoiceNumber}
        onClose={() => setShowSend(false)}
        onSent={handleSent}
        send={sendInvoice}
      />

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
          <div className="w-full max-w-md rounded-xl bg-vm-white p-6 shadow-xl">
            <h3 className="font-heading text-lg font-bold text-vm-navy">Record payment</h3>
            <div className="mt-4 space-y-3">
              <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm" placeholder="Amount" />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as InvoicePaymentMethod)}
                className="w-full rounded-lg border border-vm-border px-3 py-2 text-sm">
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={busy} onClick={async () => {
                await action('payments', { amount: Number(paymentAmount), paymentMethod });
                setShowPayment(false);
              }} className="flex-1 rounded-lg bg-vm-navy py-2 text-sm font-semibold text-white">Save</button>
              <button type="button" onClick={() => setShowPayment(false)} className="flex-1 rounded-lg border py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
