export const dynamic = 'force-dynamic';

/**
 * Job Completion Webhook
 * POST /api/webhooks/jobs/completed
 * 
 * Called when a job is marked as completed
 * Triggers initial review request
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
        branch: true,
      },
    });

    if (!job || !job.customer) {
      return NextResponse.json(
        { success: false, error: 'Job or customer not found' },
        { status: 404 }
      );
    }

    // Branch-aware: Only send for New Jersey
    if (job.branch.slug !== 'new-jersey') {
      return NextResponse.json({
        success: true,
        message: 'Review requests only sent for New Jersey branch',
      });
    }

    // Send initial review request
    try {
      const channel = job.customer.whatsappOptIn ? 'whatsapp' : 'sms';
      const endpoint = channel === 'whatsapp'
        ? '/api/automations/reviews/send-whatsapp'
        : '/api/automations/reviews/send-sms';

      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: job.customer.id,
          jobId: job.id,
          messageType: 'initial',
          branchSlug: job.branch.slug,
        }),
      });
    } catch (error) {
      console.error('Failed to send initial review request:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Review request triggered',
    });
  } catch (error: any) {
    console.error('Job completion webhook error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process job completion' },
      { status: 500 }
    );
  }
}

