import type { PipelineLead } from '@prisma/client';
import type { LeadCenterDashboard } from './types';

const OPEN_STAGES = new Set([
  'NEW_LEAD',
  'CONTACTED',
  'DISCOVERY_CALL',
  'QUOTE_SENT',
  'FOLLOW_UP',
]);

export function computeDashboardMetrics(leads: PipelineLead[]): LeadCenterDashboard {
  const newLeads = leads.filter((l) => l.stage === 'NEW_LEAD').length;
  const activeQuotes = leads.filter(
    (l) => l.stage === 'QUOTE_SENT' || l.stage === 'FOLLOW_UP'
  ).length;
  const recurringClients = leads.filter(
    (l) => l.stage === 'ACTIVE_CLIENT' && l.isRecurring
  ).length;
  const jobsBooked = leads.filter((l) => l.stage === 'WON' || l.stage === 'ACTIVE_CLIENT').length;

  const closed = leads.filter((l) => l.stage === 'WON' || l.stage === 'LOST').length;
  const won = leads.filter((l) => l.stage === 'WON' || l.stage === 'ACTIVE_CLIENT').length;
  const conversionRate = closed > 0 ? Math.round((won / closed) * 100) : null;

  const revenuePipeline = leads
    .filter((l) => OPEN_STAGES.has(l.stage))
    .reduce((sum, l) => sum + (l.estimatedRevenue ? Number(l.estimatedRevenue) : 0), 0);

  return {
    newLeads,
    activeQuotes,
    recurringClients,
    jobsBooked,
    conversionRate,
    revenuePipeline,
  };
}
