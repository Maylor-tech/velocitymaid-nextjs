/**
 * WhatsApp Cloud API Utility Functions
 * 
 * Handles sending WhatsApp messages via Meta's WhatsApp Cloud API
 */

interface WhatsAppMessageParams {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  parameters: string[];
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a WhatsApp template message via Cloud API
 */
export async function sendWhatsAppTemplate(
  params: WhatsAppMessageParams
): Promise<WhatsAppResponse> {
  const { phoneNumberId, accessToken, to, templateName, languageCode, parameters } = params;

  // Validate required fields
  if (!phoneNumberId || !accessToken || !to || !templateName) {
    return {
      success: false,
      error: 'Missing required parameters: phoneNumberId, accessToken, to, and templateName are required',
    };
  }

  // Format phone number (remove any non-digit characters except +)
  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    return {
      success: false,
      error: 'Invalid phone number format',
    };
  }

  // Build request body
  const body = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: [
        {
          type: 'body',
          parameters: parameters.map((param) => ({
            type: 'text',
            text: param,
          })),
        },
      ],
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: data,
      });

      return {
        success: false,
        error: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Success response
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error('WhatsApp API Request Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message',
    };
  }
}

/**
 * Format phone number for WhatsApp API
 * Accepts formats: +1234567890, 1234567890, (123) 456-7890, etc.
 * Returns: +1234567890 format (with country code)
 */
function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If it starts with +, return as is (assuming it's already formatted)
  if (cleaned.startsWith('+')) {
    // Validate: should be + followed by 10-15 digits
    const digits = cleaned.slice(1);
    if (digits.length >= 10 && digits.length <= 15) {
      return cleaned;
    }
    return null;
  }

  // If it's 10 digits, assume US number and add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If it's 11 digits starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // If it's already 11+ digits, assume it needs +
  if (cleaned.length >= 11) {
    return `+${cleaned}`;
  }

  return null;
}

/**
 * Send 24-hour reminder WhatsApp message
 */
export async function send24HourReminder(
  phoneNumberId: string,
  accessToken: string,
  customerPhone: string,
  clientName: string,
  serviceType: string,
  scheduledDate: string,
  timeSlot: string,
  serviceAddress: string
): Promise<WhatsAppResponse> {
  // Format service type for display
  const serviceTypeFormatted = formatServiceType(serviceType);

  // Format date for display
  const dateFormatted = formatDate(scheduledDate);

  return await sendWhatsAppTemplate({
    phoneNumberId,
    accessToken,
    to: customerPhone,
    templateName: 'reminder_24h_v3',
    languageCode: 'en_US',
    parameters: [
      clientName,
      serviceTypeFormatted,
      dateFormatted,
      timeSlot,
      serviceAddress,
    ],
  });
}

/**
 * Format service type for display
 */
function formatServiceType(serviceType: string): string {
  const serviceNames: Record<string, string> = {
    basic: 'Basic Clean',
    deep: 'Deep Clean',
    moveInOut: 'Move In/Out Clean',
  };
  return serviceNames[serviceType] || serviceType;
}

/**
 * Format date for display (e.g., "Monday, December 25, 2024")
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return dateString; // Return original on error
  }
}



