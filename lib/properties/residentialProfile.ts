import type { Prisma, PrismaClient, Property } from "@prisma/client";
import type { ResidentialIntakePayload } from "@/lib/residentialIntake/types";
import { findPropertyForCustomerAddress } from "@/lib/properties/propertyService";

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

function defaultPropertyName(payload: ResidentialIntakePayload): string {
  const city = payload.city.trim();
  if (city) return `${city} Home`;
  return payload.serviceAddress.trim() || "Residential property";
}

function profileDataFromIntake(payload: ResidentialIntakePayload) {
  return {
    serviceType: payload.serviceType || null,
    frequency: payload.frequency || null,
    preferredServiceDate: payload.preferredServiceDate || null,
    preferredContactMethod: payload.preferredContactMethod || null,
    petsNotes: payload.pets.trim() || null,
    occupancyApprox: parseIntOrNull(payload.occupancyApprox),
    accessParkingNotes: payload.accessParking.trim() || null,
    suppliesProvidedBy: payload.suppliesProvidedBy || null,
    trashRequirements: payload.trashRequirements.trim() || null,
    laundryRequested: payload.laundryRequested,
    bedMakingRequested: payload.bedMakingRequested,
    lastProfessionalClean: payload.lastProfessionalClean.trim() || null,
    specialInstructions: payload.specialInstructions.trim() || null,
    conditionFlags: payload.conditionFlags,
    conditionOther: payload.conditionOther.trim() || null,
  };
}

export function isResidentialProperty(property: {
  useType?: string | null;
}): boolean {
  return property.useType === "RESIDENTIAL";
}

export async function createOrUpdatePropertyFromResidentialIntake(
  db: Db,
  customerId: string,
  payload: ResidentialIntakePayload
): Promise<Property> {
  const address = payload.serviceAddress.trim();
  if (!address) {
    throw new Error("serviceAddress is required to persist Property");
  }

  const existing = await findPropertyForCustomerAddress(db, customerId, address);
  const propertyData = {
    name: defaultPropertyName(payload),
    address,
    city: payload.city.trim() || null,
    state: "VT" as const,
    bedrooms: parseIntOrNull(payload.bedrooms),
    bathrooms: parseFloatOrNull(payload.bathrooms),
    approximateSquareFeet: parseIntOrNull(payload.squareFootage),
    accessType: payload.accessParking.trim() || null,
    trashInstructions: payload.trashRequirements.trim() || null,
    standingInstructions: payload.specialInstructions.trim() || null,
    useType: "RESIDENTIAL" as const,
  };

  const property = existing
    ? await db.property.update({
        where: { id: existing.id },
        data: {
          ...propertyData,
          name:
            existing.name && !/^(?:.+ (?:Property|Home))$/i.test(existing.name)
              ? existing.name
              : propertyData.name,
        },
      })
    : await db.property.create({
        data: {
          customerId,
          ...propertyData,
        },
      });

  const profile = profileDataFromIntake(payload);
  await db.propertyResidentialProfile.upsert({
    where: { propertyId: property.id },
    create: { propertyId: property.id, ...profile },
    update: profile,
  });

  return property;
}
