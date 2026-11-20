import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import { MANUAL_PAYMENT_METHODS, type ManualPaymentMethod } from '@/lib/cleanerComp/pay';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const cleanerId = String(body.cleanerId || '');
    const amount = Number(body.amount);
    const method = String(body.method || '') as ManualPaymentMethod;
    const memo = typeof body.memo === 'string' ? body.memo.trim() : '';
    const paidOn = new Date(String(body.date || ''));
    const allocations = Array.isArray(body.allocations) ? body.allocations : [];
    if (!cleanerId || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Cleaner and amount are required.' }, { status: 400 });
    }
    if (!MANUAL_PAYMENT_METHODS.includes(method)) {
      return NextResponse.json({ success: false, error: 'Method must be Zelle, cash, check, or other.' }, { status: 400 });
    }
    if (Number.isNaN(paidOn.getTime())) {
      return NextResponse.json({ success: false, error: 'Date is required.' }, { status: 400 });
    }
    const parsed = allocations.map((row: { jobId?: string; amount?: number }) => ({
      jobId: String(row.jobId || ''),
      amount: Number(row.amount),
    }));
    if (parsed.some((row) => !row.jobId || !Number.isFinite(row.amount) || row.amount <= 0)) {
      return NextResponse.json({ success: false, error: 'Each allocation needs a job and an amount.' }, { status: 400 });
    }
    const allocated = parsed.reduce((sum, row) => sum + row.amount, 0);
    if (Math.round(allocated * 100) > Math.round(amount * 100)) {
      return NextResponse.json({ success: false, error: 'Allocations cannot exceed the payment.' }, { status: 400 });
    }

    const payment = await prisma.manualPayment.create({
      data: {
        cleanerId,
        paidOn,
        amount,
        method,
        memo: memo || null,
        recordedBy: admin.userId,
        allocations: {
          create: parsed.map((row) => ({ jobId: row.jobId, amount: row.amount })),
        },
      },
    });
    return NextResponse.json({ success: true, id: payment.id });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not record the payment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
