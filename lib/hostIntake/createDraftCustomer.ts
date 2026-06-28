import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { HostIntakePayload } from "./types";

/** Creates or updates a draft Customer record from host intake data. */
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
    leadStatus: "NEW" as const,
    updatedAt: now,
  };

  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.customer.create({
    data: {
      id: randomUUID(),
      email: payload.email,
      ...data,
    },
  });
}
