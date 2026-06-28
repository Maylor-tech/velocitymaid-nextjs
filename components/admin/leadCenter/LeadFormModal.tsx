'use client';

import { useState } from 'react';
import type { PipelineLeadStage } from '@prisma/client';
import {
  LEAD_SOURCES,
  PROPERTY_TYPES,
  PIPELINE_STAGES,
  STAGE_LABELS,
  type CreateLeadInput,
  type PipelineLeadRecord,
} from '@/lib/leadCenter/types';
import { Button } from '@/components/ui/button';

const inputClass =
  'w-full rounded-lg border border-vm-border bg-vm-white px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none focus:ring-2 focus:ring-vm-cyan/30';

interface LeadFormModalProps {
  open: boolean;
  initial?: Partial<PipelineLeadRecord>;
  onClose: () => void;
  onSave: (data: CreateLeadInput) => Promise<void>;
}

export function LeadFormModal({ open, initial, onClose, onSave }: LeadFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateLeadInput>(() => ({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    propertyAddress: initial?.propertyAddress ?? '',
    bedrooms: initial?.bedrooms ?? undefined,
    bathrooms: initial?.bathrooms ?? undefined,
    propertyType: initial?.propertyType ?? '',
    leadSource: initial?.leadSource ?? '',
    estimatedRevenue: initial?.estimatedRevenue ?? undefined,
    notes: initial?.notes ?? '',
    stage: initial?.stage ?? 'NEW_LEAD',
    nextActionDate: initial?.nextActionDate?.slice(0, 10) ?? '',
    isRecurring: initial?.isRecurring ?? false,
  }));

  if (!open) return null;

  const set = <K extends keyof CreateLeadInput>(key: K, value: CreateLeadInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        nextActionDate: form.nextActionDate || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-vm-navy/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-vm-border bg-vm-white shadow-lg">
        <div className="border-b border-vm-border px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-vm-navy">
            {initial?.id ? 'Edit Lead' : 'New Lead'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <Field label="Name *">
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone *">
              <input
                required
                type="tel"
                className={inputClass}
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Property Address">
            <input
              className={inputClass}
              value={form.propertyAddress ?? ''}
              onChange={(e) => set('propertyAddress', e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bedrooms">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.bedrooms ?? ''}
                onChange={(e) =>
                  set('bedrooms', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </Field>
            <Field label="Bathrooms">
              <input
                type="number"
                min={0}
                step={0.5}
                className={inputClass}
                value={form.bathrooms ?? ''}
                onChange={(e) =>
                  set('bathrooms', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </Field>
          </div>
          <Field label="Property Type">
            <select
              className={inputClass}
              value={form.propertyType ?? ''}
              onChange={(e) => set('propertyType', e.target.value)}
            >
              <option value="">Select…</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lead Source">
            <select
              className={inputClass}
              value={form.leadSource ?? ''}
              onChange={(e) => set('leadSource', e.target.value)}
            >
              <option value="">Select…</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Estimated Revenue ($)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.estimatedRevenue ?? ''}
                onChange={(e) =>
                  set('estimatedRevenue', e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </Field>
            <Field label="Next Action Date">
              <input
                type="date"
                className={inputClass}
                value={form.nextActionDate ?? ''}
                onChange={(e) => set('nextActionDate', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              className={inputClass}
              value={form.stage ?? 'NEW_LEAD'}
              onChange={(e) => set('stage', e.target.value as PipelineLeadStage)}
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea
              rows={3}
              className={inputClass}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 font-body text-sm text-vm-text">
            <input
              type="checkbox"
              checked={form.isRecurring ?? false}
              onChange={(e) => set('isRecurring', e.target.checked)}
              className="h-4 w-4 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan"
            />
            Recurring client
          </label>
          <div className="flex gap-3 border-t border-vm-border pt-4">
            <Button type="button" variant="navyOutline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="navy" className="flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-xs font-medium text-vm-muted">{label}</span>
      {children}
    </label>
  );
}
