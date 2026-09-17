export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { markTipReceived } from '@/lib/tips/markTipReceived';
import { isTipPending } from '@/lib/tips/statuses';

/**
 * POST /api/admin/tips/[tipId]/confirm-received
 * Admin confirms Zelle/manual tip receipt. Guests cannot call this.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tipId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const tipId = params.tipId;

    const body = await request.json().catch(() => ({}));
    const amountDollars = Number(body.amount ?? body.amountReceived);
    const providerReference =
      typeof body.providerReference === 'string'
        ? body.providerReference.trim()
        : typeof body.bankMemo === 'string'
          ? body.bankMemo.trim()
          : null;
    const receivedAt = body.receivedAt ? new Date(body.receivedAt) : new Date();

    if (!Number.isFinite(amountDollars) || amountDollars <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount is required', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }
    if (Number.isNaN(receivedAt.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid receivedAt', code: 'INVALID_DATE' },
        { status: 400 }
      );
    }

    const tip = await prisma.tip.findUnique({
      where: { id: tipId },
      select: {
        id: true,
        amount: true,
        status: true,
        paymentMethod: true,
        jobId: true,
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

    if (!isTipPending(tip.status)) {
      const result = await markTipReceived({
        tipId: tip.id,
        amountCents: tip.amount,
        confirmedByAdminId: auth.userId,
        providerReference,
        receivedAt,
        source: 'ADMIN_ZELLE',
      });
      return NextResponse.json({ success: true, ...result });
    }

    const amountCents = Math.round(amountDollars * 100);
    const result = await markTipReceived({
      tipId: tip.id,
      amountCents,
      confirmedByAdminId: auth.userId,
      providerReference,
      receivedAt,
      source:
        tip.paymentMethod === 'ZELLE' ? 'ADMIN_ZELLE' : 'ADMIN_MANUAL',
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
      error instanceof Error ? error.message : 'Failed to confirm tip';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
