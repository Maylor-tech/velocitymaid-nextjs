export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import {
  creditJobDepositToInvoice,
  DepositCreditError,
} from '@/lib/invoices/creditJobDepositToInvoice';

/**
 * POST /api/admin/invoices/[id]/credit-deposit
 * Credits an already-captured job deposit PaymentIntent onto a DRAFT invoice.
 * Does not charge Stripe, send a receipt, or issue the invoice.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const body = (await request.json().catch(() => ({}))) as {
      paymentIntentId?: string;
      amount?: number;
      confirmJobId?: string;
    };

    if (!body.paymentIntentId || !body.confirmJobId || body.amount == null) {
      return NextResponse.json(
        {
          success: false,
          error: 'paymentIntentId, confirmJobId, and amount are required',
        },
        { status: 400 }
      );
    }

    const result = await creditJobDepositToInvoice({
      invoiceId: params.id,
      confirmJobId: body.confirmJobId,
      paymentIntentId: body.paymentIntentId,
      amount: Number(body.amount),
      actorId: auth.userId,
    });

    return NextResponse.json({
      success: true,
      credit: result,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    if (error instanceof DepositCreditError) {
      return NextResponse.json(
        { success: false, code: error.code, error: error.message },
        { status: error.status }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to credit deposit';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
