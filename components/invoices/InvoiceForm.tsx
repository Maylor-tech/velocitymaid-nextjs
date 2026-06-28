'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { InvoiceLineInput } from '@/lib/invoices/invoiceUtils';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';

export interface InvoiceFormValues {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyAddress: string;
  serviceType: string;
  jobDate: string;
  dueDate: string;
  tax: number;
  discount: number;
  notes: string;
  items: InvoiceLineInput[];
}

const emptyItem = (): InvoiceLineInput => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
});

const defaultValues: InvoiceFormValues = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  propertyAddress: '',
  serviceType: '',
  jobDate: '',
  dueDate: '',
  tax: 0,
  discount: 0,
  notes: '',
  items: [emptyItem()],
};

interface InvoiceFormProps {
  initial?: SerializedInvoice;
  onSubmit: (values: InvoiceFormValues, markSent: boolean) => Promise<void>;
  submitLabel?: string;
}

const inputClass =
  'w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan';
const labelClass = 'mb-1 block font-heading text-xs font-semibold uppercase tracking-wide text-vm-muted';

export function InvoiceForm({ initial, onSubmit, submitLabel = 'Save draft' }: InvoiceFormProps) {
  const [values, setValues] = useState<InvoiceFormValues>(defaultValues);
  const [busy, setBusy] = useState(false);
  const [previewNumber, setPreviewNumber] = useState('');

  useEffect(() => {
    if (initial) {
      setValues({
        clientName: initial.clientName,
        clientEmail: initial.clientEmail || '',
        clientPhone: initial.clientPhone || '',
        propertyAddress: initial.propertyAddress,
        serviceType: initial.serviceType,
        jobDate: initial.jobDate?.slice(0, 10) || '',
        dueDate: initial.dueDate?.slice(0, 10) || '',
        tax: initial.tax,
        discount: initial.discount,
        notes: initial.notes || '',
        items: initial.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      });
      setPreviewNumber(initial.invoiceNumber);
    } else {
      fetch('/api/admin/invoices/next-number')
        .then((r) => r.json())
        .then((d) => d.success && setPreviewNumber(d.invoiceNumber));
    }
  }, [initial]);

  const updateItem = (index: number, patch: Partial<InvoiceLineInput>) => {
    setValues((v) => ({
      ...v,
      items: v.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  };

  const subtotal = values.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal + values.tax - values.discount);

  const handle = async (markSent: boolean) => {
    setBusy(true);
    try {
      await onSubmit(values, markSent);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {previewNumber && (
        <p className="font-body text-sm text-vm-muted">
          Invoice number: <span className="font-semibold text-vm-navy">{previewNumber}</span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Client name *</label>
          <input className={inputClass} value={values.clientName}
            onChange={(e) => setValues({ ...values, clientName: e.target.value })} required />
        </div>
        <div>
          <label className={labelClass}>Client email</label>
          <input type="email" className={inputClass} value={values.clientEmail}
            onChange={(e) => setValues({ ...values, clientEmail: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Client phone</label>
          <input className={inputClass} value={values.clientPhone}
            onChange={(e) => setValues({ ...values, clientPhone: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Service type *</label>
          <input className={inputClass} value={values.serviceType}
            onChange={(e) => setValues({ ...values, serviceType: e.target.value })} required />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Property address *</label>
          <input className={inputClass} value={values.propertyAddress}
            onChange={(e) => setValues({ ...values, propertyAddress: e.target.value })} required />
        </div>
        <div>
          <label className={labelClass}>Job date</label>
          <input type="date" className={inputClass} value={values.jobDate}
            onChange={(e) => setValues({ ...values, jobDate: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Due date</label>
          <input type="date" className={inputClass} value={values.dueDate}
            onChange={(e) => setValues({ ...values, dueDate: e.target.value })} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className={labelClass}>Line items</p>
          <button type="button" onClick={() => setValues((v) => ({ ...v, items: [...v.items, emptyItem()] }))}
            className="inline-flex items-center gap-1 font-body text-xs font-semibold text-vm-cyan-dark">
            <Plus className="h-3.5 w-3.5" /> Add line
          </button>
        </div>
        <div className="space-y-3">
          {values.items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-vm-border p-3 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <textarea
                  rows={3}
                  placeholder="Service title (first line)&#10;Detail line 2&#10;Detail line 3"
                  className={`${inputClass} resize-y min-h-[72px]`}
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <input type="number" min={0} step={0.01} placeholder="Qty" className={inputClass}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-3">
                <input type="number" min={0} step={0.01} placeholder="Unit price" className={inputClass}
                  value={item.unitPrice || ''}
                  onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-end sm:col-span-1">
                {values.items.length > 1 && (
                  <button type="button" onClick={() => setValues((v) => ({
                    ...v, items: v.items.filter((_, i) => i !== index),
                  }))} className="text-vm-muted hover:text-vm-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Tax</label>
          <input type="number" min={0} step={0.01} className={inputClass} value={values.tax || ''}
            onChange={(e) => setValues({ ...values, tax: Number(e.target.value) })} />
        </div>
        <div>
          <label className={labelClass}>Discount</label>
          <input type="number" min={0} step={0.01} className={inputClass} value={values.discount || ''}
            onChange={(e) => setValues({ ...values, discount: Number(e.target.value) })} />
        </div>
        <div className="flex items-end">
          <p className="font-heading text-lg font-bold text-vm-navy">Total: ${total.toFixed(2)}</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes &amp; email extras</label>
        <textarea rows={5} className={inputClass} value={values.notes}
          placeholder={`Closing note (optional)\n\n---UPCOMING---\nMon Jun 29 — Office prep — $150\nJul 1 — Turnover — $300`}
          onChange={(e) => setValues({ ...values, notes: e.target.value })} />
        <p className="mt-1 font-body text-xs text-vm-muted">
          First line(s) appear as the closing note in the invoice email. Add{" "}
          <code className="rounded bg-vm-surface px-1">---UPCOMING---</code> on its own line,
          then list upcoming services below it.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => handle(false)}
          className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wider text-vm-white hover:bg-vm-navy/90 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </button>
        <button type="button" disabled={busy} onClick={() => handle(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-vm-cyan bg-vm-cyan-tint px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wider text-vm-navy hover:bg-vm-cyan/20 disabled:opacity-60">
          Save & mark sent
        </button>
      </div>
    </div>
  );
}

export type { InvoiceFormValues as InvoiceFormData };
