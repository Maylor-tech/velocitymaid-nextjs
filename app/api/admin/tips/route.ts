export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { normalizeTipStatus } from '@/lib/tips/statuses';

/**
 * GET /api/admin/tips
 * Compact tip reconciliation list (not a full finance dashboard).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const tips = await prisma.tip.findMany({
      where: auth.branchId
        ? { Job: { branchId: auth.branchId } }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        internalReference: true,
        providerReference: true,
        stripePaymentIntentId: true,
        stripeEventId: true,
        jobId: true,
        beneficiaryCleanerId: true,
        receivedAt: true,
        paidOutAt: true,
        createdAt: true,
        updatedAt: true,
        guestName: true,
      },
    });

    const mapped = tips.map((t) => {
      const canonical = normalizeTipStatus(t.status);
      const stripeDbMismatch =
        Boolean(t.stripePaymentIntentId) &&
        (t.status === 'pending' || t.status === 'PENDING') &&
        !t.receivedAt;
      return {
        id: t.id,
        amountCents: t.amount,
        amountDollars: t.amount / 100,
        currency: t.currency,
        status: t.status,
        canonicalStatus: canonical,
        paymentMethod: t.paymentMethod,
        internalReference: t.internalReference,
        providerReference: t.providerReference,
        stripePaymentIntentId: t.stripePaymentIntentId,
        stripeEventId: t.stripeEventId,
        jobId: t.jobId,
        beneficiaryCleanerId: t.beneficiaryCleanerId,
        receivedAt: t.receivedAt?.toISOString() ?? null,
        paidOutAt: t.paidOutAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        guestName: t.guestName,
        flags: {
          pendingZelle:
            t.paymentMethod === 'ZELLE' &&
            (canonical === 'PENDING' || t.status === 'pending'),
          receivedAttributed: canonical === 'RECEIVED',
          receivedUnattributed: canonical === 'RECEIVED_UNATTRIBUTED',
          paidOut: canonical === 'PAID_OUT',
          possibleStripeDbMismatch: stripeDbMismatch,
        },
      };
    });

    const filtered = statusFilter
      ? mapped.filter(
          (t) =>
            t.canonicalStatus === statusFilter.toUpperCase() ||
            t.status === statusFilter
        )
      : mapped;

    const summary = {
      pending: mapped.filter((t) => t.canonicalStatus === 'PENDING').length,
      receivedAttributed: mapped.filter((t) => t.flags.receivedAttributed)
        .length,
      receivedUnattributed: mapped.filter((t) => t.flags.receivedUnattributed)
        .length,
      paidOut: mapped.filter((t) => t.flags.paidOut).length,
      possibleStripeDbMismatch: mapped.filter(
        (t) => t.flags.possibleStripeDbMismatch
      ).length,
      pendingZelle: mapped.filter((t) => t.flags.pendingZelle).length,
    };

    return NextResponse.json({ success: true, summary, tips: filtered });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : 'Failed to list tips';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
