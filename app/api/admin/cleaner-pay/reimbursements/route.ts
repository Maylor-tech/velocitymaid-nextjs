import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import {
  markReimbursementRepaid,
  MANUAL_PAYMENT_METHODS,
  type ManualPaymentMethod,
} from '@/lib/cleanerComp/pay';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const id = String(body.id || '');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Choose a reimbursement.' }, { status: 400 });
    }
    const row = await prisma.reimbursementOwed.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ success: false, error: 'That reimbursement was not found.' }, { status: 404 });
    }
    if (row.status === 'REPAID') {
      return NextResponse.json({ success: false, error: 'This reimbursement is already repaid.' }, { status: 409 });
    }
    const method = String(body.repaidMethod || '') as ManualPaymentMethod;
    if (!MANUAL_PAYMENT_METHODS.includes(method)) {
      return NextResponse.json({ success: false, error: 'Mark repaid needs a method.' }, { status: 400 });
    }
    const repaid = markReimbursementRepaid(
      {
        status: row.status,
        repaidOn: row.repaidOn ? row.repaidOn.toISOString().slice(0, 10) : null,
        repaidMethod: row.repaidMethod,
        repaidMemo: row.repaidMemo,
        repaidBy: row.repaidBy,
      },
      {
        repaidOn: String(body.repaidOn || ''),
        repaidMethod: method,
        repaidMemo: body.repaidMemo ? String(body.repaidMemo) : null,
        repaidBy: admin.userId,
      }
    );
    await prisma.reimbursementOwed.update({
      where: { id },
      data: {
        status: 'REPAID',
        repaidOn: new Date(`${repaid.repaidOn}T00:00:00.000Z`),
        repaidMethod: repaid.repaidMethod,
        repaidMemo: repaid.repaidMemo,
        repaidBy: repaid.repaidBy,
      },
    });
    return NextResponse.json({ success: true, status: 'REPAID', repaidOn: repaid.repaidOn });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not mark this reimbursement repaid';
    const status = /already repaid/.test(message) ? 409 : /date|method|person/.test(message) ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
