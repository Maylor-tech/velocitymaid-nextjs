import { JobStatus, Prisma } from '@prisma/client';

const CLOSED_STATUSES: JobStatus[] = [
  JobStatus.COMPLETED,
  JobStatus.CANCELLED,
  JobStatus.CANCELLED_EMERGENCY,
];

/**
 * Customer "My Jobs" query — all legitimate Jobs for this customer,
 * including PENDING-payment host requests. Service lifecycle (not Stripe)
 * decides upcoming vs past.
 */
export function customerJobListWhere(
  customerId: string,
  type: string
): Prisma.JobWhereInput {
  const base: Prisma.JobWhereInput = { customerId };

  if (type === 'upcoming') {
    return {
      ...base,
      status: { notIn: CLOSED_STATUSES },
    };
  }

  if (type === 'past') {
    return {
      ...base,
      status: { in: CLOSED_STATUSES },
    };
  }

  return base;
}
