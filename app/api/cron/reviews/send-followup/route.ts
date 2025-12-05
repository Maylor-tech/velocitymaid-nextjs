export const dynamic = 'force-dynamic';

/**
 * Send Follow-Up Review Request (Cron Job)
 * GET /api/cron/reviews/send-followup
 * 
 * Sends follow-up review request 24 hours after job completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find jobs completed 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const jobs = await prisma.job.findMany({
      where: {
        status: 'completed',
        completedAt: {
          gte: twentyFourHoursAgo,
          lte: new Date(twentyFourHoursAgo.getTime() + 60 * 60 * 1000), // Within 1 hour window
        },
        branch: {
          slug: 'new-jersey', // Branch-aware: Only NJ
        },
      },
      include: {
        customer: true,
        branch: true,
      },
    });

    let sentCount = 0;

    for (const job of jobs) {
      if (!job.customer || !job.customer.phone) continue;

      // Check if review already requested (would need to track this)
      // For now, send to all completed jobs

      // Send follow-up review request
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
            messageType: 'followup',
            branchSlug: job.branch.slug,
          }),
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send follow-up for job ${job.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} follow-up review requests`,
      jobsProcessed: jobs.length,
    });
  } catch (error: any) {
    console.error('Send follow-up review requests error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send follow-up requests' },
      { status: 500 }
    );
  }
}

