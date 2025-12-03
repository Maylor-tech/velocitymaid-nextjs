/**
 * WhatsApp Customer Confirmation Utility
 * 
 * Sends WhatsApp confirmation message to customers after successful booking
 */

import { sendWhatsAppTemplate } from './whatsapp';

/**
 * Generate confirmation number in format: VM + YYYYMMDD + random 4 digits
 * Example: VM20241127-5821
 */
export function generateConfirmationNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate random 4-digit number
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  
  return `VM${dateStr}-${randomDigits}`;
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
 * Format date to YYYY-MM-DD format
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    return dateString; // Return original on error
  }
}

/**
 * Convert time slot to Morning/Afternoon/Evening format
 */
function formatTimeSlot(timeString: string): string {
  if (!timeString) return 'Morning';
  
  // Extract hour from time string (handles formats like "10:00 AM", "2:00 PM", etc.)
  const timeMatch = timeString.match(/(\d+):?\d*\s*(AM|PM)/i);
  if (!timeMatch) {
    // If no AM/PM, try 24-hour format
    const hour24Match = timeString.match(/(\d+):/);
    if (hour24Match) {
      const hour24 = parseInt(hour24Match[1]);
      if (hour24 >= 5 && hour24 < 12) return 'Morning';
      if (hour24 >= 12 && hour24 < 17) return 'Afternoon';
      return 'Evening';
    }
    return 'Morning'; // Default
  }
  
  const hour = parseInt(timeMatch[1]);
  const period = timeMatch[2].toUpperCase();
  
  // Convert to 24-hour format for easier comparison
  let hour24 = hour;
  if (period === 'PM' && hour !== 12) {
    hour24 = hour + 12;
  } else if (period === 'AM' && hour === 12) {
    hour24 = 0;
  }
  
  // Categorize into time slots
  if (hour24 >= 5 && hour24 < 12) {
    return 'Morning';
  } else if (hour24 >= 12 && hour24 < 17) {
    return 'Afternoon';
  } else {
    return 'Evening';
  }
}

interface BookingData {
  firstName: string;
  lastInitial?: string;
  phone: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  currency?: string; // 'USD' or 'JMD'
  totalAmount?: number; // Total booking amount
  branchSlug?: string; // Branch slug (e.g., 'port-antonio')
}

interface ConfirmationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp confirmation message to customer
 * 
 * Template: customer_confirm_v3
 * Parameters (in order):
 * 1. client_name
 * 2. service_type
 * 3. scheduled_date
 * 4. time_slot
 * 5. service_address
 * 
 * @param phoneNumberId - WhatsApp Business Phone Number ID
 * @param accessToken - WhatsApp API Access Token
 * @param booking - Booking data
 * @returns Result with success status
 */
export async function sendCustomerConfirmation(
  phoneNumberId: string,
  accessToken: string,
  booking: BookingData
): Promise<ConfirmationResult> {
  // Validate required fields
  if (!booking.phone || !booking.firstName || !booking.serviceType || !booking.preferredDate || !booking.address) {
    return {
      success: false,
      error: 'Missing required booking fields: phone, firstName, serviceType, preferredDate, and address are required',
    };
  }

  // Build client name
  const clientName = `${booking.firstName}${booking.lastInitial ? ` ${booking.lastInitial}` : ''}`.trim();

  // Format booking data
  const serviceType = formatServiceType(booking.serviceType);
  const scheduledDate = formatDate(booking.preferredDate);
  const timeSlot = formatTimeSlot(booking.preferredTime);
  const serviceAddress = booking.address;

  // Check if this is a Jamaica (JMD) booking
  const isJamaica = booking.branchSlug === 'port-antonio' && booking.currency === 'JMD';
  
  // For Jamaica bookings, we'll send a custom message with payment details
  // For now, use the standard template but log payment info
  if (isJamaica && booking.totalAmount) {
    console.log(`Jamaica booking confirmation - Total: JMD $${booking.totalAmount.toLocaleString()}, Payment: Cash or Bank Transfer`);
  }

  // Send WhatsApp message
  const result = await sendWhatsAppTemplate({
    phoneNumberId,
    accessToken,
    to: booking.phone,
    templateName: 'customer_confirm_v3',
    languageCode: 'en_US',
    parameters: [
      clientName,       // Parameter 1: client_name
      serviceType,      // Parameter 2: service_type
      scheduledDate,    // Parameter 3: scheduled_date (YYYY-MM-DD)
      timeSlot,         // Parameter 4: time_slot (Morning/Afternoon/Evening)
      serviceAddress,   // Parameter 5: service_address
    ],
  });

  if (result.success) {
    console.log('WhatsApp confirmation sent to:', booking.phone);
    return {
      success: true,
      messageId: result.messageId,
    };
  } else {
    console.error('Customer confirmation WhatsApp failed:', result.error);
    return {
      success: false,
      error: result.error,
    };
  }
}

