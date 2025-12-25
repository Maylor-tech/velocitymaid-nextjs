/**
 * Send Admin Alert for Low Rating
 * 
 * Sends WhatsApp notification to admin when a review with rating <= 3 is submitted
 */

import { sendWhatsAppTemplate } from './whatsapp';
import { getAdminNumber } from './whatsappRouter';
import type { Review } from '../utils/reviewData';

interface LowRatingAlertResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send low-rating alert to admin
 */
export async function sendAdminLowRatingAlert(review: Review): Promise<LowRatingAlertResult> {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !whatsappPhoneNumberId) {
    console.warn('WhatsApp credentials not configured - skipping low-rating alert');
    return {
      success: false,
      error: 'WhatsApp credentials not configured',
    };
  }

  // Get admin number based on service location
  const adminPhone = getAdminNumber(review.serviceLocation);
  if (!adminPhone) {
    console.warn(`Admin phone not configured for ${review.serviceLocation}`);
    return {
      success: false,
      error: 'Admin phone not configured',
    };
  }

  // Format rating text
  const ratingText = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const locationLabel = review.serviceLocation === 'new_jersey' ? 'New Jersey' : 'Vermont';

  // For now, use a simple text message format
  // TODO: Create WhatsApp template "admin_low_rating_v1" in Meta
  const message = `⚠️ Low Rating Alert [${locationLabel}]

Job ID: ${review.jobId.substring(0, 12)}...
Rating: ${ratingText} (${review.rating}/5)
${review.comment ? `Comment: ${review.comment.substring(0, 100)}${review.comment.length > 100 ? '...' : ''}` : 'No comment provided'}
${review.requestReclean ? '🔄 Re-clean requested' : ''}

Please follow up with the customer.`;

  // Note: This is a placeholder. In production, use WhatsApp template:
  // Template: "admin_low_rating_v1"
  // Parameters: [jobId, rating, location, comment (optional), recleanRequest (yes/no)]

  console.log('Low-rating alert (would send to admin):', {
    adminPhone,
    message,
    reviewId: review.id,
  });

  // TODO: Uncomment when WhatsApp template is approved
  /*
  const result = await sendWhatsAppTemplate({
    phoneNumberId: whatsappPhoneNumberId,
    accessToken: whatsappToken,
    to: adminPhone,
    templateName: 'admin_low_rating_v1',
    languageCode: 'en_US',
    parameters: [
      review.jobId.substring(0, 12),
      review.rating.toString(),
      locationLabel,
      review.comment || 'No comment',
      review.requestReclean ? 'Yes' : 'No',
    ],
  });

  if (result.success) {
    console.log('Low-rating alert sent to admin:', {
      messageId: result.messageId,
      adminPhone,
      reviewId: review.id,
    });
    return {
      success: true,
      messageId: result.messageId,
    };
  } else {
    console.error('Failed to send low-rating alert:', result.error);
    return {
      success: false,
      error: result.error,
    };
  }
  */

  // For now, return success (logging only)
  return {
    success: true,
  };
}




