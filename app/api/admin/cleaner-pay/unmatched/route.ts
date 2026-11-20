import { NextRequest, NextResponse } from 'next/server';
import { CompensationBasis, JobOfferStatus } from '@prisma/client';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import { parseHourlyBasis } from '@/lib/cleanerComp/importHistory';

export const dynamic = 'force-dynamic';

/**
 * Admin links one unmatched row to a job. MATCH: references are never linked by themselves.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const allocationId = String(body.allocationId || '');
    const jobId = String(body.jobId || '');
    if (!allocationId || !jobId) {
      return NextResponse.json({ success: false, error: 'Choose the unmatched row and the job.' }, { status: 400 });
    }
    const allocation = await prisma.manualPaymentAllocation.findUnique({
      where: { id: allocationId },
      include: { ManualPayment: true },
    });
    if (!allocation) {
      return NextResponse.json({ success: false, error: 'That allocation was not found.' }, { status: 404 });
    }
    if (allocation.jobId) {
      return NextResponse.json({ success: true, alreadyLinked: true, jobId: allocation.jobId });
    }
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, preferredDate: true, completedAt: true },
    });
    if (!job) {
      return NextResponse.json({ success: false, error: 'That job was not found.' }, { status: 404 });
    }

    const hourly = parseHourlyBasis(allocation.payBasisNote ?? '');
    const amount = Number(allocation.amount);
    await prisma.$transaction(async (tx) => {
      await tx.manualPaymentAllocation.update({
        where: { id: allocation.id },
        data: { jobId: job.id },
      });
      if (!hourly) return;
      const offerId = `offer-link-${allocation.id}`;
      const existing = await tx.compensationAgreement.findFirst({
        where: { jobId: job.id, cleanerId: allocation.ManualPayment.cleanerId },
      });
      if (!existing) {
        await tx.jobOffer.create({
          data: {
            id: offerId,
            jobId: job.id,
            cleanerId: allocation.ManualPayment.cleanerId,
            status: JobOfferStatus.ACCEPTED,
            offeredAt: allocation.ManualPayment.paidOn,
            expiresAt: allocation.ManualPayment.paidOn,
            respondedAt: allocation.ManualPayment.paidOn,
            compensationAmount: hourly.rate,
            compensationCurrency: 'USD',
            compensationBasis: CompensationBasis.HOURLY,
            operationalNotes: 'Linked from unmatched history. No offer email was sent.',
            createdByAdminId: admin.userId,
          },
        });
        await tx.compensationAgreement.create({
          data: {
            jobOfferId: offerId,
            jobId: job.id,
            cleanerId: allocation.ManualPayment.cleanerId,
            method: 'HOURLY',
            rate: hourly.rate,
            assisted: hourly.assisted,
            payBasis: 'TERMS',
            verifiedHours: hourly.hours,
            hoursVerifiedBy: admin.userId,
            hoursVerifiedAt: new Date(),
            frozenAt: job.completedAt ?? allocation.ManualPayment.paidOn,
            setBy: admin.userId,
            note: allocation.payBasisNote,
          },
        });
      }
      const expected = Math.round(hourly.hours * hourly.rate * 100) / 100;
      const balance = Math.round((expected - amount) * 100) / 100;
      await tx.cleanerPayable.upsert({
        where: { jobId_cleanerId: { jobId: job.id, cleanerId: allocation.ManualPayment.cleanerId } },
        update: {},
        create: {
          jobId: job.id,
          cleanerId: allocation.ManualPayment.cleanerId,
          expected,
          paid: amount,
          balance,
          status: balance === 0 ? 'PAID_MANUALLY' : balance > 0 ? 'OWED' : 'OVERPAID',
        },
      });
    });

    return NextResponse.json({ success: true, linked: true });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not link the payment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
