export type QuoteEmailLineItem = {
  label: string;
  amount: string;
};

export type QuoteEmailSender = {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
};

export type QuoteEmailData = {
  clientFirstName: string;
  clientFullName: string;
  propertyAddress: string;
  serviceDate: string;
  startTime: string;
  access?: string;
  quoteNumber: string;
  validUntil: string;
  serviceTitle: string;
  lineItems: QuoteEmailLineItem[];
  totalDue: string;
  inclusions: string[];
  paymentNote: string;
  confirmSubject: string;
  sender: QuoteEmailSender;
};

const NAVY = "#0F1C2E";
const CYAN = "#00C2CB";
const CYAN_DARK = "#00A8B0";
const SURFACE = "#F4F6F9";
const MUTED = "#6B7280";
const TEXT = "#1A1A2E";
const BODY = "#374151";
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
}

function buildServiceMeta(data: QuoteEmailData): string {
  const parts = [data.serviceDate, data.startTime];
  if (data.access?.trim()) {
    parts.push(data.access.trim());
  }
  return parts.map(escapeHtml).join(" &middot; ");
}

function buildLineItemsHtml(lineItems: QuoteEmailLineItem[]): string {
  if (lineItems.length === 0) {
    return "";
  }

  const rows = lineItems
    .map(
      (item) => `
                    <tr>
                      <td style="font-family:${FONT};font-size:14px;color:${TEXT};padding:0 0 14px;">${escapeHtml(item.label)}</td>
                      <td align="right" style="font-family:${FONT};font-size:14px;color:${NAVY};padding:0 0 14px;">${escapeHtml(item.amount)}</td>
                    </tr>`
    )
    .join("");

  return `${rows}
                    <tr><td colspan="2" style="border-top:1px solid #E2E8F0;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function buildInclusionsHtml(inclusions: string[]): string {
  return inclusions
    .map((item, index) => {
      const padding = index === inclusions.length - 1 ? "padding:0;" : "padding:0 0 9px;";
      return `<tr><td style="font-family:${FONT};font-size:13px;color:${BODY};line-height:1.5;${padding}"><span style="color:${CYAN};font-weight:bold;">&#9679;</span>&nbsp;&nbsp;${escapeHtml(item)}</td></tr>`;
    })
    .join("");
}

const HEADER_LOGO_SVG = `<svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                    <path fill-rule="evenodd" d="M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z" fill="${CYAN}"/>
                    <path d="M74,14 L75.56,18.44 L80,20 L75.56,21.56 L74,26 L72.44,21.56 L68,20 L72.44,18.44 Z" fill="#FFFFFF"/>
                  </svg>`;

const SIGNATURE_LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                          <path fill-rule="evenodd" d="M8,42 L50,10 L92,42 L92,92 L8,92 Z M39,64 L61,64 L61,92 L39,92 Z" fill="${NAVY}"/>
                          <path d="M74,14 L75.56,18.44 L80,20 L75.56,21.56 L74,26 L72.44,21.56 L68,20 L72.44,18.44 Z" fill="${CYAN}"/>
                        </svg>`;

export function renderQuoteEmail(data: QuoteEmailData): string {
  const preheader = escapeHtml(
    `Your confirmed quote for ${data.propertyAddress} — ${data.serviceTitle}, ${data.serviceDate} at ${data.startTime}.`
  );
  const quoteTitle = escapeHtml(`VelocityMaid — Quote ${data.quoteNumber}`);
  const firstName = escapeHtml(data.clientFirstName);
  const propertyAddress = escapeHtml(data.propertyAddress);
  const serviceDateHero = escapeHtml(data.serviceDate);
  const quoteNumber = escapeHtml(data.quoteNumber);
  const validUntil = escapeHtml(data.validUntil);
  const serviceTitle = escapeHtml(data.serviceTitle);
  const totalDue = escapeHtml(data.totalDue);
  const paymentNote = escapeHtml(data.paymentNote);
  const senderName = escapeHtml(data.sender.name);
  const senderTitle = escapeHtml(data.sender.title);
  const senderPhone = escapeHtml(data.sender.phone);
  const senderEmail = escapeHtml(data.sender.email);
  const senderWebsite = escapeHtml(
    data.sender.website.replace(/^https?:\/\//, "")
  );
  const telHref = escapeHtml(formatTelHref(data.sender.phone));
  const mailtoHref = escapeHtml(
    `mailto:${data.sender.email}?subject=${encodeURIComponent(data.confirmSubject)}`
  );
  const websiteHref = escapeHtml(
    data.sender.website.startsWith("http")
      ? data.sender.website
      : `https://${data.sender.website}`
  );
  const emailHref = escapeHtml(`mailto:${data.sender.email}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${quoteTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:${SURFACE};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${SURFACE};opacity:0;">${preheader}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${SURFACE};">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;">

        <tr>
          <td style="background-color:${NAVY};padding:24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" style="padding-right:14px;">
                  ${HEADER_LOGO_SVG}
                </td>
                <td valign="middle">
                  <div style="font-family:${FONT};font-size:20px;font-weight:bold;letter-spacing:1px;color:#FFFFFF;line-height:1;">VELOCITYMAID</div>
                  <div style="font-family:${FONT};font-size:9px;font-weight:bold;letter-spacing:2.5px;color:${CYAN};line-height:1;padding-top:5px;">COME HOME TO CLEAN.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background-color:#FFFFFF;padding:32px 32px 8px;">
            <div style="font-family:${FONT};font-size:22px;font-weight:bold;color:${NAVY};line-height:1.3;">Your quote is confirmed, ${firstName}.</div>
            <p style="font-family:${FONT};font-size:15px;color:${TEXT};line-height:1.65;margin:16px 0 0;">Thanks for speaking with us today — we&apos;re looking forward to getting ${propertyAddress} clean and ready. Here&apos;s your confirmed quote for ${serviceDateHero}.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${SURFACE};border-radius:8px;">
              <tr>
                <td style="padding:24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-family:${FONT};font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${MUTED};">Quote ${quoteNumber}</td>
                      <td align="right" style="font-family:${FONT};font-size:10px;color:${MUTED};">Valid until ${validUntil}</td>
                    </tr>
                  </table>
                  <div style="font-family:${FONT};font-size:16px;font-weight:bold;color:${NAVY};padding-top:12px;">${serviceTitle}</div>
                  <div style="font-family:${FONT};font-size:13px;color:${MUTED};padding:4px 0 16px;">${buildServiceMeta(data)}</div>

                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${buildLineItemsHtml(data.lineItems)}
                    <tr>
                      <td style="font-family:${FONT};font-size:15px;font-weight:bold;color:${NAVY};padding:14px 0 0;">Total due</td>
                      <td align="right" style="font-family:${FONT};font-size:20px;font-weight:bold;color:${CYAN};padding:14px 0 0;">${totalDue}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background-color:#FFFFFF;padding:24px 32px 8px;">
            <div style="font-family:${FONT};font-size:13px;font-weight:bold;color:${NAVY};padding-bottom:12px;">What&apos;s included:</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${buildInclusionsHtml(data.inclusions)}
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="background-color:#FFFFFF;padding:24px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="background-color:${CYAN};border-radius:6px;">
                  <a href="${mailtoHref}" style="display:inline-block;font-family:${FONT};font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:${NAVY};text-decoration:none;padding:16px 40px;">CONFIRM THIS BOOKING</a>
                </td>
              </tr>
            </table>
            <p style="font-family:${FONT};font-size:12px;color:${MUTED};line-height:1.6;margin:14px 0 0;">Reply to this email or click above to confirm. ${paymentNote}</p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#FFFFFF;padding:8px 32px 24px;">
            <p style="font-family:${FONT};font-size:14px;color:${BODY};line-height:1.65;margin:0;">Questions? Just reply to this email — we&apos;re happy to walk you through anything.</p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#FFFFFF;padding:0 32px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="top" style="border-left:4px solid ${CYAN};padding-left:16px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" style="padding-right:12px;">
                        ${SIGNATURE_LOGO_SVG}
                      </td>
                      <td valign="middle">
                        <div style="font-family:${FONT};font-size:15px;font-weight:bold;color:${NAVY};line-height:1.2;">${senderName}</div>
                        <div style="font-family:${FONT};font-size:13px;color:${MUTED};padding-top:2px;">${senderTitle}</div>
                      </td>
                    </tr>
                  </table>
                  <div style="font-family:${FONT};font-size:13px;color:${BODY};line-height:1.9;padding-top:12px;">
                    <a href="tel:${telHref}" style="color:${BODY};text-decoration:none;"><span style="color:${CYAN_DARK};font-weight:bold;">P</span>&nbsp;&nbsp;${senderPhone}</a><br />
                    <a href="${emailHref}" style="color:${BODY};text-decoration:none;"><span style="color:${CYAN_DARK};font-weight:bold;">E</span>&nbsp;&nbsp;${senderEmail}</a><br />
                    <a href="${websiteHref}" style="color:${BODY};text-decoration:none;"><span style="color:${CYAN_DARK};font-weight:bold;">W</span>&nbsp;&nbsp;${senderWebsite}</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="background-color:${NAVY};padding:20px 32px;">
            <div style="font-family:${FONT};font-size:11px;font-weight:bold;letter-spacing:2px;color:${CYAN};">COME HOME TO CLEAN.</div>
            <div style="font-family:${FONT};font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;line-height:1.5;">VelocityMaid &middot; Premium Cleaning &amp; Property Readiness &middot; Vermont &amp; New Jersey</div>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
}
