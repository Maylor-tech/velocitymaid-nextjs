'use client';

import type { PipelineLeadStage } from '@prisma/client';
import { Phone, Mail, MapPin, DollarSign } from 'lucide-react';
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  type PipelineLeadRecord,
} from '@/lib/leadCenter/types';
import { PipelineStageBadge } from './PipelineStageBadge';
import { Button } from '@/components/ui/button';

interface LeadDetailPanelProps {
  lead: PipelineLeadRecord;
  onClose: () => void;
  onEdit: () => void;
  onStageChange: (stage: PipelineLeadStage) => void;
}

function formatMoney(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LeadDetailPanel({ lead, onClose, onEdit, onStageChange }: LeadDetailPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-vm-border bg-vm-white shadow-xl">
      <div className="flex items-start justify-between border-b border-vm-border px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-vm-navy">{lead.name}</h2>
          <div className="mt-1">
            <PipelineStageBadge stage={lead.stage} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 font-body text-sm text-vm-muted hover:bg-vm-surface"
        >
          Close
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div className="space-y-2">
          <Row icon={<Phone className="h-4 w-4" />} value={lead.phone} />
          {lead.email && <Row icon={<Mail className="h-4 w-4" />} value={lead.email} />}
          {lead.propertyAddress && (
            <Row icon={<MapPin className="h-4 w-4" />} value={lead.propertyAddress} />
          )}
          <Row icon={<DollarSign className="h-4 w-4" />} value={formatMoney(lead.estimatedRevenue)} />
        </div>

        <dl className="grid grid-cols-2 gap-3 font-body text-sm">
          <Detail label="Bedrooms" value={lead.bedrooms?.toString() ?? '—'} />
          <Detail label="Bathrooms" value={lead.bathrooms?.toString() ?? '—'} />
          <Detail label="Property Type" value={lead.propertyType ?? '—'} />
          <Detail label="Lead Source" value={lead.leadSource ?? '—'} />
          <Detail label="Next Action" value={formatDate(lead.nextActionDate)} />
          <Detail label="Recurring" value={lead.isRecurring ? 'Yes' : 'No'} />
        </dl>

        {lead.notes && (
          <div>
            <p className="mb-1 font-body text-xs font-medium text-vm-muted">Notes</p>
            <p className="whitespace-pre-wrap font-body text-sm text-vm-text">{lead.notes}</p>
          </div>
        )}

        <div>
          <p className="mb-2 font-body text-xs font-medium text-vm-muted">Move to stage</p>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_STAGES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={s === lead.stage}
                onClick={() => onStageChange(s)}
                className={`rounded-md px-2 py-1 font-body text-xs transition-colors ${
                  s === lead.stage
                    ? 'bg-vm-cyan font-semibold text-vm-navy'
                    : 'bg-vm-surface text-vm-muted hover:bg-vm-cyan-tint hover:text-vm-navy'
                }`}
              >
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-vm-border px-5 py-4">
        <Button variant="navy" className="w-full" onClick={onEdit}>
          Edit Lead
        </Button>
      </div>
    </div>
  );
}

function Row({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 font-body text-sm text-vm-text">
      <span className="text-vm-muted">{icon}</span>
      {value}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-vm-muted">{label}</dt>
      <dd className="font-medium text-vm-navy">{value}</dd>
    </div>
  );
}
