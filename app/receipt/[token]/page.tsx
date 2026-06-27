'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2 } from 'lucide-react';

interface ReceiptView {
  receiptNumber: string;
  clientName: string;
  amountFormatted: string;
  paymentDateFormatted: string;
  propertyAddress?: string | null;
  serviceType?: string | null;
  invoiceNumber?: string | null;
  paymentMethod: string;
  publicToken: string;
}

export default function PublicReceiptPage({ params }: { params: { token: string } }) {
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/receipt/${params.token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReceipt(d.receipt);
      })
      .finally(() => setLoading(false));
  }, [params.token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface p-6">
        <p className="font-body text-vm-muted">Receipt not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vm-surface py-10 px-4">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-vm-border bg-vm-white shadow-sm overflow-hidden">
          <div className="bg-vm-navy px-6 py-5">
            <p className="font-heading text-xl font-bold text-white">VelocityMaid</p>
            <p className="font-body text-sm text-vm-cyan">Payment Receipt</p>
          </div>
          <div className="p-6 space-y-4">
            <p className="font-body text-sm text-vm-muted">Receipt #{receipt.receiptNumber}</p>
            <p className="font-heading text-3xl font-bold text-vm-navy">{receipt.amountFormatted}</p>
            <p className="font-body text-sm text-vm-text">Paid by {receipt.clientName}</p>
            <p className="font-body text-sm text-vm-muted">{receipt.paymentDateFormatted}</p>
            {receipt.propertyAddress && (
              <p className="font-body text-sm text-vm-text">{receipt.propertyAddress}</p>
            )}
            {receipt.invoiceNumber && (
              <p className="font-body text-sm text-vm-muted">Invoice #{receipt.invoiceNumber}</p>
            )}
            <p className="font-body text-xs text-vm-muted capitalize">
              {receipt.paymentMethod.replace(/_/g, ' ').toLowerCase()}
            </p>
            <a
              href={`/api/receipt/${params.token}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-4 py-2 font-body text-sm font-semibold text-white hover:bg-vm-navy/90"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </div>
        </div>
        <p className="mt-8 text-center font-body text-xs text-vm-muted">
          <Link href="/" className="text-vm-cyan-dark hover:underline">VelocityMaid</Link>
        </p>
      </div>
    </div>
  );
}
