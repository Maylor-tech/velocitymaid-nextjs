import type { PipelineLeadStage, PipelineLeadTaskType } from '@prisma/client';

export const PIPELINE_STAGES: PipelineLeadStage[] = [
  'NEW_LEAD',
  'CONTACTED',
  'DISCOVERY_CALL',
  'QUOTE_SENT',
  'FOLLOW_UP',
  'WON',
  'ACTIVE_CLIENT',
  'LOST',
];

export const STAGE_LABELS: Record<PipelineLeadStage, string> = {
  NEW_LEAD: 'New Lead',
  CONTACTED: 'Contacted',
  DISCOVERY_CALL: 'Discovery Call',
  QUOTE_SENT: 'Quote Sent',
  FOLLOW_UP: 'Follow-Up',
  WON: 'Won',
  ACTIVE_CLIENT: 'Active Client',
  LOST: 'Lost',
};

export const STAGE_COLORS: Record<PipelineLeadStage, { bg: string; fg: string }> = {
  NEW_LEAD: { bg: 'bg-vm-cyan-tint', fg: 'text-vm-navy' },
  CONTACTED: { bg: 'bg-vm-surface', fg: 'text-vm-navy' },
  DISCOVERY_CALL: { bg: 'bg-vm-warning-bg', fg: 'text-vm-warning' },
  QUOTE_SENT: { bg: 'bg-vm-cyan-tint', fg: 'text-vm-cyan-dark' },
  FOLLOW_UP: { bg: 'bg-vm-warning-bg', fg: 'text-vm-warning' },
  WON: { bg: 'bg-vm-success-bg', fg: 'text-vm-success' },
  ACTIVE_CLIENT: { bg: 'bg-vm-success-bg', fg: 'text-vm-success' },
  LOST: { bg: 'bg-vm-surface', fg: 'text-vm-muted' },
};

export const PROPERTY_TYPES = [
  'Single-family home',
  'Vacation rental / Airbnb',
  'Apartment / condo',
  'Multi-unit property',
  'Commercial',
  'Other',
] as const;

export const LEAD_SOURCES = [
  'Google search',
  'Facebook / social',
  'Referral',
  'Flyer / community board',
  'Website form',
  'Phone inquiry',
  'Other',
] as const;

export const TASK_TYPE_LABELS: Record<PipelineLeadTaskType, string> = {
  FOLLOW_UP: 'Follow-up',
  QUOTE_REMINDER: 'Quote reminder',
  ONBOARDING: 'Onboarding',
};

export interface PipelineLeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  propertyAddress: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  leadSource: string | null;
  estimatedRevenue: number | null;
  notes: string | null;
  stage: PipelineLeadStage;
  nextActionDate: string | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineLeadTaskRecord {
  id: string;
  leadId: string;
  type: PipelineLeadTaskType;
  title: string;
  dueAt: string;
  status: string;
  completedAt: string | null;
  lead?: { id: string; name: string; stage: PipelineLeadStage };
}

export interface LeadCenterDashboard {
  newLeads: number;
  activeQuotes: number;
  recurringClients: number;
  jobsBooked: number;
  conversionRate: number | null;
  revenuePipeline: number;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  propertyAddress?: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  leadSource?: string;
  estimatedRevenue?: number;
  notes?: string;
  stage?: PipelineLeadStage;
  nextActionDate?: string;
  isRecurring?: boolean;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  stage?: PipelineLeadStage;
}
