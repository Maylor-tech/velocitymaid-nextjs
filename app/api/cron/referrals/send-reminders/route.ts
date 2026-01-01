export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Send Referral Reminder Messages (Cron Job)
 * GET /api/cron/referrals/send-reminders
 * 
 * Sends reminder messages 3 days after booking completion
 * Runs daily via cron job
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (in production, use proper auth)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find jobs completed 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const jobs = await prisma.job.findMany({
      where: {
        status: 'completed',
        completedAt: {
          gte: threeDaysAgo,
          lte: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000), // Within 24 hours of 3 days ago
        },
        appliedReferralCode: {
          not: null,
        },
      },
      include: {
        customer: true,
      },
    });

    let sentCount = 0;

    for (const job of jobs) {
      if (!job.customer || !job.appliedReferralCode) continue;

      // Check if reminder already sent
      const reminderSent = await prisma.referralEvent.findFirst({
        where: {
          jobId: job.id,
          status: 'COMPLETED',
        },
      });

      if (reminderSent) continue;

      // Send reminder WhatsApp
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/referrals/send-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: job.customer.id,
            messageType: 'reminder',
            jobId: job.id,
          }),
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder for job ${job.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} reminder messages`,
      jobsProcessed: jobs.length,
    });
  } catch (error: any) {
    console.error('Send referral reminders error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

