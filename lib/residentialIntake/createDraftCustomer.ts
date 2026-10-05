import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { geocodeCustomerInBackground } from "@/lib/geocoding/geocodeCustomer";
import { upsertPipelineLeadFromResidentialIntake } from "@/lib/leadCenter/syncFromCustomer";
import { createOrUpdatePropertyFromResidentialIntake } from "@/lib/properties/residentialProfile";
import type { ResidentialIntakePayload } from "./types";

/**
 * Creates or updates Customer + PipelineLead + Property from /residential.
 * Never creates a Job. Leaves billingPolicy at PREPAY until admin approval.
 */
export async function createDraftResidentialCustomer(
  payload: ResidentialIntakePayload
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

  const keepBillingPolicy = existing?.billingPolicy ?? ("PREPAY" as const);
  const keepAdvancedStatus =
    existing?.leadStatus &&
    existing.leadStatus !== "NEW" &&
    existing.leadStatus !== "INTAKE_RECEIVED";

  const data = {
    firstName,
    lastName: lastName || existing?.lastName || "",
    phone: payload.phone || existing?.phone || null,
    addressLine1: payload.serviceAddress,
    city: payload.city,
    state: "VT",
    branchId: vermontBranch?.id ?? existing?.branchId ?? null,
    defaultAddress: `${payload.serviceAddress}, ${payload.city}, VT`,
    leadStatus: keepAdvancedStatus
      ? existing!.leadStatus
      : ("INTAKE_RECEIVED" as const),
    billingPolicy: keepBillingPolicy,
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

  await upsertPipelineLeadFromResidentialIntake(prisma, customer, payload);

  const property = await createOrUpdatePropertyFromResidentialIntake(
    prisma,
    customer.id,
    payload
  );

  geocodeCustomerInBackground(customer.id);

  return { customer, property, job: null as null };
}
