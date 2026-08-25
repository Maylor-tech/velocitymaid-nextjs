'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { InvoiceForm, type InvoiceFormValues } from '@/components/invoices/InvoiceForm';
import {
  SendInvoiceDialog,
  type SendInvoicePayload,
  type SendInvoiceResponse,
} from '@/components/admin/invoices/SendInvoiceDialog';

export default function NewInvoicePage() {
  const router = useRouter();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdNumber, setCreatedNumber] = useState<string | undefined>(undefined);
  const [showSend, setShowSend] = useState(false);

  const handleSubmit = async (values: InvoiceFormValues, markSent: boolean) => {
    // Always create a DRAFT. Issuing is never done in this ungated create step
    // (Incident #001 P5) — if the operator chose "mark sent", route the send
    // through the gated dialog against the newly created draft.
    const res = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create invoice');

    if (markSent) {
      setCreatedId(data.invoice.id);
      setCreatedNumber(data.invoice.invoiceNumber);
      setShowSend(true);
    } else {
      router.push(`/admin/invoices/${data.invoice.id}`);
    }
  };

  const sendInvoice = async (payload: SendInvoicePayload): Promise<SendInvoiceResponse> => {
    const res = await fetch(`/api/admin/invoices/${createdId}/send`, {
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
    // The draft is created regardless of send outcome; land on its detail page.
    if (createdId) router.push(`/admin/invoices/${createdId}`);
  };

  const handleClose = () => {
    setShowSend(false);
    // Draft already exists — go to it so the operator can send later.
    if (createdId) router.push(`/admin/invoices/${createdId}`);
  };

  return (
    <div className="p-7">
      <Link href="/admin/invoices" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </Link>
      <h1 className="mb-6 font-heading text-2xl font-bold text-vm-navy">Create invoice</h1>
      <div className="max-w-4xl rounded-xl border border-vm-border bg-vm-white p-6">
        <InvoiceForm onSubmit={handleSubmit} submitLabel="Save draft" />
      </div>

      <SendInvoiceDialog
        open={showSend}
        invoiceLabel={createdNumber}
        onClose={handleClose}
        onSent={handleSent}
        send={sendInvoice}
      />
    </div>
  );
}
