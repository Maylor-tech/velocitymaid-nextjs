import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import {
  ALLOCATION_TYPES,
  assertAllocationMemo,
  assertAllocationsWithinPayment,
  MANUAL_PAYMENT_METHODS,
  PAID_FROM_KINDS,
  type AllocationType,
  type ManualPaymentMethod,
  type PaidFromKind,
} from '@/lib/cleanerComp/pay';

export const dynamic = 'force-dynamic';

type IncomingAllocation = {
  jobId?: string;
  amount?: number;
  type?: string;
  memo?: string;
  appliedJobId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const cleanerId = String(body.cleanerId || '');
    const amount = Number(body.amount);
    const method = String(body.method || '') as ManualPaymentMethod;
    const memo = typeof body.memo === 'string' ? body.memo.trim() : '';
    const paidOn = new Date(String(body.date || ''));
    const paidFromKind = (
      PAID_FROM_KINDS.includes(body.paidFromKind) ? body.paidFromKind : 'UNKNOWN'
    ) as PaidFromKind;
    const paidFromLabel = typeof body.paidFromLabel === 'string' ? body.paidFromLabel.trim() : '';
    const allocations = Array.isArray(body.allocations) ? (body.allocations as IncomingAllocation[]) : [];
    if (!cleanerId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Cleaner and amount are required.' }, { status: 400 });
    }
    if (!MANUAL_PAYMENT_METHODS.includes(method)) {
      return NextResponse.json({ success: false, error: 'Method must be Zelle, cash, check, or other.' }, { status: 400 });
    }
    if (Number.isNaN(paidOn.getTime())) {
      return NextResponse.json({ success: false, error: 'Date is required.' }, { status: 400 });
    }
    if (paidFromKind === 'PERSONAL_FUNDS' && !paidFromLabel) {
      return NextResponse.json({ success: false, error: 'Name the person whose funds paid this.' }, { status: 400 });
    }
    if (paidFromKind === 'BUSINESS_ACCOUNT' && !paidFromLabel) {
      return NextResponse.json({ success: false, error: 'Name the business account.' }, { status: 400 });
    }

    const parsed = allocations.map((row) => {
      const type = (ALLOCATION_TYPES.includes(row.type as AllocationType) ? row.type : 'JOB') as AllocationType;
      const allocationMemo = typeof row.memo === 'string' ? row.memo.trim() : '';
      assertAllocationMemo(type, allocationMemo || memo);
      return {
        type,
        jobId: row.jobId ? String(row.jobId) : null,
        amount: Number(row.amount),
        memo: allocationMemo || (type === 'JOB' ? null : memo),
        appliedJobId: row.appliedJobId ? String(row.appliedJobId) : null,
      };
    });
    if (parsed.some((row) => !Number.isFinite(row.amount) || row.amount <= 0)) {
      return NextResponse.json({ success: false, error: 'Each allocation needs an amount.' }, { status: 400 });
    }
    if (parsed.some((row) => row.type === 'JOB' && !row.jobId)) {
      return NextResponse.json({ success: false, error: 'A job allocation needs a job.' }, { status: 400 });
    }
    const allocated = parsed.reduce((sum, row) => sum + row.amount, 0);
    try {
      assertAllocationsWithinPayment(amount, allocated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Allocations cannot exceed the payment.';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.manualPayment.create({
        data: {
          cleanerId,
          paidOn,
          amount,
          method,
          paidFromKind,
          paidFromLabel: paidFromLabel || null,
          memo: memo || null,
          recordedBy: admin.userId,
          allocations: {
            create: parsed.map((row) => ({
              allocationType: row.type,
              jobId: row.type === 'JOB' ? row.jobId : null,
              amount: row.amount,
              memo: row.memo,
              appliedJobId: row.type === 'ADVANCE' ? row.appliedJobId : null,
            })),
          },
        },
      });
      if (paidFromKind === 'PERSONAL_FUNDS') {
        await tx.reimbursementOwed.create({
          data: {
            manualPaymentId: created.id,
            personName: paidFromLabel,
            amount,
          },
        });
      }
      return created;
    });
    return NextResponse.json({ success: true, id: payment.id });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not record the payment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
