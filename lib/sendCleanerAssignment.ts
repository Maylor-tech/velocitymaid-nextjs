/**
 * WhatsApp Cleaner Assignment Utility
 * 
 * Sends WhatsApp notification to cleaner when assigned to a job
 * Supports multi-branch routing and multiple cleaner assignments
 */

import { sendWhatsAppTemplate } from './whatsapp';
import { getCleanerList, formatLocation, getRegionLabel, isCleanerInRegion } from './whatsappRouter';

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

interface Cleaner {
  phone: string;
  name?: string;
}

interface Booking {
  customerName: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  serviceLocation?: string; // "new_jersey" or "vermont"
}

interface CleanerAssignmentResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BulkCleanerAssignmentResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: Array<{
    cleanerPhone: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

/**
 * Validate if cleaner belongs to the booking's service region
 * 
 * @param cleanerPhone - Cleaner phone number
 * @param serviceLocation - Service location: "new_jersey" or "vermont"
 * @returns Error message if invalid, null if valid
 */
export function validateCleanerRegion(cleanerPhone: string, serviceLocation: string | undefined | null): string | null {
  if (!serviceLocation || !cleanerPhone) {
    return 'Service location and cleaner phone are required';
  }

  if (!isCleanerInRegion(cleanerPhone, serviceLocation)) {
    const location = formatLocation(serviceLocation);
    return `Cleaner is not part of this service region (${location}). Please assign a cleaner from the ${location} team.`;
  }

  return null;
}

/**
 * Send WhatsApp cleaner assignment message to a single cleaner
 * 
 * @param phoneNumberId - WhatsApp Business Phone Number ID
 * @param accessToken - WhatsApp API Access Token
 * @param cleaner - Cleaner object with phone and optional name
 * @param booking - Booking data
 * @returns Result with success status
 */
export async function sendCleanerAssignment(
  phoneNumberId: string,
  accessToken: string,
  cleaner: Cleaner,
  booking: Booking
): Promise<CleanerAssignmentResult> {
  // Validate required fields
  if (!cleaner.phone || !booking.customerName || !booking.serviceType || !booking.preferredDate || !booking.address) {
    return {
      success: false,
      error: 'Missing required fields: cleaner.phone, booking.customerName, booking.serviceType, booking.preferredDate, and booking.address are required',
    };
  }

  // Format booking data
  const clientName = booking.customerName;
  const serviceType = formatServiceType(booking.serviceType);
  const scheduledDate = formatDate(booking.preferredDate);
  const timeSlot = formatTimeSlot(booking.preferredTime);
  const serviceAddress = booking.address;

  // Send WhatsApp message
  const result = await sendWhatsAppTemplate({
    phoneNumberId,
    accessToken,
    to: cleaner.phone,
    templateName: 'cleaner_job_v3',
    languageCode: 'en_US',
    parameters: [
      clientName,      // Parameter 1: client_name
      serviceType,     // Parameter 2: service_type
      scheduledDate,   // Parameter 3: scheduled_date (YYYY-MM-DD)
      timeSlot,        // Parameter 4: time_slot (Morning/Afternoon/Evening)
      serviceAddress,  // Parameter 5: service_address
    ],
  });

  const regionLabel = getRegionLabel(booking.serviceLocation);

  if (result.success) {
    console.log(`Cleaner notified [${regionLabel}]:`, cleaner.name || 'Cleaner', cleaner.phone);
    console.log('Cleaner assignment sent successfully:', {
      messageId: result.messageId,
      cleanerName: cleaner.name,
      cleanerPhone: cleaner.phone,
      customerName: clientName,
      serviceType,
      scheduledDate,
      region: regionLabel,
    });
    return {
      success: true,
      messageId: result.messageId,
    };
  } else {
    console.error(`Cleaner assignment failed [${regionLabel}]:`, {
      error: result.error,
      cleanerName: cleaner.name,
      cleanerPhone: cleaner.phone,
      customerName: clientName,
      region: regionLabel,
    });
    return {
      success: false,
      error: result.error,
    };
  }
}

/**
 * Send WhatsApp cleaner assignment to all cleaners in the booking's region
 * 
 * @param phoneNumberId - WhatsApp Business Phone Number ID
 * @param accessToken - WhatsApp API Access Token
 * @param booking - Booking data (includes serviceLocation)
 * @returns Bulk assignment result
 */
export async function sendCleanerAssignmentToRegion(
  phoneNumberId: string,
  accessToken: string,
  booking: Booking
): Promise<BulkCleanerAssignmentResult> {
  const cleaners = getCleanerList(booking.serviceLocation);
  const regionLabel = getRegionLabel(booking.serviceLocation);

  if (cleaners.length === 0) {
    console.warn(`No cleaners configured for ${regionLabel}`);
    return {
      success: false,
      totalSent: 0,
      totalFailed: 0,
      results: [],
    };
  }

  console.log(`Sending assignment to ${cleaners.length} cleaner(s) in ${regionLabel}`);

  const results: Array<{
    cleanerPhone: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }> = [];

  let totalSent = 0;
  let totalFailed = 0;

  // Send to each cleaner in the region
  for (const cleanerPhone of cleaners) {
    try {
      const result = await sendCleanerAssignment(
        phoneNumberId,
        accessToken,
        {
          phone: cleanerPhone,
          name: undefined,
        },
        booking
      );

      if (result.success) {
        totalSent++;
        results.push({
          cleanerPhone,
          success: true,
          messageId: result.messageId,
        });
      } else {
        totalFailed++;
        results.push({
          cleanerPhone,
          success: false,
          error: result.error,
        });
      }

      // Rate limiting: Wait 1 second between messages
      if (cleaners.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      totalFailed++;
      results.push({
        cleanerPhone,
        success: false,
        error: error.message || 'Unknown error',
      });
    }
  }

  console.log(`Bulk assignment completed [${regionLabel}]: ${totalSent} sent, ${totalFailed} failed`);

  return {
    success: totalSent > 0,
    totalSent,
    totalFailed,
    results,
  };
}

