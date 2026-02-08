export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { logAuditEntry } from '@/lib/audit';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';

/**
 * PATCH /api/admin/jobs/[jobId]/reschedule
 * Admin reschedule: update preferredDate and/or preferredTime, then notify customer (WhatsApp if configured).
 * Body: { preferredDate?: string (ISO), preferredTime?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const jobId = params.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { preferredDate: preferredDateRaw, preferredTime: preferredTimeRaw } = body;

    const oldJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: { Customer: { select: { phone: true } } },
    });

    if (!oldJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (auth.branchId && oldJob.branchId !== auth.branchId) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const newPreferredDate = preferredDateRaw ? new Date(preferredDateRaw) : oldJob.preferredDate;
    const newPreferredTime =
      preferredTimeRaw !== undefined && preferredTimeRaw !== null
        ? String(preferredTimeRaw)
        : oldJob.preferredTime ?? '';

    const dateChanged =
      (oldJob.preferredDate?.getTime() ?? 0) !== (newPreferredDate?.getTime() ?? 0);
    const timeChanged = (oldJob.preferredTime ?? '') !== newPreferredTime;
    const shouldNotify = dateChanged || timeChanged;

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(newPreferredDate && { preferredDate: newPreferredDate }),
        ...(preferredTimeRaw !== undefined && { preferredTime: newPreferredTime || null }),
      },
    });

    if (shouldNotify && oldJob.Customer?.phone) {
      const dateStr = updatedJob.preferredDate
        ? new Date(updatedJob.preferredDate).toDateString()
        : 'As scheduled';
      const message = `
🔄 Schedule Update from VelocityMaid

Your cleaning has been rescheduled:

🗓 New Date: ${dateStr}
⏰ New Time: ${updatedJob.preferredTime || 'As scheduled'}

If you have questions, just reply here.
— VelocityMaid
`.trim();
      sendWhatsAppMessage({
        to: oldJob.Customer.phone,
        message,
      }).catch(() => {});
    }

    await logAuditEntry({
      actorId: auth.userId,
      actorRole: auth.role,
      action: 'JOB_RESCHEDULE',
      entityType: 'Job',
      entityId: jobId,
      description: 'Admin rescheduled job',
      changes: {
        oldDate: oldJob.preferredDate?.toISOString(),
        newDate: updatedJob.preferredDate?.toISOString() ?? null,
        oldTime: oldJob.preferredTime,
        newTime: updatedJob.preferredTime ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      job: {
        preferredDate: updatedJob.preferredDate?.toISOString() ?? null,
        preferredTime: updatedJob.preferredTime,
      },
    });
  } catch (err) {
    console.error('Admin reschedule error:', err);
    return NextResponse.json(
      { error: 'Failed to reschedule job' },
      { status: 500 }
    );
  }
}
