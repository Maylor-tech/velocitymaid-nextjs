'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { InvoiceForm, type InvoiceFormValues } from '@/components/invoices/InvoiceForm';

export default function NewInvoicePage() {
  const router = useRouter();

  const handleSubmit = async (values: InvoiceFormValues, markSent: boolean) => {
    const res = await fetch('/api/admin/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, markSent }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to create invoice');
    router.push(`/admin/invoices/${data.invoice.id}`);
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
    </div>
  );
}
