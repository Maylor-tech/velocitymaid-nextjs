/**
 * WhatsApp Service Layer
 * 
 * Handles WhatsApp messaging via Meta WhatsApp Cloud API
 * Compatible with Jamaica operations and U.S. flows
 */

import axios from 'axios';

const WABA_TOKEN = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '';
const WABA_PHONE_ID = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WABA_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';

interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface WhatsAppErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Format phone number for WhatsApp (remove non-digits except +)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, assume it's a US number and add country code
  if (!cleaned.startsWith('+')) {
    // If it's 10 digits, assume US and add +1
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Send a simple text WhatsApp message
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!WABA_TOKEN || !WABA_PHONE_ID) {
      return {
        success: false,
        error: 'WhatsApp credentials not configured. Please set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in environment variables.',
      };
    }

    const formattedPhone = formatPhoneNumber(to);
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    const response = await axios.post<WhatsAppMessageResponse>(
      `https://graph.facebook.com/${WABA_VERSION}/${WABA_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WABA_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.messages && response.data.messages.length > 0) {
      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    }

    return {
      success: false,
      error: 'No message ID returned from WhatsApp API',
    };
  } catch (error: any) {
    console.error('WhatsApp send error:', error.response?.data || error.message);
    const errorData = error.response?.data as WhatsAppErrorResponse;
    return {
      success: false,
      error: errorData?.error?.message || error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Auto-reply: Booking link
 */
export async function replyWithBookingLink(
  to: string,
  branchSlug: string = 'port-antonio'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Thanks for contacting VelocityMaid! 🧹\n\nBook your cleaning here:\nhttps://velocitymaid.com/booking?branch=${branchSlug}`;
  return sendWhatsAppMessage(to, message);
}

/**
 * Auto-reply: Cleaner application link
 */
export async function replyWithCleanerApply(
  to: string,
  branchSlug: string = 'port-antonio'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const marketBySlug: Record<string, string> = {
    'port-antonio': 'jamaica',
    vermont: 'vermont',
    'new-jersey': 'new-jersey',
  };
  const market = marketBySlug[branchSlug] ?? 'new-jersey';
  const message = `Thanks for your interest in joining VelocityMaid! 👷\n\nApply here:\nhttps://velocitymaid.com/cleaners/apply?market=${market}`;
  return sendWhatsAppMessage(to, message);
}

/**
 * Auto-reply: General help
 */
export async function replyWithGeneralHelp(to: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Hi! 👋\n\nWe're here to help you with:\n• Book a cleaning\n• Apply to be a cleaner\n• Ask a question\n\nReply with:\nBOOK – to schedule a cleaning\nAPPLY – to become a cleaner\nHELP – for more options`;
  return sendWhatsAppMessage(to, message);
}

/**
 * Send Job Offer via WhatsApp
 * 
 * Sends a job offer message to a cleaner with job details
 * Cleaner can reply YES or NO to accept/decline
 */
export async function sendJobOffer(
  to: string,
  jobInfo: {
    jobId: string;
    customerName: string;
    address: string | null;
    preferredDate: Date | null;
    preferredTime: string | null;
    serviceType: string | null;
    totalPrice: any;
    currency: string | null;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const dateStr = jobInfo.preferredDate
      ? new Date(jobInfo.preferredDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'TBD';
    
    const timeStr = jobInfo.preferredTime || 'TBD';
    const serviceStr = jobInfo.serviceType || 'Cleaning Service';
    const priceStr = jobInfo.totalPrice
      ? `${jobInfo.currency === 'JMD' ? 'J$' : '$'}${Number(jobInfo.totalPrice).toLocaleString()}`
      : 'TBD';
    
    const addressStr = jobInfo.address || 'Address TBD';

    const message = `🧹 *New Job Offer - VelocityMaid*\n\n` +
      `*Customer:* ${jobInfo.customerName}\n` +
      `*Date:* ${dateStr}\n` +
      `*Time:* ${timeStr}\n` +
      `*Service:* ${serviceStr}\n` +
      `*Address:* ${addressStr}\n` +
      `*Pay:* ${priceStr}\n\n` +
      `Reply *YES* to accept or *NO* to decline.\n\n` +
      `Job ID: ${jobInfo.jobId}`;

    return sendWhatsAppMessage(to, message);
  } catch (error: any) {
    console.error('Send job offer error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send job offer',
    };
  }
}

/**
 * Parse YES/NO reply from WhatsApp message
 * 
 * Returns: 'YES' | 'NO' | null
 */
export function parseJobReply(message: string): 'YES' | 'NO' | null {
  const normalized = message.trim().toUpperCase();
  
  // Check for YES
  if (normalized === 'YES' || normalized === 'Y' || normalized.startsWith('YES') || normalized.includes('ACCEPT')) {
    return 'YES';
  }
  
  // Check for NO
  if (normalized === 'NO' || normalized === 'N' || normalized.startsWith('NO') || normalized.includes('DECLINE') || normalized.includes('REJECT')) {
    return 'NO';
  }
  
  return null;
}

