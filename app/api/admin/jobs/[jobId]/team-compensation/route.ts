export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Assistant compensation ledger for a job.
 * PUT upserts an OWED amount. Never touches JobPayout, invoice, or paymentStatus.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import {
  canMutateCompensation,
  fromDbCompensationRow,
  parseUsdToCents,
  toCompensationView,
} from '@/lib/cleaners/jobTeamCompensation';

async function loadJobContext(jobId: string, authBranchId?: string | null) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      branchId: true,
      assignedCleanerId: true,
      paymentStatus: true,
      JobTeamMember: { select: { cleanerId: true, sortOrder: true } },
      JobPayout: { select: { id: true, cleanerId: true, status: true } },
    },
  });
  if (!job) {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 }),
    };
  }
  if (authBranchId && job.branchId !== authBranchId) {
    return {
      ok: false as const,
      error: NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 }),
    };
  }
  const ordered = [...job.JobTeamMember].sort((a, b) => a.sortOrder - b.sortOrder);
  const primaryCleanerId = job.assignedCleanerId ?? ordered[0]?.cleanerId ?? null;
  const assistantCleanerIds = ordered
    .map((m) => m.cleanerId)
    .filter((id) => id !== primaryCleanerId);
  return { ok: true as const, job, primaryCleanerId, assistantCleanerIds };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const ctx = await loadJobContext(params.jobId, auth.branchId);
    if (!ctx.ok) return ctx.error;

    const rows = await prisma.jobTeamCompensation.findMany({
      where: { jobId: params.jobId },
    });
    return NextResponse.json({
      success: true,
      compensations: rows.map((r) => toCompensationView(fromDbCompensationRow(r))),
    });
  } catch (error: unknown) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load compensation';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const ctx = await loadJobContext(params.jobId, auth.branchId);
    if (!ctx.ok) return ctx.error;
    const { job, primaryCleanerId, assistantCleanerIds } = ctx;

    const body = await request.json();
    const cleanerId = typeof body.cleanerId === 'string' ? body.cleanerId.trim() : '';
    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'cleanerId is required' },
        { status: 400 }
      );
    }

    const amountCents =
      typeof body.amountCents === 'number' && Number.isInteger(body.amountCents)
        ? body.amountCents
        : parseUsdToCents(body.amountDollars ?? body.amount);
    if (amountCents == null || amountCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'A positive compensation amount is required.' },
        { status: 400 }
      );
    }

    const existingRow = await prisma.jobTeamCompensation.findUnique({
      where: { jobId_cleanerId: { jobId: job.id, cleanerId } },
    });
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

    if (existingRow?.status === 'PAID') {
      return NextResponse.json(
        {
          success: false,
          code: 'ALREADY_PAID',
          error: 'Paid compensation cannot be edited. Historical records are preserved.',
        },
        { status: 409 }
      );
    }

    const note = typeof body.note === 'string' ? body.note.trim() || null : existingRow?.note ?? null;

    const saved = existingRow
      ? await prisma.jobTeamCompensation.update({
          where: { id: existingRow.id },
          data: { amountCents, note, updatedAt: new Date() },
        })
      : await prisma.jobTeamCompensation.create({
          data: {
            jobId: job.id,
            cleanerId,
            branchId: job.branchId,
            amountCents,
            currency: 'USD',
            status: 'OWED',
            note,
          },
        });

    return NextResponse.json({
      success: true,
      compensation: toCompensationView(fromDbCompensationRow(saved)),
      jobPayoutId: job.JobPayout?.id ?? null,
      jobPaymentStatus: job.paymentStatus,
      primaryCleanerId,
    });
  } catch (error: unknown) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to save compensation';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
