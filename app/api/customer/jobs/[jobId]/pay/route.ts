export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { requireCustomerJobOwnership } from '@/lib/auth/requireRole';

/**
 * POST /api/customer/jobs/[jobId]/pay
 * 
 * Get payment link for a job
 * 
 * Returns payment URL if available, or placeholder
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCustomerJobOwnership(request, params.jobId);
    const session = await getCustomerSession();
    if (!session) throw new Error("Session not found after auth");

    // Get job
    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job belongs to customer
    if (job.customerId !== session.customerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if job is completed
    if (job.status !== JobStatus.COMPLETED) {
      return NextResponse.json(
        { success: false, error: 'Can only pay for completed jobs' },
        { status: 400 }
      );
    }

    // TODO: Check for existing payment link or Stripe checkout URL
    // For now, return placeholder
    // If there's a paymentLink field on Job or a Payment model, query it here

    // Check if there's a sessionId that might be a Stripe session
    if (job.sessionId && job.sessionId.startsWith('cs_')) {
      // This might be a Stripe checkout session ID
      // In production, you'd verify and return the payment URL
      return NextResponse.json({
        success: true,
        placeholder: true,
        message: 'Payment integration coming soon',
      });
    }

    // Return placeholder
    return NextResponse.json({
      success: true,
      placeholder: true,
      message: 'Online payments are coming soon. Please pay by card or cash on site.',
    });
  } catch (error: any) {
    console.error('Get payment link error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get payment link',
      },
      { status: 500 }
    );
  }
}


