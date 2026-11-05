import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AuthContext } from './requireRole';

export function verifiedBranchIds(auth: AuthContext): string[] {
  if (auth.branchIds?.length) return auth.branchIds;
  return auth.branchId ? [auth.branchId] : [];
}

function forbidden(error: string): NextResponse {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

/** A requested branch must be one of the admin's verified memberships. Owners may name any branch. */
export function assertAssignedBranch(auth: AuthContext, branchId: string): void {
  if (auth.isOwner) return;
  if (!verifiedBranchIds(auth).includes(branchId)) {
    throw forbidden('Forbidden: Branch is not assigned');
  }
}

/**
 * Non-owners never run an unfiltered job query.
 * An omitted branch filter is limited to verified memberships.
 */
export function jobBranchWhere(
  auth: AuthContext,
  requestedBranchId?: string | null
): { branchId?: string | { in: string[] } } {
  const requested = requestedBranchId?.trim() ?? '';
  if (auth.isOwner) {
    if (!requested || requested === 'all') return {};
    return { branchId: requested };
  }
  const allowed = verifiedBranchIds(auth);
  if (!allowed.length) throw forbidden('Forbidden: No branch access assigned');
  if (!requested || requested === 'all') return { branchId: { in: allowed } };
  if (!allowed.includes(requested)) throw forbidden('Forbidden: Branch is not assigned');
  return { branchId: requested };
}

/** Record-level check for job detail and mutations. Missing jobs stay 404. */
export async function assertAdminJobRecord(auth: AuthContext, jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { branchId: true },
  });
  if (!job) {
    throw NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
  }
  assertAssignedBranch(auth, job.branchId);
}
