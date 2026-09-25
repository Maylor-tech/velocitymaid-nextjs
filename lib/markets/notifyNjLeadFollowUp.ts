/**
 * Notify Elaine (NJ ops follow-up) of a new residential lead.
 * Company retains Lead/Customer records, quoting, and payment ownership.
 * Failures are logged — never fail the lead HTTP response.
 */
import { getGuardedResend, getResendFromEmail } from '@/lib/email/resendClient';
import { resolveSafeEmailRecipient } from '@/lib/notifications/outboundSafety';
import { createAdminNotification } from '@/lib/notifications/adminNotificationCenter';
import { NJ_OPS_ASSIGNEE } from '@/lib/markets/newJersey';

export type NjLeadFollowUpPayload = {
  leadId: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  zip: string | null;
  addressLine: string | null;
  serviceType: string | null;
  frequency: string | null;
  preferredDate: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  homeType: string | null;
  referralSource: string | null;
  source: string | null;
  followUpStatus: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function opsFollowUpEmail(): string | null {
  return (
    process.env.NJ_OPS_FOLLOWUP_EMAIL ||
    process.env.ELAINE_OPS_EMAIL ||
    process.env.CONTACT_NOTIFICATIONS_EMAIL ||
    null
  );
}

function companyCopyEmail(): string | null {
  return (
    process.env.NJ_LEADS_COMPANY_EMAIL ||
    process.env.CONTACT_NOTIFICATIONS_EMAIL ||
    'hello@velocitymaid.com'
  );
}

export async function notifyNjLeadFollowUp(
  lead: NjLeadFollowUpPayload
): Promise<{ sentToOps: boolean; sentToCompany: boolean }> {
  const result = { sentToOps: false, sentToCompany: false };
  const resend = getGuardedResend();
  if (!resend) return result;

  const rows: Array<[string, string]> = [
    ['Lead ID', lead.leadId],
    ['Name', lead.name],
    ['Phone', lead.phone],
    ['Email', lead.email || '—'],
    ['City', lead.city || '—'],
    ['ZIP', lead.zip || '—'],
    ['Address', lead.addressLine || '—'],
    ['Service', lead.serviceType || '—'],
    ['Frequency', lead.frequency || '—'],
    ['Preferred date', lead.preferredDate || '—'],
    ['Bedrooms', lead.bedrooms != null ? String(lead.bedrooms) : '—'],
    ['Bathrooms', lead.bathrooms != null ? String(lead.bathrooms) : '—'],
    ['Home type', lead.homeType || '—'],
    ['Source', lead.source || lead.referralSource || '—'],
    ['Referral', lead.referralSource || '—'],
    ['Follow-up status', lead.followUpStatus],
    ['Ops assignee', NJ_OPS_ASSIGNEE],
  ];

  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#64748b;font-size:13px;">${escapeHtml(k)}</td><td style="padding:4px 0;font-size:14px;font-weight:600;">${escapeHtml(v)}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#0f172a;">
      <h2 style="margin:0 0 8px;">New Jersey lead — follow-up needed</h2>
      <p style="margin:0 0 16px;color:#64748b;font-size:14px;">
        Operational follow-up for Elaine. Quoting, payment, and customer records stay with VelocityMaid.
      </p>
      <table style="border-collapse:collapse;width:100%;">${rowsHtml}</table>
    </div>
  `;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const subject = `NJ lead: ${lead.name} — ${lead.serviceType || 'cleaning'} (${lead.city || lead.zip || 'NJ'})`;

  async function sendTo(intended: string | null, label: 'ops' | 'company') {
    if (!intended) return;
    const safety = resolveSafeEmailRecipient(intended);
    if (!safety.allowed || !safety.to) return;
    try {
      const { error } = await resend!.emails.send({
        from: getResendFromEmail(),
        to: safety.to,
        subject,
        html,
        text,
      });
      if (!error) {
        if (label === 'ops') result.sentToOps = true;
        else result.sentToCompany = true;
      }
    } catch (err) {
      console.error(`[notifyNjLeadFollowUp] ${label} email failed`, err);
    }
  }

  const opsEmail = opsFollowUpEmail();
  const companyEmail = companyCopyEmail();
  await sendTo(opsEmail, 'ops');
  if (companyEmail && companyEmail.toLowerCase() !== (opsEmail || '').toLowerCase()) {
    await sendTo(companyEmail, 'company');
  }

  try {
    await createAdminNotification({
      type: 'NJ_LEAD',
      severity: 'INFO',
      message: `NJ lead ${lead.name} — follow-up assigned to Elaine (${lead.serviceType || 'cleaning'}, ${lead.city || lead.zip || 'NJ'})`,
      actionUrl: '/admin/lead-center',
    });
  } catch (err) {
    console.error('[notifyNjLeadFollowUp] admin notification failed', err);
  }

  return result;
}
