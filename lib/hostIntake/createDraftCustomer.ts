import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { HostIntakePayload } from "./types";
import { upsertPipelineLeadFromIntake } from "@/lib/leadCenter/syncFromCustomer";
import { geocodeCustomerInBackground } from "@/lib/geocoding/geocodeCustomer";
import { createOrUpdatePropertyFromHostIntake } from "@/lib/properties/propertyService";

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
