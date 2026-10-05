import {
  createAdminNotification,
  type CreateAdminNotificationResult,
} from "@/lib/notifications/adminNotificationCenter";

export async function notifyResidentialIntakeReceived(input: {
  customerId: string;
  customerName: string;
  address: string;
  city: string;
}): Promise<CreateAdminNotificationResult & { type: "RESIDENTIAL_INTAKE" }> {
  const opsAlert = await createAdminNotification({
    type: "RESIDENTIAL_INTAKE",
    severity: "INFO",
    message: `Residential intake — ${input.customerName} · ${input.address}, ${input.city}`,
    actionUrl: `/admin/customers/${input.customerId}`,
  });
  return { ...opsAlert, type: "RESIDENTIAL_INTAKE" };
}

export async function notifyResidentialCleaningRequestCreated(input: {
  jobId: string;
  jobReference: string | null;
  customerName: string;
  address: string;
}): Promise<
  CreateAdminNotificationResult & { type: "RESIDENTIAL_CLEANING_REQUEST" }
> {
  const opsAlert = await createAdminNotification({
    type: "RESIDENTIAL_CLEANING_REQUEST",
    severity: "INFO",
    message: `Residential cleaning request ${input.jobReference || input.jobId} — ${input.customerName} · ${input.address}`,
    jobId: input.jobId,
    actionUrl: `/admin/jobs/${input.jobId}`,
    idempotent: true,
  });
  return { ...opsAlert, type: "RESIDENTIAL_CLEANING_REQUEST" };
}
