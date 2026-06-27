import type { TalentApplicationPayload } from '@/lib/cleaners/talentApplicationTypes';
import { parseTalentApplicationData } from '@/components/admin/cleaners/TalentApplicationView';

export interface ApplicationListRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  experienceLevel: string | null;
  daysAvailable: unknown;
  notes: string | null;
  status: string;
  createdAt: string;
  areaOfResidence?: string | null;
  applicationData?: unknown;
  Branch?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
  } | null;
}

export function safeBranchName(app: ApplicationListRow): string {
  return app.Branch?.name ?? 'Unassigned branch';
}

export function safeBranchLocation(app: ApplicationListRow): string {
  if (!app.Branch) return '—';
  return [app.Branch.city, app.Branch.state].filter(Boolean).join(', ') || app.Branch.name;
}

export function formatAvailabilitySummary(app: ApplicationListRow): string {
  const talent = parseTalentApplicationData(app.applicationData) as TalentApplicationPayload | null;
  if (talent?.availability) {
    const days = talent.availability.daysAvailable?.join(', ') || '—';
    return `${days} · ${talent.availability.preferredTime || 'flexible'}`;
  }
  if (Array.isArray(app.daysAvailable)) {
    return app.daysAvailable.join(', ');
  }
  if (app.daysAvailable && typeof app.daysAvailable === 'object') {
    return JSON.stringify(app.daysAvailable);
  }
  return '—';
}

export function formatExperienceSummary(app: ApplicationListRow): string {
  const talent = parseTalentApplicationData(app.applicationData) as TalentApplicationPayload | null;
  if (talent?.experience) {
    return `${talent.experience.yearsExperience} · ${talent.experience.experienceTypes?.slice(0, 2).join(', ') || 'General'}`;
  }
  return app.experienceLevel || 'Not specified';
}

export function formatTransportSummary(app: ApplicationListRow): string {
  const talent = parseTalentApplicationData(app.applicationData) as TalentApplicationPayload | null;
  if (talent?.eligibility) {
    return talent.eligibility.reliableTransportation
      ? `Yes · ${talent.serviceAreas?.maxTravelDistance || 'local'}`
      : 'Limited transport';
  }
  return '—';
}

export function formatServiceArea(app: ApplicationListRow): string {
  const talent = parseTalentApplicationData(app.applicationData) as TalentApplicationPayload | null;
  if (talent?.serviceAreas?.areas?.length) {
    return talent.serviceAreas.areas.join(', ');
  }
  return app.areaOfResidence || '—';
}

export function hasBackgroundConsent(app: ApplicationListRow): boolean {
  const talent = parseTalentApplicationData(app.applicationData) as TalentApplicationPayload | null;
  return Boolean(talent?.consents?.backgroundCheck);
}

export function hasReferences(app: ApplicationListRow): boolean {
  const talent = parseTalentApplicationData(app.applicationData) as TalentApplicationPayload | null;
  return Boolean(talent?.references?.some((r) => r.name?.trim()));
}
