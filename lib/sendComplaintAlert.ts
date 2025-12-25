/**
 * Send Complaint Alert to Admin
 * 
 * Sends WhatsApp and email notifications when a new complaint is created
 */

import { getAdminNumber } from './whatsappRouter';
import type { Complaint } from '../utils/complaintData';

interface ComplaintAlertResult {
  success: boolean;
  whatsappMessageId?: string;
  error?: string;
}

/**
 * Send complaint alert to admin
 */
export async function sendComplaintAlert(complaint: Complaint): Promise<ComplaintAlertResult> {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !whatsappPhoneNumberId) {
    console.warn('WhatsApp credentials not configured - skipping complaint alert');
    return {
      success: false,
      error: 'WhatsApp credentials not configured',
    };
  }

  // Get admin number based on service location
  const adminPhone = getAdminNumber(complaint.serviceLocation);
  if (!adminPhone) {
    console.warn(`Admin phone not configured for ${complaint.serviceLocation}`);
    return {
      success: false,
      error: 'Admin phone not configured',
    };
  }

  const locationLabel = complaint.serviceLocation === 'new_jersey' ? 'New Jersey' : 'Vermont';
  const ratingStars = '⭐'.repeat(complaint.rating) + '☆'.repeat(5 - complaint.rating);

  // Format message
  // TODO: Create WhatsApp template "admin_complaint_v1" in Meta
  // For now, using simple text format
  const message = `🚨 New Complaint Created [${locationLabel}]

Customer: ${complaint.customerName}
Rating: ${ratingStars} (${complaint.rating}/5)
Job ID: ${complaint.jobId.substring(0, 12)}...
${complaint.comment ? `Comment: ${complaint.comment.substring(0, 100)}${complaint.comment.length > 100 ? '...' : ''}` : 'No comment provided'}
${complaint.requestReclean ? '🔄 Re-clean requested' : ''}

Please review and take action.`;

  console.log('Complaint alert (would send to admin):', {
    adminPhone,
    message,
    complaintId: complaint.id,
  });

  // TODO: Uncomment when WhatsApp template is approved
  /*
  const { sendWhatsAppTemplate } = await import('./whatsapp');
  
  const result = await sendWhatsAppTemplate({
    phoneNumberId: whatsappPhoneNumberId,
    accessToken: whatsappToken,
    to: adminPhone,
    templateName: 'admin_complaint_v1',
    languageCode: 'en_US',
    parameters: [
      complaint.customerName,
      complaint.rating.toString(),
      locationLabel,
      complaint.jobId.substring(0, 12),
      complaint.requestReclean ? 'Yes' : 'No',
      complaint.comment || 'No comment provided',
    ],
  });

  if (result.success) {
    console.log('Complaint alert sent to admin:', {
      messageId: result.messageId,
      adminPhone,
      complaintId: complaint.id,
    });
    return {
      success: true,
      whatsappMessageId: result.messageId,
    };
  } else {
    console.error('Failed to send complaint alert:', result.error);
    return {
      success: false,
      error: result.error,
    };
  }
  */

  // TODO: Send email alert
  // await sendComplaintEmailAlert(complaint);

  // For now, return success (logging only)
  return {
    success: true,
  };
}

/**
 * Send email alert for complaint
 * TODO: Implement email sending (SendGrid, Resend, etc.)
 */
async function sendComplaintEmailAlert(complaint: Complaint): Promise<void> {
  // TODO: Implement email sending
  // Example using SendGrid or Resend:
  /*
  const emailBody = `
    New Complaint Created
    
    Customer: ${complaint.customerName}
    Rating: ${complaint.rating}/5
    Location: ${complaint.serviceLocation}
    Job ID: ${complaint.jobId}
    Re-clean Requested: ${complaint.requestReclean ? 'Yes' : 'No'}
    Comment: ${complaint.comment || 'No comment'}
  `;
  
  await sendEmail({
    to: adminEmail,
    subject: `New VelocityMaid Complaint — ${complaint.serviceLocation === 'new_jersey' ? 'NJ' : 'VT'}`,
    body: emailBody,
  });
  */
}




