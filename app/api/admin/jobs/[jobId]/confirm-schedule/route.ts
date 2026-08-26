export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { logAuditEntry } from '@/lib/audit';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { Resend } from 'resend';
import { getResendFromEmail } from '@/lib/email/resendClient';
import { formatConfirmedSchedule } from '@/lib/dates/serviceDate';
import { JobStatus } from '@prisma/client';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * POST /api/admin/jobs/[jobId]/confirm-schedule
 * Confirms the job schedule: audit log + optional confirmation email.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        customerName: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        branchId: true,
        Customer: {
          select: { email: true, phone: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const customerEmail = job.Customer?.email ?? null;
    const schedule = formatConfirmedSchedule(job.preferredDate, job.preferredTime);

    if (job.status === JobStatus.RECEIVED) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.CONFIRMED },
      });
    }

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: auth.role,
      action: 'SCHEDULE_CONFIRMED',
      entityType: 'Job',
      entityId: job.id,
      description: `Schedule confirmed: ${schedule.combined}`,
      changes: {
        confirmedBy: auth.userId,
        confirmedAt: new Date().toISOString(),
        confirmedDate: schedule.dateLabel,
        confirmedTime: schedule.timeLabel,
      },
    });

    const resend = getResend();
    if (customerEmail && resend) {
      resend.emails
        .send({
          from: getResendFromEmail(),
          to: customerEmail,
          subject: 'Your cleaning is confirmed ✅',
          html: `
        <p>Hi ${job.customerName || 'there'},</p>
        <p>Your cleaning is confirmed for:</p>
        <p>
          <strong>Date:</strong> ${schedule.dateLabel}<br/>
          <strong>Time:</strong> ${schedule.timeLabel}<br/>
          <strong>Location:</strong> ${job.address || ''}
        </p>
        <p>We're looking forward to serving you.</p>
        <p>— VelocityMaid</p>
      `,
        })
        .catch(() => {
          // Intentionally silent; audit already recorded
        });
    }

    const customerPhone = job.Customer?.phone ?? null;
    if (customerPhone) {
      const whatsappBody = `
✅ Your cleaning is confirmed!

🗓 ${schedule.dateLabel}
⏰ ${schedule.timeLabel}
📍 ${job.address || ''}

We're looking forward to serving you.
— VelocityMaid
`.trim();
      sendWhatsAppMessage({
        to: customerPhone,
        message: whatsappBody,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Confirm schedule error:', err);
    return NextResponse.json(
      { error: 'Failed to confirm schedule' },
      { status: 500 }
    );
  }
}
