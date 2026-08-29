export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { JobOfferStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { isDispatchOffersEnabledForBranch } from '@/lib/dispatch/featureFlags';
import { createJobOffer } from '@/lib/dispatch/jobOffer';
import { isDispatchError } from '@/lib/dispatch/errors';
import { previewCompensationFromOperationalTotal } from '@/lib/dispatch/compensation';
import { deriveDispatchUiState } from '@/lib/dispatch/dispatchState';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const { jobId } = params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        assignedCleanerId: true,
        operationalTotal: true,
        dispatchUrgency: true,
        estimatedDurationMins: true,
        Branch: { select: { slug: true } },
        User: { select: { name: true } },
      },
    });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const offers = await prisma.jobOffer.findMany({
      where: { jobId },
      orderBy: { offeredAt: 'desc' },
      include: {
        Cleaner: { select: { id: true, name: true, email: true } },
      },
    });

    const mapped = offers.map((o) => ({
      id: o.id,
      status: o.status,
      cleanerId: o.cleanerId,
      cleanerName: o.Cleaner.name,
      cleanerEmail: o.Cleaner.email,
      offeredAt: o.offeredAt.toISOString(),
      expiresAt: o.expiresAt.toISOString(),
      respondedAt: o.respondedAt?.toISOString() ?? null,
      declineReason: o.declineReason,
      compensationAmount: Number(o.compensationAmount),
      compensationCurrency: o.compensationCurrency,
      compensationBasis: o.compensationBasis,
      estimatedDurationMins: o.estimatedDurationMins,
      operationalNotes: o.operationalNotes,
      channel: o.channel,
    }));

    const open = mapped.find((o) => o.status === JobOfferStatus.OFFERED) ?? null;
    const latestTerminal =
      mapped.find((o) => o.status !== JobOfferStatus.OFFERED) ?? null;
    const ui = deriveDispatchUiState({
      assignedCleanerId: job.assignedCleanerId,
      assignedCleanerName: job.User?.name ?? null,
      openOffer: open
        ? {
            id: open.id,
            status: open.status,
            cleanerName: open.cleanerName,
            expiresAt: open.expiresAt,
            compensationAmount: open.compensationAmount,
          }
        : null,
      latestTerminalOffer: latestTerminal
        ? {
            id: latestTerminal.id,
            status: latestTerminal.status,
            cleanerName: latestTerminal.cleanerName,
            expiresAt: latestTerminal.expiresAt,
            compensationAmount: latestTerminal.compensationAmount,
          }
        : null,
    });

    return NextResponse.json({
      success: true,
      dispatchOffersEnabled: isDispatchOffersEnabledForBranch(job.Branch?.slug),
      dispatchUrgency: job.dispatchUrgency,
      estimatedDurationMins: job.estimatedDurationMins,
      compensationPreview: previewCompensationFromOperationalTotal(job.operationalTotal),
      ui,
      offers: mapped,
    });
  } catch (err) {
    const auth = rethrowIfAuthResponse(err);
    if (auth) return auth;
    const message = err instanceof Error ? err.message : 'Failed to load offers';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const { jobId } = params;
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { Branch: { select: { slug: true } } },
    });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    if (!isDispatchOffersEnabledForBranch(job.Branch?.slug)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Offer dispatcher is not enabled for this branch',
          code: 'DISPATCH_OFFERS_DISABLED',
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const offer = await createJobOffer({
      jobId,
      cleanerId: String(body.cleanerId || ''),
      compensationAmount: body.compensationAmount,
      compensationBasis: body.compensationBasis,
      estimatedDurationMins:
        body.estimatedDurationMins != null ? Number(body.estimatedDurationMins) : null,
      operationalNotes:
        typeof body.operationalNotes === 'string' ? body.operationalNotes : null,
      ttlMinutes: body.ttlMinutes != null ? Number(body.ttlMinutes) : null,
      channel: body.channel === 'PORTAL' ? 'PORTAL' : 'EMAIL',
      createdByAdminId: admin.userId,
    });

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        status: offer.status,
        expiresAt: offer.expiresAt.toISOString(),
        compensationAmount: Number(offer.compensationAmount),
        compensationBasis: offer.compensationBasis,
      },
      message: 'Offer sent. Assignment activates only after the cleaner accepts.',
    });
  } catch (err) {
    const auth = rethrowIfAuthResponse(err);
    if (auth) return auth;
    if (isDispatchError(err)) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : 'Failed to send offer';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
