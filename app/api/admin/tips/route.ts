export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { normalizeTipStatus } from '@/lib/tips/statuses';
import {
  buildTipReconFlags,
  reconcileReasonLabel,
} from '@/lib/tips/tipReconciliation';
import { cleanerTipEntitlementCents } from '@/lib/tips/tipPolicy';

/**
 * GET /api/admin/tips
 * Compact tip payables / reconciliation list.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const view = searchParams.get('view'); // payable | reconcile | all

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
        propertyId: true,
        beneficiaryCleanerId: true,
        receivedAt: true,
        paidOutAt: true,
        paidOutMethod: true,
        payoutReference: true,
        refundedAt: true,
        disputedAt: true,
        disputeClosedAt: true,
        disputeStatus: true,
        needsReconcile: true,
        reconcileReason: true,
        createdAt: true,
        updatedAt: true,
        guestName: true,
        Job: {
          select: {
            jobReference: true,
            branchId: true,
          },
        },
        Property: {
          select: {
            id: true,
            name: true,
            guestDisplayName: true,
          },
        },
        Beneficiary: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const mapped = tips.map((t) => {
      const canonical = normalizeTipStatus(t.status);
      const flags = buildTipReconFlags(t);
      const entitlementCents = cleanerTipEntitlementCents(t.amount);
      return {
        id: t.id,
        amountCents: t.amount,
        amountDollars: t.amount / 100,
        entitlementCents,
        entitlementDollars: entitlementCents / 100,
        platformShareCents: 0,
        currency: t.currency,
        status: t.status,
        canonicalStatus: canonical,
        paymentMethod: t.paymentMethod,
        internalReference: t.internalReference,
        providerReference: t.providerReference,
        stripePaymentIntentId: t.stripePaymentIntentId,
        stripeEventId: t.stripeEventId,
        jobId: t.jobId,
        jobReference: t.Job?.jobReference ?? null,
        propertyId: t.propertyId,
        propertyName:
          t.Property?.guestDisplayName || t.Property?.name || null,
        beneficiaryCleanerId: t.beneficiaryCleanerId,
        beneficiaryName: t.Beneficiary?.name || null,
        beneficiaryEmail: t.Beneficiary?.email || null,
        receivedAt: t.receivedAt?.toISOString() ?? null,
        paidOutAt: t.paidOutAt?.toISOString() ?? null,
        paidOutMethod: t.paidOutMethod,
        payoutReference: t.payoutReference,
        refundedAt: t.refundedAt?.toISOString() ?? null,
        disputedAt: t.disputedAt?.toISOString() ?? null,
        disputeClosedAt: t.disputeClosedAt?.toISOString() ?? null,
        disputeStatus: t.disputeStatus,
        needsReconcile: t.needsReconcile,
        reconcileReason: t.reconcileReason,
        reconcileReasonLabel: reconcileReasonLabel(
          flags.reconcileReason || t.reconcileReason
        ),
        createdAt: t.createdAt.toISOString(),
        guestName: t.guestName,
        flags,
      };
    });

    let filtered = mapped;
    if (view === 'payable') {
      filtered = mapped.filter((t) => t.flags.payable);
    } else if (view === 'reconcile') {
      filtered = mapped.filter(
        (t) =>
          t.flags.needsReconcile ||
          t.flags.possibleStripeDbMismatch ||
          t.flags.refundAfterPaidOut ||
          t.flags.disputeAfterPaidOut
      );
    } else if (statusFilter) {
      filtered = mapped.filter(
        (t) =>
          t.canonicalStatus === statusFilter.toUpperCase() ||
          t.status === statusFilter
      );
    }

    const summary = {
      pending: mapped.filter((t) => t.canonicalStatus === 'PENDING').length,
      payable: mapped.filter((t) => t.flags.payable).length,
      receivedAttributed: mapped.filter((t) => t.flags.receivedAttributed)
        .length,
      receivedUnattributed: mapped.filter((t) => t.flags.receivedUnattributed)
        .length,
      paidOut: mapped.filter((t) => t.flags.paidOut).length,
      refunded: mapped.filter((t) => t.flags.refunded).length,
      disputeOpen: mapped.filter((t) => t.flags.disputeOpen).length,
      needsReconcile: mapped.filter((t) => t.flags.needsReconcile).length,
      possibleStripeDbMismatch: mapped.filter(
        (t) => t.flags.possibleStripeDbMismatch
      ).length,
      pendingZelle: mapped.filter((t) => t.flags.pendingZelle).length,
      payableCents: mapped
        .filter((t) => t.flags.payable)
        .reduce((sum, t) => sum + t.entitlementCents, 0),
    };

    return NextResponse.json({ success: true, summary, tips: filtered });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : 'Failed to list tips';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
