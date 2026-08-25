'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { InvoiceForm, type InvoiceFormValues } from '@/components/invoices/InvoiceForm';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import {
  SendInvoiceDialog,
  type SendInvoicePayload,
  type SendInvoiceResponse,
} from '@/components/admin/invoices/SendInvoiceDialog';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/invoices/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvoice(d.invoice);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (values: InvoiceFormValues, markSent: boolean) => {
    // Never escalate status via PATCH — issuing goes through the send gate.
    const res = await fetch(`/api/admin/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to update invoice');
    if (markSent) {
      // Open the send dialog so the operator completes the reimbursement gate.
      setShowSend(true);
    } else {
      router.push(`/admin/invoices/${id}`);
    }
  };

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

  const handleSent = () => {
    setShowSend(false);
    router.push(`/admin/invoices/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-7 font-body text-sm text-vm-muted">Invoice not found.</div>
    );
  }

  return (
    <div className="p-7">
      <Link href={`/admin/invoices/${id}`} className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to invoice
      </Link>
      <h1 className="mb-6 font-heading text-2xl font-bold text-vm-navy">Edit {invoice.invoiceNumber}</h1>
      <div className="max-w-4xl rounded-xl border border-vm-border bg-vm-white p-6">
        <InvoiceForm initial={invoice} onSubmit={handleSubmit} submitLabel="Save changes" />
      </div>

      <SendInvoiceDialog
        open={showSend}
        invoiceLabel={invoice.invoiceNumber}
        onClose={() => setShowSend(false)}
        onSent={handleSent}
        send={sendInvoice}
      />
    </div>
  );
}
