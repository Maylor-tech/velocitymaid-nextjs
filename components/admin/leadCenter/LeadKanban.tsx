'use client';

import type { PipelineLeadStage } from '@prisma/client';
import { Calendar, DollarSign } from 'lucide-react';
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  type PipelineLeadRecord,
} from '@/lib/leadCenter/types';

interface LeadKanbanProps {
  leads: PipelineLeadRecord[];
  onSelect: (lead: PipelineLeadRecord) => void;
  onStageChange: (leadId: string, stage: PipelineLeadStage) => void;
}

function formatMoney(n: number | null) {
  if (n == null) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function LeadKanban({ leads, onSelect, onStageChange }: LeadKanbanProps) {
  const leadList = Array.isArray(leads) ? leads : [];

  const handleDrop = (e: React.DragEvent, stage: PipelineLeadStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) onStageChange(leadId, stage);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const columnLeads = leadList.filter((l) => l.stage === stage);
        return (
          <div
            key={stage}
            className="flex w-[260px] shrink-0 flex-col rounded-xl border border-vm-border bg-vm-surface/60"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="border-b border-vm-border px-3 py-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-xs font-bold uppercase tracking-wide text-vm-navy">
                  {STAGE_LABELS[stage]}
                </h3>
                <span className="rounded-full bg-vm-white px-2 py-0.5 font-body text-[11px] font-semibold text-vm-muted">
                  {columnLeads.length}
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-2 min-h-[120px]">
              {columnLeads.map((lead) => (
                <article
                  key={lead.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                  onClick={() => onSelect(lead)}
                  className="cursor-pointer rounded-lg border border-vm-border bg-vm-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="font-heading text-sm font-semibold text-vm-navy">{lead.name}</p>
                  {lead.propertyAddress && (
                    <p className="mt-0.5 truncate font-body text-xs text-vm-muted">
                      {lead.propertyAddress}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {lead.estimatedRevenue != null && (
                      <span className="inline-flex items-center gap-0.5 font-body text-xs font-medium text-vm-success">
                        <DollarSign className="h-3 w-3" />
                        {formatMoney(lead.estimatedRevenue)}
                      </span>
                    )}
                    {lead.nextActionDate && (
                      <span className="inline-flex items-center gap-0.5 font-body text-xs text-vm-muted">
                        <Calendar className="h-3 w-3" />
                        {new Date(lead.nextActionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
