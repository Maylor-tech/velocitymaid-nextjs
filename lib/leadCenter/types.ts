import type { PipelineLeadStage, PipelineLeadTaskType } from '@prisma/client';

export {
  PIPELINE_STAGES,
  STAGE_LABELS,
  STAGE_DESCRIPTIONS,
  STAGE_COLORS,
} from './stages';

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
  customerId: string | null;
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
  followUpDate: string | null;
  followUpEnteredAt: string | null;
  lastContactedAt: string | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  source?: 'manual' | 'intake';
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
  markContacted?: boolean;
}
