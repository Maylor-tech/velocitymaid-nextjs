export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cleaner Response Timeout Check (Cron)
 * GET /api/cron/cleaner-response-check
 *
 * Flags jobs stuck at ASSIGNED (cleaner hasn't accepted → ON_THE_WAY, or
 * declined → REASSIGN_PENDING) past a configurable threshold. Creates one
 * CLEANER_NO_RESPONSE admin notification per assignment — duplicates
 * prevented via audit log, same pattern as the other reminder crons.
 *
 * Auth: Bearer CRON_SECRET
 * Config: CLEANER_RESPONSE_TIMEOUT_HOURS (default 2)
 * Manual test: GET /api/cron/cleaner-response-check with Authorization: Bearer <CRON_SECRET>
 *
 * Not yet added to vercel.json's scheduled crons — add it there when ready
 * to run automatically; callable manually until then.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { createAdminNotification, adminNotificationHelpers } from '@/lib/notifications/adminNotificationCenter';

const ACTION = 'CLEANER_RESPONSE_TIMEOUT_NOTIFIED';

function getTimeoutHours(): number {
  const raw = process.env.CLEANER_RESPONSE_TIMEOUT_HOURS;
  if (raw == null || raw === '') return 2;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 2;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timeoutHours = getTimeoutHours();
    const cutoff = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

    const staleAssignments = await prisma.job.findMany({
      where: {
        status: 'ASSIGNED',
        assignedAt: { lt: cutoff, not: null },
      },
      select: {
        id: true,
        jobReference: true,
        assignedAt: true,
        User: { select: { name: true } },
      },
    });

    let notified = 0;
    for (const job of staleAssignments) {
      const entityId = `${job.id}_${job.assignedAt!.toISOString()}`;
      const existing = await prisma.auditLog.findFirst({
        where: { action: ACTION, entityType: 'Job', entityId },
      });
      if (existing) continue;

      await createAdminNotification({
        type: 'CLEANER_NO_RESPONSE',
        severity: 'WARNING',
        message: `${job.User?.name || 'Assigned cleaner'} hasn't responded to ${job.jobReference || job.id} in over ${timeoutHours}h`,
        jobId: job.id,
        actionUrl: adminNotificationHelpers.adminJobLink(job.id),
      });

      await logAuditEntry({
        action: ACTION,
        entityType: 'Job',
        entityId,
        description: `Cleaner response timeout notification created (${timeoutHours}h threshold)`,
      });

      notified++;
    }

    return NextResponse.json({
      success: true,
      checked: staleAssignments.length,
      notified,
      timeoutHours,
    });
  } catch (error: unknown) {
    console.error('[cron/cleaner-response-check] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to check cleaner responses';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
