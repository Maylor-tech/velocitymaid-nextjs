import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { formatInvoiceDate } from '@/lib/invoices/invoiceUtils';

const NAVY = '#0F1C2E';
const CYAN = '#00C2CB';
const MUTED = '#6B7280';
const ORANGE = '#E65100';
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

const HOUSE_ICON_HEADER = `<svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <path fill-rule="evenodd" d="M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z" fill="#00C2CB"/>
  <path d="M74,14 L75.56,18.44 L80,20 L75.56,21.56 L74,26 L72.44,21.56 L68,20 L72.44,18.44 Z" fill="#FFFFFF"/>
</svg>`;

const HOUSE_ICON_SIG = `<svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <path fill-rule="evenodd" d="M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z" fill="#0F1C2E"/>
  <path d="M74,14 L75.56,18.44 L80,20 L75.56,21.56 L74,26 L72.44,21.56 L68,20 L72.44,18.44 Z" fill="#00C2CB"/>
</svg>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseAddressLines(propertyAddress: string): { street: string; cityLine: string } {
  const parts = propertyAddress.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { street: propertyAddress, cityLine: '' };
  }
  return { street: parts[0], cityLine: parts.slice(1).join(', ') };
}

function parseLineItem(description: string): { title: string; details: string[] } {
  const lines = description.split('\n').map((l) => l.trim()).filter(Boolean);
  return {
    title: lines[0] || description,
    details: lines.slice(1),
  };
}

export function parseInvoiceNotes(notes: string | null | undefined): {
  closingNote: string;
  upcomingLines: string[];
} {
  if (!notes?.trim()) {
    return { closingNote: '', upcomingLines: [] };
  }

  const marker = '---UPCOMING---';
  const idx = notes.indexOf(marker);
  if (idx === -1) {
    return { closingNote: notes.trim(), upcomingLines: [] };
  }

  return {
    closingNote: notes.slice(0, idx).trim(),
    upcomingLines: notes
      .slice(idx + marker.length)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
  };
}

function shortClientName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function dueDateLabel(invoice: SerializedInvoice): string {
  if (invoice.status === 'PAID') return 'Paid';
  if (!invoice.dueDate) return 'Due Now';
  const due = new Date(invoice.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  if (due <= today) return 'Due Now';
  return formatInvoiceDate(invoice.dueDate);
}

function statusBadge(invoice: SerializedInvoice): { label: string; color: string; bg: string } {
  if (invoice.status === 'PAID') {
    return { label: 'PAID', color: '#2E7D32', bg: '#E8F5E9' };
  }
  if (invoice.status === 'OVERDUE') {
    return { label: 'OVERDUE', color: ORANGE, bg: '#FFF3E0' };
  }
  if (invoice.status === 'PARTIALLY_PAID') {
    return { label: 'PARTIAL', color: ORANGE, bg: '#FFF3E0' };
  }
  return { label: 'UNPAID', color: ORANGE, bg: '#FFF3E0' };
}

function paypalConfig() {
  const email = process.env.PAYPAL_EMAIL || 'hello@velocitymaid.com';
  const meUrl =
    process.env.PAYPAL_ME_URL ||
    process.env.NEXT_PUBLIC_PAYPAL_ME_URL ||
    'https://paypal.me/velocitymaid';
  return { email, meUrl };
}

function lineItemsHtml(invoice: SerializedInvoice): string {
  return invoice.items
    .map((item) => {
      const { title, details } = parseLineItem(item.description);
      const detailsHtml = details
        .map(
          (d, detailIdx) =>
            `<div style="font-family:${FONT};font-size:12px;color:${MUTED};margin-top:${detailIdx === 0 ? '3' : '2'}px;">${escapeHtml(d)}</div>`
        )
        .join('');

      return `<tr>
          <td style="padding:12px 0;border-top:1px solid #F1F5F9;">
            <div style="font-family:${FONT};font-size:14px;font-weight:bold;color:${NAVY};">${escapeHtml(title)}</div>
            ${detailsHtml}
          </td>
          <td align="right" valign="top" style="padding:12px 0;border-top:1px solid #F1F5F9;">
            <div style="font-family:${FONT};font-size:14px;color:${NAVY};">${escapeHtml(item.lineTotalFormatted)}</div>
          </td>
        </tr>`;
    })
    .join('');
}

function upcomingHtml(lines: string[]): string {
  if (lines.length === 0) return '';

  const rows = lines
    .map(
      (line) =>
        `<tr><td style="font-family:${FONT};font-size:13px;color:#374151;padding-bottom:6px;">
          <span style="color:${CYAN};font-weight:bold;">&#9679;</span>&nbsp;&nbsp;${escapeHtml(line)}
        </td></tr>`
    )
    .join('');

  return `<tr>
    <td style="padding:20px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F4F6F9;border-radius:8px;">
        <tr><td style="padding:16px 20px;">
          <div style="font-family:${FONT};font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${MUTED};margin-bottom:10px;">Upcoming Services</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>
        </td></tr>
      </table>
    </td>
  </tr>`;
}

export type InvoiceEmailVariant = 'sent' | 'reminder' | 'receipt';

export function buildInvoiceBrandedEmailHtml(
  invoice: SerializedInvoice,
  options: {
    variant?: InvoiceEmailVariant;
    viewUrl?: string;
    paymentAmount?: number;
  } = {}
): string {
  const variant = options.variant ?? 'sent';
  const { street, cityLine } = parseAddressLines(invoice.propertyAddress);
  const { closingNote, upcomingLines } = parseInvoiceNotes(invoice.notes);
  const badge = statusBadge(invoice);
  const dueLabel = dueDateLabel(invoice);
  const dueColor = dueLabel === 'Due Now' || invoice.status === 'OVERDUE' ? ORANGE : NAVY;
  const invoiceDate = formatInvoiceDate(invoice.jobDate || invoice.createdAt);
  const { email: paypalEmail, meUrl: paypalMeUrl } = paypalConfig();
  const reference = `${invoice.invoiceNumber} — ${shortClientName(invoice.clientName)}`;

  const streetDisplay = street || invoice.propertyAddress;
  const defaultClosingText = `Thank you for trusting VelocityMaid with ${streetDisplay}. Questions? Reply to this email or call (802) 733-5348.`;

  let introBlock = '';
  if (variant === 'reminder') {
    introBlock = `<tr><td style="padding:0 32px 16px;">
      <p style="font-family:${FONT};font-size:15px;color:${NAVY};line-height:1.6;margin:0;">
        Hi ${escapeHtml(invoice.clientName.split(/\s+/)[0] || invoice.clientName)}, this is a friendly reminder that invoice
        <strong>${escapeHtml(invoice.invoiceNumber)}</strong> has an outstanding balance of
        <strong>${escapeHtml(invoice.balanceDueFormatted)}</strong>.
      </p>
    </td></tr>`;
  } else if (variant === 'receipt') {
    introBlock = `<tr><td style="padding:0 32px 16px;">
      <p style="font-family:${FONT};font-size:15px;color:${NAVY};line-height:1.6;margin:0;">
        Hi ${escapeHtml(invoice.clientName.split(/\s+/)[0] || invoice.clientName)}, we received
        <strong>${escapeHtml(options.paymentAmount != null ? `$${options.paymentAmount.toFixed(2)}` : invoice.amountPaidFormatted)}</strong>
        toward invoice <strong>${escapeHtml(invoice.invoiceNumber)}</strong>.
        Remaining balance: <strong>${escapeHtml(invoice.balanceDueFormatted)}</strong>.
      </p>
    </td></tr>`;
  }

  const showPaymentBlock = invoice.balanceDue > 0 && variant !== 'receipt';

  const previewText = `Invoice ${invoice.invoiceNumber} — ${invoice.balanceDueFormatted} due for ${invoice.serviceType} at ${street || invoice.propertyAddress}.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>VelocityMaid — Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F6F9;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#F4F6F9;opacity:0;">${escapeHtml(previewText)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F4F6F9;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;">

  <tr>
    <td style="background-color:${NAVY};padding:24px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle" style="padding-right:14px;">${HOUSE_ICON_HEADER}</td>
          <td valign="middle">
            <div style="font-family:${FONT};font-size:20px;font-weight:bold;letter-spacing:1px;color:#FFFFFF;line-height:1;">VELOCITYMAID</div>
            <div style="font-family:${FONT};font-size:9px;font-weight:bold;letter-spacing:2.5px;color:${CYAN};line-height:1;padding-top:5px;">COME HOME TO CLEAN.</div>
          </td>
          <td valign="middle" align="right" style="padding-left:40px;">
            <div style="font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Invoice</div>
            <div style="font-family:${FONT};font-size:18px;font-weight:bold;color:${CYAN};margin-top:2px;">${escapeHtml(invoice.invoiceNumber)}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background-color:#FFFFFF;padding:28px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="top" width="50%">
            <div style="font-family:${FONT};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${MUTED};margin-bottom:8px;">Billed To</div>
            <div style="font-family:${FONT};font-size:15px;font-weight:bold;color:${NAVY};">${escapeHtml(invoice.clientName)}</div>
            <div style="font-family:${FONT};font-size:13px;color:${MUTED};margin-top:2px;">${escapeHtml(street)}</div>
            ${cityLine ? `<div style="font-family:${FONT};font-size:13px;color:${MUTED};">${escapeHtml(cityLine)}</div>` : ''}
            ${invoice.clientEmail ? `<div style="font-family:${FONT};font-size:13px;color:${MUTED};margin-top:2px;">${escapeHtml(invoice.clientEmail)}</div>` : ''}
          </td>
          <td valign="top" width="50%" align="right">
            <div style="font-family:${FONT};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${MUTED};margin-bottom:8px;">Invoice Details</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right">
              <tr>
                <td style="font-family:${FONT};font-size:12px;color:${MUTED};padding-right:12px;padding-bottom:4px;">Invoice #</td>
                <td style="font-family:${FONT};font-size:12px;font-weight:bold;color:${NAVY};padding-bottom:4px;">${escapeHtml(invoice.invoiceNumber)}</td>
              </tr>
              <tr>
                <td style="font-family:${FONT};font-size:12px;color:${MUTED};padding-right:12px;padding-bottom:4px;">Date</td>
                <td style="font-family:${FONT};font-size:12px;font-weight:bold;color:${NAVY};padding-bottom:4px;">${escapeHtml(invoiceDate)}</td>
              </tr>
              <tr>
                <td style="font-family:${FONT};font-size:12px;color:${MUTED};padding-right:12px;padding-bottom:4px;">Due Date</td>
                <td style="font-family:${FONT};font-size:12px;font-weight:bold;color:${dueColor};padding-bottom:4px;">${escapeHtml(dueLabel)}</td>
              </tr>
              <tr>
                <td style="font-family:${FONT};font-size:12px;color:${MUTED};padding-right:12px;">Status</td>
                <td>
                  <span style="font-family:${FONT};font-size:11px;font-weight:bold;color:${badge.color};background-color:${badge.bg};padding:3px 8px;border-radius:4px;">${badge.label}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${introBlock}

  <tr><td style="padding:20px 32px 0;"><div style="height:1px;background-color:#E2E8F0;font-size:0;line-height:0;">&nbsp;</div></td></tr>

  <tr>
    <td style="padding:20px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="font-family:${FONT};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${MUTED};padding-bottom:12px;">Service</td>
          <td align="right" style="font-family:${FONT};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${MUTED};padding-bottom:12px;">Amount</td>
        </tr>
        ${lineItemsHtml(invoice)}
        <tr>
          <td colspan="2" style="padding-top:4px;border-top:2px solid ${NAVY};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-family:${FONT};font-size:16px;font-weight:bold;color:${NAVY};padding-top:14px;">Total Due</td>
                <td align="right" style="font-family:${FONT};font-size:22px;font-weight:bold;color:${CYAN};padding-top:14px;">${escapeHtml(invoice.balanceDueFormatted)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${showPaymentBlock ? `<tr>
    <td style="padding:24px 32px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${NAVY};border-radius:8px;">
        <tr>
          <td style="padding:20px 24px;">
            <div style="font-family:${FONT};font-size:13px;font-weight:bold;color:#FFFFFF;margin-bottom:6px;">Payment Instructions</div>
            <div style="font-family:${FONT};font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;">
              Send payment via <strong style="color:${CYAN};">PayPal</strong> to ${escapeHtml(paypalEmail)}<br/>
              Reference: <strong style="color:#FFFFFF;">${escapeHtml(reference)}</strong>
            </div>
          </td>
          <td align="right" valign="middle" style="padding:20px 24px;">
            <a href="${escapeHtml(paypalMeUrl)}" style="display:inline-block;font-family:${FONT};font-size:13px;font-weight:bold;color:${NAVY};background-color:${CYAN};text-decoration:none;padding:12px 24px;border-radius:6px;white-space:nowrap;">Pay via PayPal</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''}

  ${upcomingHtml(upcomingLines)}

  <tr>
    <td style="padding:20px 32px 24px;">
      <p style="font-family:${FONT};font-size:13px;color:${MUTED};line-height:1.65;margin:0;">${escapeHtml(closingNote || defaultClosingText)}</p>
      ${options.viewUrl ? `<p style="font-family:${FONT};font-size:13px;margin:16px 0 0;"><a href="${escapeHtml(options.viewUrl)}" style="color:${CYAN};font-weight:bold;">View invoice online</a></p>` : ''}
    </td>
  </tr>

  <tr>
    <td style="background-color:#FFFFFF;padding:0 32px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="top" style="border-left:4px solid ${CYAN};padding-left:16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:12px;">${HOUSE_ICON_SIG}</td>
                <td valign="middle">
                  <div style="font-family:${FONT};font-size:14px;font-weight:bold;color:${NAVY};">Brian Bruce Maylor</div>
                  <div style="font-family:${FONT};font-size:12px;color:${MUTED};padding-top:2px;">Founder &amp; Managing Director &middot; VelocityMaid</div>
                </td>
              </tr>
            </table>
            <div style="font-family:${FONT};font-size:12px;color:#374151;line-height:1.9;padding-top:10px;">
              <a href="tel:+18027335348" style="color:#374151;text-decoration:none;"><span style="color:#00A8B0;font-weight:bold;">P</span>&nbsp;&nbsp;(802) 733-5348</a><br/>
              <a href="mailto:hello@velocitymaid.com" style="color:#374151;text-decoration:none;"><span style="color:#00A8B0;font-weight:bold;">E</span>&nbsp;&nbsp;hello@velocitymaid.com</a><br/>
              <a href="https://velocitymaid.com" style="color:#374151;text-decoration:none;"><span style="color:#00A8B0;font-weight:bold;">W</span>&nbsp;&nbsp;velocitymaid.com</a>
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td align="center" style="background-color:${NAVY};padding:18px 32px;">
      <div style="font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:2px;color:${CYAN};">COME HOME TO CLEAN.</div>
      <div style="font-family:${FONT};font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">VelocityMaid &middot; Premium Cleaning &amp; Property Readiness &middot; Vermont &amp; New Jersey</div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildInvoiceBrandedEmailText(
  invoice: SerializedInvoice,
  options: { variant?: InvoiceEmailVariant; viewUrl?: string; paymentAmount?: number } = {}
): string {
  const variant = options.variant ?? 'sent';
  const { closingNote, upcomingLines } = parseInvoiceNotes(invoice.notes);
  const { email: paypalEmail, meUrl: paypalMeUrl } = paypalConfig();
  const reference = `${invoice.invoiceNumber} — ${shortClientName(invoice.clientName)}`;

  const lines = [
    `VelocityMaid Invoice ${invoice.invoiceNumber}`,
    '',
    `Client: ${invoice.clientName}`,
    `Property: ${invoice.propertyAddress}`,
    `Total due: ${invoice.balanceDueFormatted}`,
    '',
    ...invoice.items.map((i) => `- ${i.description.replace(/\n/g, ' · ')}: ${i.lineTotalFormatted}`),
  ];

  if (variant === 'reminder') {
    lines.push('', `Reminder: ${invoice.balanceDueFormatted} outstanding.`);
  }

  if (invoice.balanceDue > 0 && variant !== 'receipt') {
    lines.push('', `Pay via PayPal: ${paypalMeUrl}`, `PayPal email: ${paypalEmail}`, `Reference: ${reference}`);
  }

  if (upcomingLines.length) {
    lines.push('', 'Upcoming services:', ...upcomingLines.map((l) => `- ${l}`));
  }

  if (closingNote) lines.push('', closingNote);
  if (options.viewUrl) lines.push('', `View online: ${options.viewUrl}`);

  lines.push('', 'Brian Bruce Maylor', 'VelocityMaid', '(802) 733-5348', 'hello@velocitymaid.com');
  return lines.join('\n');
}
