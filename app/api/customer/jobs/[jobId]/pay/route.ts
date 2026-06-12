export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import { requireCustomerJobOwnership } from '@/lib/auth/requireRole';
import stripe from '@/utils/stripe';
import { createBalanceCheckoutSession } from '@/lib/booking/stripeCheckout';
import { getBookingDepositDollars } from '@/lib/booking/paymentConfig';
import { assertStripeTestModeForDepositBooking } from '@/lib/stripe/stripeMode';

/**
 * POST /api/customer/jobs/[jobId]/pay
 *
 * Jobs are paid at booking via Stripe Checkout. This endpoint confirms payment
 * status or returns billing guidance — no placeholder "coming soon" responses.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCustomerJobOwnership(request, params.jobId);

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        status: true,
        sessionId: true,
        balanceSessionId: true,
        paymentMethod: true,
        paymentStatus: true,
        totalPrice: true,
        quotedTotal: true,
        depositAmount: true,
        amountPaid: true,
        balanceDue: true,
        currency: true,
        Customer: { select: { email: true } },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.paymentStatus === PaymentStatus.PAID) {
      return NextResponse.json({
        success: true,
        paid: true,
        message: 'This job is fully paid.',
      });
    }

    if (job.paymentStatus === PaymentStatus.BALANCE_DUE) {
      assertStripeTestModeForDepositBooking();
      const balanceDue = job.balanceDue ? Number(job.balanceDue) : 0;
      const email = job.Customer?.email || auth.email;
      if (balanceDue > 0 && email) {
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
        if (session.url) {
          return NextResponse.json({
            success: true,
            url: session.url,
            message: 'Complete payment for the remaining balance.',
          });
        }
      }
    }

    if (job.sessionId?.startsWith('cs_')) {
      try {
        const session = await stripe.checkout.sessions.retrieve(job.sessionId);
        if (session.payment_status === 'paid') {
          return NextResponse.json({
            success: true,
            paid: true,
            message: 'This job was paid at booking.',
          });
        }
        if (session.url && session.payment_status === 'unpaid') {
          return NextResponse.json({
            success: true,
            url: session.url,
            message: 'Complete payment for this booking.',
          });
        }
      } catch (stripeErr) {
        console.error('[JOB_PAY] Stripe session lookup failed:', stripeErr);
      }
    }

    if (job.paymentMethod && job.paymentMethod !== 'UNPAID') {
      return NextResponse.json({
        success: true,
        paid: true,
        message: 'Payment is recorded for this job.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        code: 'JOB_PAY_NOT_AVAILABLE',
        error:
          'Online payment for this job is not available. Bookings are paid at checkout; for billing questions use your account billing page.',
        billingUrl: '/customer/billing',
      },
      { status: 503 }
    );
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Get payment link error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to get payment status';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
