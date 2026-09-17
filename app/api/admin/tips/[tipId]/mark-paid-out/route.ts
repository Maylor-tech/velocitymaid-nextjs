export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { markTipPaidOut } from '@/lib/tips/markTipPaidOut';

/**
 * POST /api/admin/tips/[tipId]/mark-paid-out
 * Manual tip settlement — ledger only, no bank transfer.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tipId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const tipId = params.tipId;
    const body = await request.json().catch(() => ({}));

    const paidOutMethod =
      typeof body.paidOutMethod === 'string'
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

    const tip = await prisma.tip.findUnique({
      where: { id: tipId },
      select: {
        id: true,
        Job: { select: { branchId: true } },
      },
    });
    if (!tip) {
      return NextResponse.json(
        { success: false, error: 'Tip not found' },
        { status: 404 }
      );
    }
    if (auth.branchId && tip.Job?.branchId && tip.Job.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: 'Tip not found' },
        { status: 404 }
      );
    }

    const result = await markTipPaidOut({
      tipId,
      adminId: auth.userId,
      paidOutMethod,
      payoutReference,
      paidOutAt,
    });

    if (result.ok === false) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : 'Failed to mark tip paid out';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
