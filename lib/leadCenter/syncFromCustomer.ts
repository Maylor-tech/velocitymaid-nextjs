import type { Customer, LeadStatus, PipelineLeadStage, PrismaClient } from '@prisma/client';
import type { HostIntakePayload, HostSetupRequestPayload } from '@/lib/hostIntake/types';
import { mergeLeadNotes } from '@/lib/hostIntake/attribution';
import { leadStatusToStage, stageToLeadStatus } from './stages';

function parseIntOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function customerStage(customer: Customer): PipelineLeadStage {
  return leadStatusToStage(customer.leadStatus) ?? 'NEW_LEAD';
}

/** Upsert a pipeline card from a lightweight /hosts setup request (no Property yet). */
export async function upsertPipelineLeadFromSetupRequest(
  prisma: PrismaClient,
  customer: Customer,
  payload: HostSetupRequestPayload
) {
  const name = `${customer.firstName} ${customer.lastName}`.trim() || payload.fullName;
  const existing = await prisma.pipelineLead.findUnique({
    where: { customerId: customer.id },
  });

  const notes = mergeLeadNotes({
    existingNotes: existing?.notes,
    freeText: null,
    attribution: payload.attribution,
    setupRequest: {
      town: payload.city,
      interest: payload.serviceInterest,
      submitted_at: new Date().toISOString(),
    },
  });

  const data = {
    customerId: customer.id,
    name,
    phone: customer.phone || payload.phone || '',
    email: customer.email,
    propertyAddress: existing?.propertyAddress || `${payload.city}, VT`,
    propertyType: 'Vacation rental / Airbnb',
    leadSource: existing?.leadSource || 'Hosts landing (/hosts)',
    // Do not regress a later stage if they already completed full intake.
    stage: (existing?.stage === 'NEW_LEAD' || !existing
      ? 'NEW_LEAD'
      : existing.stage) as PipelineLeadStage,
    notes: notes || null,
  };

  if (existing) {
    return prisma.pipelineLead.update({
      where: { id: existing.id },
      data: {
        ...data,
        // Keep richer address/beds if already set from a prior full intake.
        propertyAddress: existing.propertyAddress || data.propertyAddress,
        bedrooms: existing.bedrooms,
        bathrooms: existing.bathrooms,
      },
    });
  }

  return prisma.pipelineLead.create({ data });
}

/** Upsert a pipeline card from a host intake customer record. */
export async function upsertPipelineLeadFromIntake(
  prisma: PrismaClient,
  customer: Customer,
  payload: HostIntakePayload
) {
  const name = `${customer.firstName} ${customer.lastName}`.trim() || payload.fullName;
  const propertyType =
    payload.serviceTypes?.includes('Vacation rental turnover') ||
    payload.bookingPlatforms.length > 0
      ? 'Vacation rental / Airbnb'
      : 'Single-family home';

  const existing = await prisma.pipelineLead.findUnique({
    where: { customerId: customer.id },
  });

  const notes = mergeLeadNotes({
    existingNotes: existing?.notes,
    freeText: payload.specialInstructions?.trim() || null,
    attribution: payload.attribution,
    setupRequest: null,
  });

  const leadSource =
    existing?.leadSource === 'Hosts landing (/hosts)' ||
    payload.attribution?.landing === '/hosts'
      ? 'Hosts landing (/hosts)'
      : existing?.leadSource || 'Website form';

  const data = {
    customerId: customer.id,
    name,
    phone: customer.phone || payload.phone || '',
    email: customer.email,
    propertyAddress: payload.propertyAddress,
    bedrooms: parseIntOrNull(payload.bedrooms),
    bathrooms: parseIntOrNull(payload.bathrooms),
    propertyType,
    leadSource,
    stage: 'INTAKE_RECEIVED' as const,
    notes: notes || null,
  };

  if (existing) {
    return prisma.pipelineLead.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.pipelineLead.create({ data });
}

/** Backfill pipeline cards for customers already in the funnel. */
export async function syncMissingPipelineLeads(prisma: PrismaClient) {
  const customers = await prisma.customer.findMany({
    where: {
      leadStatus: {
        in: [
          'NEW',
          'INTAKE_RECEIVED',
          'WALKTHROUGH_SCHEDULED',
          'QUOTE_SENT',
          'FOLLOW_UP',
          'WON',
          'ACTIVE_CLIENT',
          'ACTIVE',
          'BOOKED',
        ] satisfies LeadStatus[],
      },
      PipelineLead: null,
    },
  });

  for (const customer of customers) {
    await prisma.pipelineLead.create({
      data: {
        customerId: customer.id,
        name: `${customer.firstName} ${customer.lastName}`.trim(),
        phone: customer.phone || '',
        email: customer.email,
        propertyAddress: customer.addressLine1 || customer.defaultAddress,
        stage: customerStage(customer),
        leadSource: 'Website form',
      },
    });
  }
}

/** Keep Customer.leadStatus in sync when a linked pipeline card moves. */
export async function syncCustomerLeadStatus(
  prisma: PrismaClient,
  customerId: string,
  stage: PipelineLeadStage
) {
  await prisma.customer.update({
    where: { id: customerId },
    data: { leadStatus: stageToLeadStatus(stage), updatedAt: new Date() },
  });
}
