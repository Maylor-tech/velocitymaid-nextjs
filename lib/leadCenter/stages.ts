import type { LeadStatus, PipelineLeadStage } from '@prisma/client';

export const PIPELINE_STAGES: PipelineLeadStage[] = [
  'NEW_LEAD',
  'INTAKE_RECEIVED',
  'WALKTHROUGH_SCHEDULED',
  'QUOTE_SENT',
  'FOLLOW_UP',
  'WON',
  'ACTIVE_CLIENT',
];

export const STAGE_LABELS: Record<PipelineLeadStage, string> = {
  NEW_LEAD: 'New Lead',
  INTAKE_RECEIVED: 'Intake Received',
  WALKTHROUGH_SCHEDULED: 'Walkthrough Scheduled',
  QUOTE_SENT: 'Quote Sent',
  FOLLOW_UP: 'Follow-Up',
  WON: 'Won',
  ACTIVE_CLIENT: 'Active Client',
};

export const STAGE_DESCRIPTIONS: Record<PipelineLeadStage, string> = {
  NEW_LEAD: 'Lead submitted or contacted. No intake form yet.',
  INTAKE_RECEIVED: 'Host completed the intake form. Customer record created.',
  WALKTHROUGH_SCHEDULED: 'Property walkthrough confirmed. Date set.',
  QUOTE_SENT: 'Formal quote or proposal sent to the host.',
  FOLLOW_UP: 'Quote sent, no response yet. Follow-up needed.',
  WON: 'Host confirmed. First job scheduled.',
  ACTIVE_CLIENT: 'Recurring or repeat host. At least one completed job.',
};

export const STAGE_COLORS: Record<PipelineLeadStage, { bg: string; fg: string }> = {
  NEW_LEAD: { bg: 'bg-vm-cyan-tint', fg: 'text-vm-navy' },
  INTAKE_RECEIVED: { bg: 'bg-vm-cyan-tint', fg: 'text-vm-cyan-dark' },
  WALKTHROUGH_SCHEDULED: { bg: 'bg-vm-warning-bg', fg: 'text-vm-warning' },
  QUOTE_SENT: { bg: 'bg-vm-cyan-tint', fg: 'text-vm-cyan-dark' },
  FOLLOW_UP: { bg: 'bg-vm-warning-bg', fg: 'text-vm-warning' },
  WON: { bg: 'bg-vm-success-bg', fg: 'text-vm-success' },
  ACTIVE_CLIENT: { bg: 'bg-vm-success-bg', fg: 'text-vm-success' },
};

/** Maps pipeline kanban stage → Customer.leadStatus */
export function stageToLeadStatus(stage: PipelineLeadStage): LeadStatus {
  if (stage === 'NEW_LEAD') return 'NEW';
  return stage;
}

/** Maps Customer.leadStatus → pipeline stage (null = not shown on pipeline) */
export function leadStatusToStage(status: LeadStatus): PipelineLeadStage | null {
  switch (status) {
    case 'NEW':
      return 'NEW_LEAD';
    case 'INTAKE_RECEIVED':
    case 'WALKTHROUGH_SCHEDULED':
    case 'QUOTE_SENT':
    case 'FOLLOW_UP':
    case 'WON':
    case 'ACTIVE_CLIENT':
      return status;
    case 'ACTIVE':
      return 'ACTIVE_CLIENT';
    case 'BOOKED':
      return 'WON';
    default:
      return null;
  }
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function effectiveFollowUpDate(lead: {
  followUpDate: Date | null;
  followUpEnteredAt: Date | null;
}): Date | null {
  if (lead.followUpDate) return lead.followUpDate;
  if (lead.followUpEnteredAt) return addDays(lead.followUpEnteredAt, 3);
  return null;
}

export function daysSince(date: Date | null | undefined): number | null {
  if (!date) return null;
  const ms = Date.now() - date.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
