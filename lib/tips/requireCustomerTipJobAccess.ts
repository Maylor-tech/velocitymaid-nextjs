import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';

export type CustomerTipJobAccess = {
  customerId: string;
  email: string;
  jobId: string;
};

/**
 * Authenticated CUSTOMER + job ownership for tip context / tip create.
 * Cross-customer and missing jobs fail closed as 404 (do not confirm existence).
 * Throws NextResponse on auth/ownership failure (same pattern as requireRole).
 */
export async function requireCustomerTipJobAccess(
  request: NextRequest,
  jobId: string
): Promise<CustomerTipJobAccess> {
  await requireRole(request, 'CUSTOMER');
  const session = await getCustomerSession();
  if (!session) {
    throw NextResponse.json(
      { success: false, error: 'Unauthorized: Customer authentication required' },
      { status: 401 }
    );
  }

  const ownership = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, customerId: true },
  });

  if (!ownership || ownership.customerId !== session.customerId) {
    throw NextResponse.json(
      { success: false, error: 'Job not found', code: 'JOB_NOT_FOUND' },
      { status: 404 }
    );
  }

  return {
    customerId: session.customerId,
    email: session.email,
    jobId: ownership.id,
  };
}
