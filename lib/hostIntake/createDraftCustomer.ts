import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { HostIntakePayload, HostSetupRequestPayload } from "./types";
import {
  upsertPipelineLeadFromIntake,
  upsertPipelineLeadFromSetupRequest,
} from "@/lib/leadCenter/syncFromCustomer";
import { geocodeCustomerInBackground } from "@/lib/geocoding/geocodeCustomer";
import { createOrUpdatePropertyFromHostIntake } from "@/lib/properties/propertyService";

/** Creates or updates a draft Customer from a lightweight /hosts setup request (no Property). */
export async function createSetupRequestHostCustomer(
  payload: HostSetupRequestPayload
) {
  const vermontBranch = await prisma.branch.findUnique({
    where: { slug: "vermont" },
    select: { id: true },
  });

  const nameParts = payload.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || payload.fullName;
  const lastName = nameParts.slice(1).join(" ") || "";
  const now = new Date();

  const existing = await prisma.customer.findUnique({
    where: { email: payload.email },
  });

  // Do not regress leadStatus if they already progressed past NEW.
  const keepAdvancedStatus =
    existing?.leadStatus && existing.leadStatus !== "NEW";

  const data = {
    firstName,
    lastName: lastName || existing?.lastName || "",
    phone: payload.phone || existing?.phone || null,
    city: payload.city || existing?.city || null,
    state: "VT",
    branchId: vermontBranch?.id ?? existing?.branchId ?? null,
    // Preserve a real street address if one already exists.
    addressLine1: existing?.addressLine1 ?? null,
    defaultAddress:
      existing?.defaultAddress ||
      (payload.city ? `${payload.city}, VT` : existing?.defaultAddress) ||
      null,
    leadStatus: keepAdvancedStatus
      ? existing!.leadStatus
      : ("NEW" as const),
    billingPolicy: "INVOICE_AFTER_SERVICE" as const,
    updatedAt: now,
  };

  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.customer.create({
        data: {
          id: randomUUID(),
          email: payload.email,
          ...data,
        },
      });

  await upsertPipelineLeadFromSetupRequest(prisma, customer, payload);

  // Intentionally no Property — town-only setup request has no street address yet.

  return { customer, property: null as null };
}

/** Creates or updates a draft Customer + Property from host intake data. */
export async function createDraftHostCustomer(payload: HostIntakePayload) {
  const vermontBranch = await prisma.branch.findUnique({
    where: { slug: "vermont" },
    select: { id: true },
  });

  const nameParts = payload.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || payload.fullName;
  const lastName = nameParts.slice(1).join(" ") || "";
  const now = new Date();

  const existing = await prisma.customer.findUnique({
    where: { email: payload.email },
  });

  const data = {
    firstName,
    lastName: lastName || existing?.lastName || "",
    phone: payload.phone || existing?.phone || null,
    addressLine1: payload.propertyAddress,
    city: payload.city,
    state: "VT",
    branchId: vermontBranch?.id ?? existing?.branchId ?? null,
    defaultAddress: `${payload.propertyAddress}, ${payload.city}, VT`,
    leadStatus: "INTAKE_RECEIVED" as const,
    billingPolicy: "INVOICE_AFTER_SERVICE" as const,
    updatedAt: now,
  };

  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.customer.create({
        data: {
          id: randomUUID(),
          email: payload.email,
          ...data,
        },
      });

  await upsertPipelineLeadFromIntake(prisma, customer, payload);

  // Persist standing property profile (upsert by customer + address).
  const property = await createOrUpdatePropertyFromHostIntake(
    prisma,
    customer.id,
    payload
  );

  geocodeCustomerInBackground(customer.id);

  return { customer, property };
}
