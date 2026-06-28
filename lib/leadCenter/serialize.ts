import type { PipelineLead, PipelineLeadTask } from '@prisma/client';
import type { PipelineLeadRecord, PipelineLeadTaskRecord } from './types';

export function serializeLead(lead: PipelineLead): PipelineLeadRecord {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    propertyAddress: lead.propertyAddress,
    bedrooms: lead.bedrooms,
    bathrooms: lead.bathrooms,
    propertyType: lead.propertyType,
    leadSource: lead.leadSource,
    estimatedRevenue: lead.estimatedRevenue ? Number(lead.estimatedRevenue) : null,
    notes: lead.notes,
    stage: lead.stage,
    nextActionDate: lead.nextActionDate?.toISOString() ?? null,
    isRecurring: lead.isRecurring,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function serializeTask(
  task: PipelineLeadTask & { lead?: { id: string; name: string; stage: PipelineLead['stage'] } }
): PipelineLeadTaskRecord {
  return {
    id: task.id,
    leadId: task.leadId,
    type: task.type,
    title: task.title,
    dueAt: task.dueAt.toISOString(),
    status: task.status,
    completedAt: task.completedAt?.toISOString() ?? null,
    lead: task.lead
      ? { id: task.lead.id, name: task.lead.name, stage: task.lead.stage }
      : undefined,
  };
}
