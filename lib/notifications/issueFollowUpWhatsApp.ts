/**
 * Issue follow-up WhatsApp — sent once per compliance issue when we have a customer to notify.
 * Uses audit log to prevent duplicates; skips silently if WhatsApp not configured.
 */

import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { logAuditEntry } from '@/lib/audit';

const ACTION = 'ISSUE_FOLLOW_UP_SENT';

/**
 * Send "We noticed an issue" to the customer if not already sent for this issue.
 * Call after compliance issue creation. Only sends when issue has a job with customer phone.
 * Fire-and-forget; never throws.
 */
export async function sendIssueFollowUpIfNeeded(issueId: string): Promise<void> {
  try {
    const existing = await prisma.auditLog.findFirst({
      where: {
        action: ACTION,
        entityType: 'ComplianceIssue',
        entityId: issueId,
      },
    });
    if (existing) return;

    const issue = await prisma.complianceIssue.findUnique({
      where: { id: issueId },
      select: {
        id: true,
        jobId: true,
        job: {
          select: {
            Customer: { select: { phone: true } },
          },
        },
      },
    });
    if (!issue?.jobId || !issue.job?.Customer?.phone?.trim()) return;

    const phone = issue.job.Customer.phone.trim();
    const message = [
      '⚠️ We noticed an issue with your service.',
      '',
      'Our team is reviewing it now and will follow up shortly.',
      'If you\'d like to add details, just reply here.',
      '',
      '— VelocityMaid',
    ].join('\n');

    sendWhatsAppMessage({ to: phone, message }).catch(() => {});

    await logAuditEntry({
      action: ACTION,
      entityType: 'ComplianceIssue',
      entityId: issue.id,
      description: 'Issue follow-up WhatsApp sent to customer',
      changes: { sentAt: new Date().toISOString() },
    });
  } catch (err) {
    console.error('[issueFollowUpWhatsApp]', err);
  }
}
