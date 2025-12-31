/**
 * Phase 3H.3: W-9 Reminder Email
 * 
 * Email template for W-9 tax form reminders
 * Sent to cleaners who meet 1099 threshold but haven't submitted/verified W-9
 * No sensitive data in emails
 */

/**
 * Generate W-9 reminder email subject
 */
export function getW9ReminderEmailSubject(reminderNumber: number): string {
  if (reminderNumber === 1) {
    return "Action Required: Complete Your Tax Form to Receive Payments";
  } else if (reminderNumber === 2) {
    return "Reminder: Complete Your Tax Form (Second Notice)";
  } else {
    return "Final Reminder: Complete Your Tax Form (Final Notice)";
  }
}

/**
 * Generate W-9 reminder email HTML
 */
export function getW9ReminderEmailHTML(data: {
  cleanerName: string;
  reminderNumber: number;
  taxFormUrl: string;
}): string {
  const urgencyText =
    data.reminderNumber === 1
      ? "To continue receiving payments, we need you to complete your tax form."
      : data.reminderNumber === 2
      ? "This is your second reminder. Please complete your tax form to avoid payment delays."
      : "This is your final reminder. Payment processing may be delayed until your tax form is completed.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Form Reminder - VelocityMaid</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📋 Tax Form Reminder</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.cleanerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">
      ${urgencyText}
    </p>
    
    <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">
        ⚠️ Why this matters:
      </p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e; font-size: 14px;">
        <li>Federal tax regulations require us to collect tax information</li>
        <li>Your earnings have reached the reporting threshold</li>
        <li>Completing the form ensures uninterrupted payment processing</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.taxFormUrl}" style="display: inline-block; background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Complete Tax Form →
      </a>
    </div>
    
    <div style="background: #f9fafb; border-left: 4px solid #059669; padding: 20px; margin: 25px 0; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        <strong>What you'll need:</strong>
      </p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #6b7280;">
        <li>Social Security Number (SSN) or Employer Identification Number (EIN)</li>
        <li>Legal name and address</li>
        <li>Tax classification (Individual, LLC, Corporation, etc.)</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px; margin-bottom: 10px;">
      The form takes about 5 minutes to complete. All information is encrypted and secure.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      If you have questions or need assistance, please contact our support team.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Best regards,<br>
      <strong>The VelocityMaid Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #9ca3af; margin: 5px 0;">
      This is an automated reminder. You're receiving this because your earnings have reached the tax reporting threshold.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate W-9 reminder email plain text
 */
export function getW9ReminderEmailText(data: {
  cleanerName: string;
  reminderNumber: number;
  taxFormUrl: string;
}): string {
  const urgencyText =
    data.reminderNumber === 1
      ? "To continue receiving payments, we need you to complete your tax form."
      : data.reminderNumber === 2
      ? "This is your second reminder. Please complete your tax form to avoid payment delays."
      : "This is your final reminder. Payment processing may be delayed until your tax form is completed.";

  return `
Hi ${data.cleanerName},

${urgencyText}

Why this matters:
- Federal tax regulations require us to collect tax information
- Your earnings have reached the reporting threshold
- Completing the form ensures uninterrupted payment processing

Complete your tax form here: ${data.taxFormUrl}

What you'll need:
- Social Security Number (SSN) or Employer Identification Number (EIN)
- Legal name and address
- Tax classification (Individual, LLC, Corporation, etc.)

The form takes about 5 minutes to complete. All information is encrypted and secure.

If you have questions or need assistance, please contact our support team.

Best regards,
The VelocityMaid Team

---
This is an automated reminder. You're receiving this because your earnings have reached the tax reporting threshold.
  `.trim();
}


