'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument';
import { SERVICE_INVOICE_ZELLE_SECONDARY } from '@/lib/tips/zelleDestination';

type InvoiceZelleInfo = {
  label: string;
  handle: string;
  secondaryText: string;
};

export default function PublicInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const [invoice, setInvoice] = useState<SerializedInvoice | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [zelle, setZelle] = useState<InvoiceZelleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const paidBanner = searchParams.get('paid') === '1';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/invoice/${token}`);
    const data = await res.json();
    if (data.success) {
      setInvoice(data.invoice);
      setStripeConfigured(data.stripeConfigured);
      if (data.zelle?.label && data.zelle?.handle) {
        setZelle({
          label: data.zelle.label,
          handle: data.zelle.handle,
          secondaryText: data.zelle.secondaryText || SERVICE_INVOICE_ZELLE_SECONDARY,
        });
      }
    } else {
      setError(data.error || 'Invoice not found');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/invoice/${token}/checkout`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || 'Unable to start checkout');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-navy">
        <Loader2 className="h-10 w-10 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-navy px-4">
        <div className="rounded-xl bg-vm-white p-8 text-center shadow-lg">
          <p className="font-heading text-lg font-bold text-vm-navy">Invoice unavailable</p>
          <p className="mt-2 font-body text-sm text-vm-muted">{error || 'This link may have expired.'}</p>
        </div>
      </div>
    );
  }

  const canPay = stripeConfigured && invoice.balanceDue > 0 && invoice.status !== 'CANCELLED';

  return (
    <div className="min-h-screen bg-vm-navy px-4 py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        {paidBanner && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-vm-success-bg px-4 py-3 font-body text-sm text-vm-success print:hidden">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Thank you — your payment is being processed. Refresh shortly if balance has not updated.
          </div>
        )}

        <InvoiceDocument invoice={invoice} />

        {canPay && (
          <div className="mt-6 rounded-xl border border-vm-border bg-vm-white p-6 text-center print:hidden">
            <p className="font-heading text-lg font-bold text-vm-navy">
              Amount due: {invoice.balanceDueFormatted}
            </p>
            <button
              type="button"
              disabled={paying}
              onClick={handlePay}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-vm-cyan px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider text-vm-navy hover:bg-vm-cyan/90 disabled:opacity-60"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Pay with card
            </button>
            {zelle && (
              <p className="mt-4 font-body text-xs text-vm-muted leading-relaxed">
                {zelle.secondaryText} {zelle.label} · {zelle.handle}. Zelle remains
                manual — VelocityMaid marks the invoice paid only after verifying the transfer.
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-center font-body text-xs text-vm-white/60 print:hidden">
          VelocityMaid · COME HOME TO CLEAN
        </p>
      </div>
    </div>
  );
}
