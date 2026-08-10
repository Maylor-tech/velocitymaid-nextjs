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
