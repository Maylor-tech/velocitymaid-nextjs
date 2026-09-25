export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { markTipAllocationPaidOut } from '@/lib/tips/tipAllocation';

/**
 * POST /api/admin/tips/allocations/[allocationId]/mark-paid-out
 * Records external settlement of one TipAllocation share. Does not transfer funds.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { allocationId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const allocationId = params.allocationId;
    const body = await request.json().catch(() => ({}));

    const payoutMethod =
      typeof body.payoutMethod === 'string'
        ? body.payoutMethod
        : typeof body.paidOutMethod === 'string'
          ? body.paidOutMethod
          : typeof body.method === 'string'
            ? body.method
            : '';
    const payoutReference =
      typeof body.payoutReference === 'string'
        ? body.payoutReference
        : typeof body.reference === 'string'
          ? body.reference
          : null;
    const paidOutAt = body.paidOutAt ? new Date(body.paidOutAt) : undefined;

    const allocation = await prisma.tipAllocation.findUnique({
      where: { id: allocationId },
      select: {
        id: true,
        Tip: { select: { Job: { select: { branchId: true } } } },
      },
    });
    if (!allocation) {
      return NextResponse.json(
        { success: false, error: 'Allocation not found' },
        { status: 404 }
      );
    }
    if (
      auth.branchId &&
      allocation.Tip?.Job?.branchId &&
      allocation.Tip.Job.branchId !== auth.branchId
    ) {
      return NextResponse.json(
        { success: false, error: 'Allocation not found' },
        { status: 404 }
      );
    }

    const result = await markTipAllocationPaidOut({
      allocationId,
      adminId: auth.userId,
      payoutMethod,
      payoutReference,
      paidOutAt,
    });

    if (result.ok === false) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
      note: 'Settlement recorded only — API did not transfer funds.',
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to mark allocation paid out';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
