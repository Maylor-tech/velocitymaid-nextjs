/**
 * Admin Notification Utility
 *
 * JOB_CHANGE_REQUEST sends a real email (via Resend) to the admin inbox.
 * JOB_CANCELLED_BY_CUSTOMER is still console-only — Phase 9 TODO.
 */

import { sendAdminChangeRequestEmail } from './email/sendAdminChangeRequestEmail';

export type AdminEventType =
  | 'JOB_CHANGE_REQUEST'
  | 'JOB_CANCELLED_BY_CUSTOMER';

export interface AdminNotificationData {
  jobId: string;
  customerId: string;
  customerName?: string;
  jobDate?: string;
  [key: string]: any;
}

const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || 'hello@velocitymaid.com';

function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  return process.env.NODE_ENV === 'production'
    ? 'https://velocitymaid.com'
    : 'http://localhost:3000';
}

/**
 * Notify admin team of important events. Never throws — email failures are
 * logged, not propagated, so a notification issue can't fail the customer's
 * underlying request.
 */
export async function notifyAdmin(
  eventType: AdminEventType,
  data: AdminNotificationData
): Promise<void> {
  console.log('ADMIN NOTIFY:', eventType, data);

  if (eventType === 'JOB_CHANGE_REQUEST') {
    try {
      const changes = (data.requestedChanges || {}) as {
        notes?: string | null;
        newDate?: string | null;
        newStartTime?: string | null;
        newDuration?: number | null;
        newAddress?: string | null;
        originalAddress?: string | null;
      };

      const result = await sendAdminChangeRequestEmail({
        toEmail: ADMIN_NOTIFICATION_EMAIL,
        customerName: data.customerName || 'A customer',
        property: changes.originalAddress || 'Not on file',
        notes: changes.notes || null,
        jobId: data.jobId,
        requestedNewDate: changes.newDate,
        requestedNewTime: changes.newStartTime,
        requestedNewDuration: changes.newDuration,
        requestedNewAddress: changes.newAddress,
        jobLink: `${resolveBaseUrl()}/admin/jobs/${data.jobId}`,
      });

      if (!result.sent) {
        console.error('[notifyAdmin] Failed to send change-request email:', result.error);
      }
    } catch (err) {
      console.error('[notifyAdmin] Error sending change-request email:', err);
    }
    return;
  }

  // TODO: Phase 9 - JOB_CANCELLED_BY_CUSTOMER email/Slack notification
}

















