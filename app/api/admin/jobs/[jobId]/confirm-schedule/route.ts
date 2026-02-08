export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { logAuditEntry } from '@/lib/audit';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { Resend } from 'resend';

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

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: auth.role,
      action: 'SCHEDULE_CONFIRMED',
      entityType: 'Job',
      entityId: job.id,
      description: 'Schedule confirmed by admin',
      changes: {
        confirmedBy: auth.userId,
        confirmedAt: new Date().toISOString(),
      },
    });

    const resend = getResend();
    if (customerEmail && resend) {
      const dateStr = job.preferredDate
        ? new Date(job.preferredDate).toDateString()
        : 'As scheduled';
      resend.emails
        .send({
          from: 'VelocityMaid <no-reply@velocitymaid.com>',
          to: customerEmail,
          subject: 'Your cleaning is confirmed ✅',
          html: `
        <p>Hi ${job.customerName || 'there'},</p>
        <p>Your cleaning is confirmed for:</p>
        <p>
          <strong>Date:</strong> ${dateStr}<br/>
          <strong>Time:</strong> ${job.preferredTime || 'As scheduled'}<br/>
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
      const dateStr = job.preferredDate
        ? new Date(job.preferredDate).toDateString()
        : 'As scheduled';
      const whatsappBody = `
✅ Your cleaning is confirmed!

🗓 ${dateStr}
⏰ ${job.preferredTime || 'As scheduled'}
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
