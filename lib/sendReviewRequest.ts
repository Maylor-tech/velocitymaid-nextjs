/**
 * Send Review Request to Customer
 * 
 * Sends WhatsApp message to customer requesting review after job completion
 */

import { sendWhatsAppTemplate } from './whatsapp';

interface ReviewRequestParams {
  phoneNumberId: string;
  accessToken: string;
  customerPhone: string;
  customerName: string;
  serviceDate: string;
  jobId: string;
}

interface ReviewRequestResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send review request WhatsApp message
 */
export async function sendReviewRequest({
  phoneNumberId,
  accessToken,
  customerPhone,
  customerName,
  serviceDate,
  jobId,
}: ReviewRequestParams): Promise<ReviewRequestResult> {
  if (!customerPhone) {
    return {
      success: false,
      error: 'Customer phone number is required',
    };
  }

  // Format service date
  const formattedDate = new Date(serviceDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Generate review link
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com';
  const reviewLink = `${baseUrl}/review/${jobId}`;

  // Send WhatsApp template message
  // Template: "review_request_v1"
  // Parameters: [customerName, serviceDate, reviewLink]
  
  const result = await sendWhatsAppTemplate({
    phoneNumberId,
    accessToken,
    to: customerPhone,
    templateName: 'review_request_v1',
    languageCode: 'en_US',
    parameters: [
      customerName,
      formattedDate,
      reviewLink,
    ],
  });

  if (result.success) {
    console.log('Review request sent successfully:', {
      messageId: result.messageId,
      customerPhone,
      jobId,
    });
    return {
      success: true,
      messageId: result.messageId,
    };
  } else {
    console.error('Failed to send review request:', result.error);
    return {
      success: false,
      error: result.error,
    };
  }
}




