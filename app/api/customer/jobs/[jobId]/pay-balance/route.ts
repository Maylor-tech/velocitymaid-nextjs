export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireCustomerJobOwnership } from '@/lib/auth/requireRole';
import { createBalanceCheckoutSession } from '@/lib/booking/stripeCheckout';
import { getBookingDepositDollars } from '@/lib/booking/paymentConfig';
import { assertStripeTestModeForDepositBooking } from '@/lib/stripe/stripeMode';

/**
 * POST /api/customer/jobs/[jobId]/pay-balance
 * Creates a Stripe Checkout session for the remaining job balance.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCustomerJobOwnership(request, params.jobId);
    assertStripeTestModeForDepositBooking();

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        Customer: { select: { email: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (job.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({
        success: true,
        paid: true,
        message: 'This job is fully paid.',
      });
    }

    if (job.paymentStatus !== PaymentStatus.BALANCE_DUE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Balance payment is not available for this job yet.',
          code: 'BALANCE_NOT_DUE',
        },
        { status: 400 }
      );
    }

    const balanceDue = job.balanceDue ? Number(job.balanceDue) : 0;
    if (balanceDue <= 0) {
      return NextResponse.json(
        { success: false, error: 'No balance due for this job' },
        { status: 400 }
      );
    }

    const email = job.Customer?.email || auth.email;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Customer email required for payment' },
        { status: 400 }
      );
    }

    const session = await createBalanceCheckoutSession({
      jobId: job.id,
      email,
      balanceDue,
      currency: job.currency || 'USD',
      quotedTotal: job.quotedTotal ? Number(job.quotedTotal) : Number(job.totalPrice || 0),
      depositAmount: job.depositAmount ? Number(job.depositAmount) : getBookingDepositDollars(),
      amountPaid: job.amountPaid ? Number(job.amountPaid) : 0,
      successPath: `/customer/jobs/${job.id}?balance=success`,
      cancelPath: `/customer/jobs/${job.id}?balance=cancelled`,
    });

    await prisma.job.update({
      where: { id: job.id },
      data: { balanceSessionId: session.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('[PAY BALANCE]', error);
    const message = error instanceof Error ? error.message : 'Failed to start balance payment';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
