export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Record an externally completed assistant payment (Zelle/cash/check).
 * Does not initiate a transfer and does not touch JobPayout or customer money.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import {
  applyRecordPayment,
  canMutateCompensation,
  formatPaidSummary,
  fromDbCompensationRow,
  isTeamPaymentMethod,
  parseUsdToCents,
  toCompensationView,
} from '@/lib/cleaners/jobTeamCompensation';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        branchId: true,
        assignedCleanerId: true,
        paymentStatus: true,
        JobTeamMember: { select: { cleanerId: true, sortOrder: true } },
        JobPayout: { select: { id: true, cleanerId: true, status: true, paidAt: true } },
      },
    });
    if (!job || (auth.branchId && job.branchId !== auth.branchId)) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const body = await request.json();
    const cleanerId = typeof body.cleanerId === 'string' ? body.cleanerId.trim() : '';
    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'cleanerId is required' },
        { status: 400 }
      );
    }

    const ordered = [...job.JobTeamMember].sort((a, b) => a.sortOrder - b.sortOrder);
    const primaryCleanerId = job.assignedCleanerId ?? ordered[0]?.cleanerId ?? null;
    const assistantCleanerIds = ordered
      .map((m) => m.cleanerId)
      .filter((id) => id !== primaryCleanerId);

    const existingRow = await prisma.jobTeamCompensation.findUnique({
      where: { jobId_cleanerId: { jobId: job.id, cleanerId } },
    });
    if (!existingRow) {
      return NextResponse.json(
        { success: false, error: 'Set compensation before recording a payment.' },
        { status: 400 }
      );
    }

    const gate = canMutateCompensation({
      cleanerId,
      primaryCleanerId,
      assistantCleanerIds,
      existing: existingRow,
    });
    if ('error' in gate) {
      return NextResponse.json(
        { success: false, error: gate.error, code: gate.code },
        { status: 400 }
      );
    }

    const amountCents =
      typeof body.amountCents === 'number' && Number.isInteger(body.amountCents)
        ? body.amountCents
        : parseUsdToCents(body.amountDollars ?? body.amount) ?? existingRow.amountCents;

    if (!isTeamPaymentMethod(body.paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'paymentMethod must be ZELLE, CASH, CHECK, or OTHER.' },
        { status: 400 }
      );
    }

    const paidAtRaw = body.paidAt ? new Date(body.paidAt) : new Date();
    if (Number.isNaN(paidAtRaw.getTime())) {
      return NextResponse.json(
        { success: false, error: 'paidAt is invalid.' },
        { status: 400 }
      );
    }

    const result = applyRecordPayment({
      existing: fromDbCompensationRow(existingRow),
      confirm: body.confirm === true,
      amountCents,
      paymentMethod: body.paymentMethod,
      paidAt: paidAtRaw,
      paymentRef: typeof body.paymentRef === 'string' ? body.paymentRef.trim() || null : null,
      note: typeof body.note === 'string' ? body.note.trim() || null : existingRow.note,
    });

    if ('error' in result) {
      const status = result.code === 'CONFIRM_REQUIRED' ? 400 : 409;
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status }
      );
    }

    const saved = result.idempotent
      ? existingRow
      : await prisma.jobTeamCompensation.update({
          where: { id: existingRow.id },
          data: {
            amountCents: result.next.amountCents,
            status: 'PAID',
            paymentMethod: result.next.paymentMethod,
            paidAt: result.next.paidAt,
            paymentRef: result.next.paymentRef,
            note: result.next.note,
            updatedAt: new Date(),
          },
        });

    return NextResponse.json({
      success: true,
      idempotent: result.idempotent,
      compensation: toCompensationView(fromDbCompensationRow(saved)),
      summary: formatPaidSummary(fromDbCompensationRow(saved)),
      jobPayout: job.JobPayout
        ? {
            id: job.JobPayout.id,
            cleanerId: job.JobPayout.cleanerId,
            status: job.JobPayout.status,
            paidAt: job.JobPayout.paidAt?.toISOString() ?? null,
          }
        : null,
      jobPaymentStatus: job.paymentStatus,
      primaryCleanerId,
    });
  } catch (error: unknown) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to record payment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
