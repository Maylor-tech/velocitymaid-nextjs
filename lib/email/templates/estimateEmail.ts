// lib/email/templates/estimateEmail.ts

export interface EstimateLineItem {
  label: string;
  amount: number;
}

export interface EstimateEmailProps {
  customerName?: string | null;
  estimateTotal: number;
  subtotal: number;
  tax: number;
  currency?: string;
  lineItems: EstimateLineItem[];
  estimatedHours?: number | null;
  recommendedCleaners?: number | null;
  serviceDateLabel?: string | null; // e.g. "Wednesday, Jan 5 at 2:00 PM"
  serviceAddress?: string | null;
  branchName?: string | null;
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function renderEstimateEmail({
  customerName,
  estimateTotal,
  subtotal,
  tax,
  currency = 'USD',
  lineItems,
  estimatedHours,
  recommendedCleaners,
  serviceDateLabel,
  serviceAddress,
  branchName,
}: EstimateEmailProps): string {
  const totalStr = formatCurrency(estimateTotal, currency);
  const subtotalStr = formatCurrency(subtotal, currency);
  const taxStr = formatCurrency(tax, currency);

  const safeName = customerName && customerName.trim().length > 0
    ? customerName.trim()
    : 'there';

  const branchDisplay = branchName ?? 'VelocityMaid';

  const itemsHtml = lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 4px 0; color: #111827;">${item.label}</td>
          <td style="padding: 4px 0; text-align: right; color: #111827;">
            ${formatCurrency(item.amount, currency)}
          </td>
        </tr>
      `,
    )
    .join('');

  const metaRows: string[] = [];

  if (typeof estimatedHours === 'number') {
    metaRows.push(
      `<div style="margin-bottom: 4px;">Estimated Time: <strong>${estimatedHours.toFixed(
        1,
      )} hours</strong></div>`,
    );
  }

  if (typeof recommendedCleaners === 'number') {
    metaRows.push(
      `<div style="margin-bottom: 4px;">Recommended Cleaners: <strong>${recommendedCleaners}</strong></div>`,
    );
  }

  if (serviceDateLabel) {
    metaRows.push(
      `<div style="margin-bottom: 4px;">Preferred Date/Time: <strong>${serviceDateLabel}</strong></div>`,
    );
  }

  if (serviceAddress) {
    metaRows.push(
      `<div style="margin-bottom: 4px;">Service Address: <strong>${serviceAddress}</strong></div>`,
    );
  }

  const metaHtml =
    metaRows.length > 0
      ? `<div style="margin-top: 12px; font-size: 13px; color: #4b5563;">
          ${metaRows.join('')}
        </div>`
      : '';

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <title>Your Cleaning Estimate</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.15);">
            <tr>
              <td style="padding:20px 24px 16px 24px;background:linear-gradient(90deg,#2563eb,#4f46e5);color:#ffffff;">
                <div style="font-size:22px;font-weight:700;">VelocityMaid</div>
                <div style="font-size:13px;opacity:0.9;margin-top:2px;">Cleaning Estimate</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px 0;font-size:15px;color:#111827;">
                  Hi ${safeName},
                </p>
                <p style="margin:0 0 16px 0;font-size:14px;color:#4b5563;line-height:1.6;">
                  Here&apos;s your detailed cleaning estimate from <strong>${branchDisplay}</strong>.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;">
                  <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;">
                      Service Breakdown
                    </td>
                    <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:600;color:#111827;text-align:right;">
                      Amount
                    </td>
                  </tr>
                  ${itemsHtml}
                  <tr>
                    <td style="padding-top:12px;border-top:1px solid #e5e7eb;color:#4b5563;">Subtotal</td>
                    <td style="padding-top:12px;border-top:1px solid #e5e7eb;text-align:right;color:#4b5563;">${subtotalStr}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:4px;color:#4b5563;">Tax</td>
                    <td style="padding-top:4px;text-align:right;color:#4b5563;">${taxStr}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:12px;font-weight:700;color:#111827;">Estimated Total</td>
                    <td style="padding-top:12px;text-align:right;font-weight:700;color:#111827;">${totalStr}</td>
                  </tr>
                </table>

                ${metaHtml}

                <div style="margin-top:20px;font-size:13px;color:#4b5563;line-height:1.6;">
                  <p style="margin:0 0 8px 0;">
                    This estimate is based on the details you shared. Final pricing may adjust slightly
                    if the actual condition or size of the home is different from what was described.
                  </p>
                  <p style="margin:0 0 8px 0;">
                    To confirm this booking, simply return to the VelocityMaid website and complete the
                    checkout steps, or call us at <a href="tel:+19732809190" style="color:#2563eb;text-decoration:none;">(973) 280-9190</a>
                    for help.
                  </p>
                </div>

                <div style="margin-top:20px;font-size:12px;color:#9ca3af;">
                  Thank you for trusting VelocityMaid with your home.
                </div>
              </td>
            </tr>
          </table>

          <div style="margin-top:12px;font-size:11px;color:#9ca3af;">
            You received this estimate because your email was used on the VelocityMaid booking form.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

















