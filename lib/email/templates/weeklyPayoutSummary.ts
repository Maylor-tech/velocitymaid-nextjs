/**
 * Weekly Payout Summary Email Template
 * 
 * Generates HTML and text versions of weekly payout summary emails
 */

import { CleanerPayoutSummary } from "@/lib/payoutSummary";

export function getWeeklyPayoutSummarySubject(dateFrom: Date, dateTo: Date): string {
  const fromStr = dateFrom.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const toStr = dateTo.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Your Weekly Payout Summary (${fromStr} – ${toStr})`;
}

export function getWeeklyPayoutSummaryHTML(summary: CleanerPayoutSummary, baseUrl: string = ""): string {
  const { cleanerName, dateFrom, dateTo, totals, payouts } = summary;
  const fromStr = dateFrom.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const toStr = dateTo.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const totalAmount = totals.paid + totals.sent + totals.approved + totals.pending;
  const currency = payouts[0]?.currency || "USD";
  const currencySymbol = currency === "USD" ? "$" : currency;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Payout Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Weekly Payout Summary</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${cleanerName || "there"},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Here's your payout summary for the week of <strong>${fromStr}</strong> to <strong>${toStr}</strong>.
    </p>

    <!-- Summary Totals -->
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <h2 style="font-size: 18px; margin-top: 0; margin-bottom: 15px; color: #111827;">Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Total Amount:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">
            ${currencySymbol}${totalAmount.toFixed(2)}
          </td>
        </tr>
        ${totals.paid > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">✅ Paid:</td>
          <td style="padding: 8px 0; text-align: right; color: #059669; font-weight: 600;">
            ${currencySymbol}${totals.paid.toFixed(2)}
          </td>
        </tr>
        ` : ""}
        ${totals.sent > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">📤 Sent:</td>
          <td style="padding: 8px 0; text-align: right; color: #7c3aed; font-weight: 600;">
            ${currencySymbol}${totals.sent.toFixed(2)}
          </td>
        </tr>
        ` : ""}
        ${totals.approved > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">⏳ Pending:</td>
          <td style="padding: 8px 0; text-align: right; color: #2563eb; font-weight: 600;">
            ${currencySymbol}${totals.approved.toFixed(2)}
          </td>
        </tr>
        ` : ""}
        ${totals.failed > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">❌ Failed:</td>
          <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 600;">
            ${currencySymbol}${totals.failed.toFixed(2)}
          </td>
        </tr>
        ` : ""}
      </table>
    </div>

    <!-- Payout List -->
    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; margin-top: 0; margin-bottom: 15px; color: #111827;">Payout Details</h2>
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        ${payouts.map((payout) => {
          const statusColor = 
            payout.status === "PAID" ? "#059669" :
            payout.status === "SENT" ? "#7c3aed" :
            payout.status === "FAILED" ? "#dc2626" :
            "#2563eb";
          
          const statusIcon =
            payout.status === "PAID" ? "✅" :
            payout.status === "SENT" ? "📤" :
            payout.status === "FAILED" ? "❌" :
            "⏳";

          return `
          <div style="border-bottom: 1px solid #e5e7eb; padding: 15px; ${payouts.indexOf(payout) === payouts.length - 1 ? "border-bottom: none;" : ""}">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
                  ${statusIcon} ${currencySymbol}${payout.amount.toFixed(2)}
                </div>
                <div style="font-size: 12px; color: #6b7280; font-family: monospace;">
                  Job: ${payout.jobId.substring(0, 8)}...
                </div>
              </div>
              <div style="text-align: right;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: ${statusColor}20; color: ${statusColor};">
                  ${payout.status}
                </span>
              </div>
            </div>
            ${payout.paymentMethodType ? `
            <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">
              Method: ${payout.paymentMethodType}
            </div>
            ` : ""}
            ${payout.paidAt ? `
            <div style="font-size: 12px; color: #059669; margin-top: 4px;">
              Paid: ${new Date(payout.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            ` : payout.executedAt ? `
            <div style="font-size: 12px; color: #7c3aed; margin-top: 4px;">
              Sent: ${new Date(payout.executedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
            ` : ""}
            ${baseUrl ? `
            <div style="margin-top: 8px;">
              <a href="${baseUrl}/cleaner/payouts/${payout.payoutId}" style="color: #2563eb; text-decoration: none; font-size: 12px;">
                View Receipt →
              </a>
            </div>
            ` : ""}
          </div>
          `;
        }).join("")}
      </div>
    </div>

    <!-- Action Buttons -->
    <div style="text-align: center; margin-top: 30px;">
      ${baseUrl ? `
      <a href="${baseUrl}/cleaner/earnings" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
        View All Earnings
      </a>
      ` : ""}
      ${baseUrl ? `
      <a href="${baseUrl}/cleaner/notifications" style="display: inline-block; background: #ffffff; color: #2563eb; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; border: 1px solid #2563eb;">
        View Notifications
      </a>
      ` : ""}
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #6b7280; margin: 0;">
      If you have any questions about your payouts, please contact support.
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function getWeeklyPayoutSummaryText(summary: CleanerPayoutSummary, baseUrl: string = ""): string {
  const { cleanerName, dateFrom, dateTo, totals, payouts } = summary;
  const fromStr = dateFrom.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const toStr = dateTo.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const totalAmount = totals.paid + totals.sent + totals.approved + totals.pending;
  const currency = payouts[0]?.currency || "USD";
  const currencySymbol = currency === "USD" ? "$" : currency;

  let text = `Weekly Payout Summary\n`;
  text += `====================\n\n`;
  text += `Hi ${cleanerName || "there"},\n\n`;
  text += `Here's your payout summary for the week of ${fromStr} to ${toStr}.\n\n`;
  text += `Summary:\n`;
  text += `--------\n`;
  text += `Total Amount: ${currencySymbol}${totalAmount.toFixed(2)}\n`;
  if (totals.paid > 0) text += `✅ Paid: ${currencySymbol}${totals.paid.toFixed(2)}\n`;
  if (totals.sent > 0) text += `📤 Sent: ${currencySymbol}${totals.sent.toFixed(2)}\n`;
  if (totals.approved > 0) text += `⏳ Pending: ${currencySymbol}${totals.approved.toFixed(2)}\n`;
  if (totals.failed > 0) text += `❌ Failed: ${currencySymbol}${totals.failed.toFixed(2)}\n`;
  text += `\n`;
  text += `Payout Details:\n`;
  text += `--------------\n`;

  payouts.forEach((payout) => {
    const statusIcon =
      payout.status === "PAID" ? "✅" :
      payout.status === "SENT" ? "📤" :
      payout.status === "FAILED" ? "❌" :
      "⏳";

    text += `${statusIcon} ${currencySymbol}${payout.amount.toFixed(2)} - ${payout.status}\n`;
    text += `   Job: ${payout.jobId.substring(0, 8)}...\n`;
    if (payout.paymentMethodType) {
      text += `   Method: ${payout.paymentMethodType}\n`;
    }
    if (payout.paidAt) {
      text += `   Paid: ${new Date(payout.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n`;
    } else if (payout.executedAt) {
      text += `   Sent: ${new Date(payout.executedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\n`;
    }
    if (baseUrl) {
      text += `   Receipt: ${baseUrl}/cleaner/payouts/${payout.payoutId}\n`;
    }
    text += `\n`;
  });

  if (baseUrl) {
    text += `\nView All Earnings: ${baseUrl}/cleaner/earnings\n`;
    text += `View Notifications: ${baseUrl}/cleaner/notifications\n`;
  }

  text += `\nIf you have any questions about your payouts, please contact support.\n`;

  return text;
}






