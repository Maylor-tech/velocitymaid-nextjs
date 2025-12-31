/**
 * Phase 3G: Payout Confirmation Email
 * 
 * Email template and sending logic for payout confirmations
 * Sent when PayoutTransfer transitions to PAID status
 */

/**
 * Generate payout confirmation email HTML
 */
export function getPayoutConfirmationEmailHTML(data: {
  cleanerName: string;
  amount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paidDate: string;
  stripePayoutId: string | null;
  transferId: string;
  statementUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Confirmation - VelocityMaid</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💰 Payout Confirmed</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.cleanerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">
      Great news! Your payout has been processed and confirmed. The funds should arrive in your account within 1-3 business days.
    </p>
    
    <div style="background: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Payout Amount</div>
      <div style="font-size: 42px; font-weight: bold; color: #059669; margin: 10px 0;">
        ${data.currency === "USD" ? "$" : ""}${data.amount}
      </div>
      <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">${data.currency}</div>
    </div>
    
    <div style="background: #f9fafb; border-left: 4px solid #059669; padding: 20px; margin: 25px 0; border-radius: 5px;">
      <h2 style="color: #059669; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Payout Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%; color: #6b7280;">Period:</td>
          <td style="padding: 8px 0;">${data.periodStart} - ${data.periodEnd}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Paid Date:</td>
          <td style="padding: 8px 0;">${data.paidDate}</td>
        </tr>
        ${data.stripePayoutId ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Stripe Reference:</td>
          <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${data.stripePayoutId}</td>
        </tr>
        ` : ""}
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Transfer ID:</td>
          <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${data.transferId}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.statementUrl}" 
         style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
        View Payout Statement
      </a>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 5px;">
      <p style="margin: 0; font-size: 13px; color: #92400e;">
        <strong>Note:</strong> Funds typically arrive in your account within 1-3 business days. 
        If you have any questions or concerns, please contact support.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">
      Thank you for your continued partnership with VelocityMaid!
    </p>
    <p style="color: #6b7280; font-size: 14px; margin: 0;">
      — VelocityMaid Operations Team
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate payout confirmation email text (plain text version)
 */
export function getPayoutConfirmationEmailText(data: {
  cleanerName: string;
  amount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paidDate: string;
  stripePayoutId: string | null;
  transferId: string;
  statementUrl: string;
}): string {
  return `
Payout Confirmed - VelocityMaid

Hi ${data.cleanerName},

Great news! Your payout has been processed and confirmed. The funds should arrive in your account within 1-3 business days.

Payout Amount: ${data.currency === "USD" ? "$" : ""}${data.amount} ${data.currency}

Payout Details:
- Period: ${data.periodStart} - ${data.periodEnd}
- Paid Date: ${data.paidDate}
${data.stripePayoutId ? `- Stripe Reference: ${data.stripePayoutId}` : ""}
- Transfer ID: ${data.transferId}

View your payout statement: ${data.statementUrl}

Note: Funds typically arrive in your account within 1-3 business days. If you have any questions or concerns, please contact support.

Thank you for your continued partnership with VelocityMaid!

— VelocityMaid Operations Team
  `.trim();
}

/**
 * Send payout confirmation email
 * 
 * @param transfer - PayoutTransfer with related data
 * @param baseUrl - Base URL for statement link
 */
export async function sendPayoutConfirmationEmail(
  transfer: {
    id: string;
    cleanerId: string;
    amountCents: number;
    currency: string;
    stripePayoutId: string | null;
    createdAt: Date;
    cleaner: {
      name: string | null;
      email: string;
    };
    batch: {
      periodStart: Date;
      periodEnd: Date;
    };
  },
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("[PAYOUT_CONFIRMATION_EMAIL] RESEND_API_KEY not configured, skipping email");
      return { success: false, error: "Email service not configured" };
    }

    // Check if cleaner has email
    if (!transfer.cleaner.email || !transfer.cleaner.email.includes("@")) {
      console.warn(`[PAYOUT_CONFIRMATION_EMAIL] No valid email for cleaner ${transfer.cleanerId}`);
      return { success: false, error: "Cleaner email not available" };
    }

    // Import Resend dynamically
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format data
    const amount = (transfer.amountCents / 100).toFixed(2);
    const periodStart = transfer.batch.periodStart.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const periodEnd = transfer.batch.periodEnd.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const paidDate = transfer.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Generate statement URL
    const statementUrl = `${baseUrl}/api/cleaner/statements/${transfer.id}`;

    // Prepare email data
    const emailData = {
      cleanerName: transfer.cleaner.name || "Cleaner",
      amount,
      currency: transfer.currency,
      periodStart,
      periodEnd,
      paidDate,
      stripePayoutId: transfer.stripePayoutId,
      transferId: transfer.id,
      statementUrl,
    };

    // Send email
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "VelocityMaid <onboarding@resend.dev>",
      to: transfer.cleaner.email,
      subject: `Payout Confirmed: $${amount} - VelocityMaid`,
      html: getPayoutConfirmationEmailHTML(emailData),
      text: getPayoutConfirmationEmailText(emailData),
    });

    console.log(
      `[PAYOUT_CONFIRMATION_EMAIL] Email sent to ${transfer.cleaner.email} for transfer ${transfer.id}`
    );

    return { success: true };
  } catch (error: any) {
    console.error(
      `[PAYOUT_CONFIRMATION_EMAIL] Failed to send email for transfer ${transfer.id}:`,
      error
    );
    return {
      success: false,
      error: error?.message || "Failed to send payout confirmation email",
    };
  }
}


