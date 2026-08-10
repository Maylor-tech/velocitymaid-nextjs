import type { Property, Prisma, PrismaClient } from '@prisma/client';
import type { HostIntakePayload } from '@/lib/hostIntake/types';
import { addressesMatch } from './normalizeAddress';

type Db = PrismaClient | Prisma.TransactionClient;

function parseIntOrNull(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseFloatOrNull(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function resolveLabeledTime(primary: string, other: string): string | null {
  const value = primary?.trim();
  if (!value) return null;
  if (/other/i.test(value)) {
    return other.trim() || value;
  }
  return value;
}

function resolveAccessType(payload: HostIntakePayload): string | null {
  const type = payload.accessType?.trim();
  if (!type) return null;
  if (/other/i.test(type) && payload.accessTypeOther.trim()) {
    return `Other: ${payload.accessTypeOther.trim()}`;
  }
  return type;
}

function defaultPropertyName(payload: HostIntakePayload): string {
  const city = payload.city?.trim();
  if (city) return `${city} Property`;
  return payload.propertyAddress.trim() || 'Property';
}

/** Fields used when creating a Job from standing Property defaults (snapshot). */
export type JobPropertyDefaults = {
  propertyId: string;
  address: string;
  serviceLocation: string | null;
};

/**
 * Snapshot defaults for a new Job from Property.
 * Callers must write these onto Job at create time — later Property edits
 * must not rewrite historical Job.address.
 */
export function buildPropertyDefaultsForJob(property: Property): JobPropertyDefaults {
  return {
    propertyId: property.id,
    address: property.address,
    serviceLocation: property.city ?? null,
  };
}

/** Operational Property fields safe to expose to an authorized cleaner. */
export type CleanerPropertyView = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  bedConfiguration: string | null;
  amenities: string[];
  restrictedAreas: string | null;
  supplyStorageLocation: string | null;
  trashInstructions: string | null;
  linenInstructions: string | null;
  standingInstructions: string | null;
  accessType: string | null;
  accessNotes: string | null;
  standardCheckoutTime: string | null;
  standardCheckinTime: string | null;
};

export function toCleanerPropertyView(property: Property): CleanerPropertyView {
  return {
    id: property.id,
    name: property.name,
    address: property.address,
    city: property.city,
    state: property.state,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    bedConfiguration: property.bedConfiguration,
    amenities: property.amenities,
    restrictedAreas: property.restrictedAreas,
    supplyStorageLocation: property.supplyStorageLocation,
    trashInstructions: property.trashInstructions,
    linenInstructions: property.linenInstructions,
    standingInstructions: property.standingInstructions,
    accessType: property.accessType,
    accessNotes: property.accessNotes,
    standardCheckoutTime: property.standardCheckoutTime,
    standardCheckinTime: property.standardCheckinTime,
  };
}

/** Compact summary for admin Job detail. */
export type AdminPropertySummary = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  accessType: string | null;
  standingInstructions: string | null;
};

export function toAdminPropertySummary(property: Property): AdminPropertySummary {
  return {
    id: property.id,
    name: property.name,
    address: property.address,
    city: property.city,
    state: property.state,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    accessType: property.accessType,
    standingInstructions: property.standingInstructions,
  };
}

/** Host-visible Property fields (excludes accessNotes — not editable in V1 host UI). */
export type HostPropertyView = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  approximateSquareFeet: number | null;
  bedConfiguration: string | null;
  amenities: string[];
  restrictedAreas: string | null;
  accessType: string | null;
  supplyStorageLocation: string | null;
  trashInstructions: string | null;
  linenInstructions: string | null;
  standardCheckoutTime: string | null;
  standardCheckinTime: string | null;
  turnoverFrequency: string | null;
  sameDayTurnovers: string | null;
  standingInstructions: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toHostPropertyView(property: Property): HostPropertyView {
  return {
    id: property.id,
    name: property.name,
    address: property.address,
    city: property.city,
    state: property.state,
    postalCode: property.postalCode,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    approximateSquareFeet: property.approximateSquareFeet,
    bedConfiguration: property.bedConfiguration,
    amenities: property.amenities,
    restrictedAreas: property.restrictedAreas,
    accessType: property.accessType,
    supplyStorageLocation: property.supplyStorageLocation,
    trashInstructions: property.trashInstructions,
    linenInstructions: property.linenInstructions,
    standardCheckoutTime: property.standardCheckoutTime,
    standardCheckinTime: property.standardCheckinTime,
    turnoverFrequency: property.turnoverFrequency,
    sameDayTurnovers: property.sameDayTurnovers,
    standingInstructions: property.standingInstructions,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  };
}

/** Standing fields a host may PATCH in V1. Does not include accessNotes. */
export type HostPropertyUpdateInput = {
  name?: string;
  address?: string;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  approximateSquareFeet?: number | null;
  bedConfiguration?: string | null;
  amenities?: string[];
  restrictedAreas?: string | null;
  accessType?: string | null;
  supplyStorageLocation?: string | null;
  trashInstructions?: string | null;
  linenInstructions?: string | null;
  standardCheckoutTime?: string | null;
  standardCheckinTime?: string | null;
  turnoverFrequency?: string | null;
  sameDayTurnovers?: string | null;
  standingInstructions?: string | null;
};

/**
 * Load Property only if it belongs to customerId.
 * Prevents IDOR across customers.
 */
export async function loadOwnedProperty(
  db: Db,
  propertyId: string,
  customerId: string
): Promise<Property | null> {
  return db.property.findFirst({
    where: { id: propertyId, customerId },
  });
}

export async function updateHostProperty(
  db: Db,
  propertyId: string,
  customerId: string,
  input: HostPropertyUpdateInput
): Promise<Property | null> {
  const owned = await loadOwnedProperty(db, propertyId, customerId);
  if (!owned) return null;

  const data: Prisma.PropertyUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim() || owned.name;
  if (input.address !== undefined) data.address = input.address.trim() || owned.address;
  if (input.city !== undefined) data.city = input.city?.trim() || null;
  if (input.state !== undefined) data.state = input.state?.trim() || null;
  if (input.postalCode !== undefined) data.postalCode = input.postalCode?.trim() || null;
  if (input.bedrooms !== undefined) data.bedrooms = input.bedrooms;
  if (input.bathrooms !== undefined) data.bathrooms = input.bathrooms;
  if (input.approximateSquareFeet !== undefined) {
    data.approximateSquareFeet = input.approximateSquareFeet;
  }
  if (input.bedConfiguration !== undefined) {
    data.bedConfiguration = input.bedConfiguration?.trim() || null;
  }
  if (input.amenities !== undefined) data.amenities = input.amenities;
  if (input.restrictedAreas !== undefined) {
    data.restrictedAreas = input.restrictedAreas?.trim() || null;
  }
  if (input.accessType !== undefined) {
    data.accessType = input.accessType?.trim() || null;
  }
  if (input.supplyStorageLocation !== undefined) {
    data.supplyStorageLocation = input.supplyStorageLocation?.trim() || null;
  }
  if (input.trashInstructions !== undefined) {
    data.trashInstructions = input.trashInstructions?.trim() || null;
  }
  if (input.linenInstructions !== undefined) {
    data.linenInstructions = input.linenInstructions?.trim() || null;
  }
  if (input.standardCheckoutTime !== undefined) {
    data.standardCheckoutTime = input.standardCheckoutTime?.trim() || null;
  }
  if (input.standardCheckinTime !== undefined) {
    data.standardCheckinTime = input.standardCheckinTime?.trim() || null;
  }
  if (input.turnoverFrequency !== undefined) {
    data.turnoverFrequency = input.turnoverFrequency?.trim() || null;
  }
  if (input.sameDayTurnovers !== undefined) {
    data.sameDayTurnovers = input.sameDayTurnovers?.trim() || null;
  }
  if (input.standingInstructions !== undefined) {
    data.standingInstructions = input.standingInstructions?.trim() || null;
  }

  return db.property.update({ where: { id: propertyId }, data });
}

/** Vermont host Add Cleaning service types (aligned with admin VT list). */
export const HOST_CLEANING_SERVICE_TYPES = [
  'Vacation Rental Turnover',
  'Deep Cleaning & Property Reset',
  'Move-In Cleaning',
  'Move-Out Cleaning',
  'Property Readiness',
  'Emergency Response Cleaning',
  'Property Walkthrough',
] as const;

export type CreateCleaningFromPropertyInput = {
  preferredDate: Date;
  preferredTime?: string | null;
  serviceType: string;
  sameDayTurnover: boolean;
  checkInDeadline?: string | null;
  jobSpecificNotes?: string | null;
};

/**
 * Create a Job occurrence from Property defaults.
 * Snapshots address at create time; does not copy standing instructions onto Job.
 */
export function buildHostCleaningJobNotes(
  input: CreateCleaningFromPropertyInput
): string {
  const lines = ['[Source: HOST_PORTAL]'];
  lines.push(`Same-day turnover: ${input.sameDayTurnover ? 'Yes' : 'No'}`);
  if (input.checkInDeadline?.trim()) {
    lines.push(`Check-in deadline: ${input.checkInDeadline.trim()}`);
  }
  if (input.jobSpecificNotes?.trim()) {
    lines.push(input.jobSpecificNotes.trim());
  }
  return lines.join('\n');
}

export async function loadPropertyById(
  db: Db,
  propertyId: string
): Promise<Property | null> {
  return db.property.findUnique({ where: { id: propertyId } });
}

export async function loadPropertyForJob(
  db: Db,
  jobId: string
): Promise<Property | null> {
  const job = await db.job.findUnique({
    where: { id: jobId },
    select: { propertyId: true },
  });
  if (!job?.propertyId) return null;
  return loadPropertyById(db, job.propertyId);
}

export async function loadCustomerProperties(
  db: Db,
  customerId: string
): Promise<Property[]> {
  return db.property.findMany({
    where: { customerId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Find an existing Property for a customer by address match.
 * Matching hierarchy for intake: explicit id → customer + normalized address.
 */
export async function findPropertyForCustomerAddress(
  db: Db,
  customerId: string,
  address: string,
  options?: { propertyId?: string | null }
): Promise<Property | null> {
  if (options?.propertyId) {
    const byId = await db.property.findFirst({
      where: { id: options.propertyId, customerId },
    });
    if (byId) return byId;
  }

  const candidates = await db.property.findMany({ where: { customerId } });
  return (
    candidates.find((p) => addressesMatch(p.address, address)) ?? null
  );
}

function buildPropertyDataFromIntake(
  customerId: string,
  payload: HostIntakePayload
): Prisma.PropertyUncheckedCreateInput {
  const accessType = resolveAccessType(payload);
  return {
    customerId,
    name: defaultPropertyName(payload),
    address: payload.propertyAddress.trim(),
    city: payload.city.trim() || null,
    state: 'VT',
    postalCode: null,
    bedrooms: parseIntOrNull(payload.bedrooms),
    bathrooms: parseFloatOrNull(payload.bathrooms),
    approximateSquareFeet: parseIntOrNull(payload.squareFootage),
    bedConfiguration: payload.bedConfiguration.trim() || null,
    amenities: payload.propertyAmenities ?? [],
    restrictedAreas: payload.restrictedAreas.trim() || null,
    accessType,
    // Codes are not collected on intake — keep accessNotes empty.
    accessNotes: null,
    supplyStorageLocation: payload.supplyStorageLocation.trim() || null,
    trashInstructions: payload.trashBinLocation.trim() || null,
    linenInstructions: payload.linenProvider.trim() || null,
    standardCheckoutTime: resolveLabeledTime(
      payload.guestCheckoutTime,
      payload.guestCheckoutTimeOther
    ),
    standardCheckinTime: resolveLabeledTime(
      payload.guestCheckinTime,
      payload.guestCheckinTimeOther
    ),
    turnoverFrequency: payload.turnoverFrequency.trim() || null,
    sameDayTurnovers: payload.sameDayTurnovers.trim() || null,
    standingInstructions: payload.specialInstructions.trim() || null,
  };
}

/**
 * Upsert Property from Vermont host intake.
 * Same customer + same normalized address → update; different address → create.
 */
export async function createOrUpdatePropertyFromHostIntake(
  db: Db,
  customerId: string,
  payload: HostIntakePayload,
  options?: { propertyId?: string | null }
): Promise<Property> {
  const address = payload.propertyAddress.trim();
  if (!address) {
    throw new Error('propertyAddress is required to persist Property');
  }

  const data = buildPropertyDataFromIntake(customerId, payload);
  const existing = await findPropertyForCustomerAddress(db, customerId, address, {
    propertyId: options?.propertyId,
  });

  if (existing) {
    // Preserve a manually set display name (e.g. Lou Lou's Landing) unless blank.
    const name =
      existing.name && !/^(.+ Property)$/i.test(existing.name)
        ? existing.name
        : data.name;
    const updateData: Prisma.PropertyUncheckedUpdateInput = { ...data, name };
    delete updateData.customerId;
    return db.property.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  return db.property.create({ data });
}
