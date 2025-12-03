/**
 * WhatsApp Admin Notification Utility
 * 
 * Sends WhatsApp notification to admin/manager when a new booking is created
 * Routes to correct state admin based on serviceLocation
 */

import { sendWhatsAppTemplate } from './whatsapp';
import { getAdminNumber, formatLocation, getRegionLabel } from './whatsappRouter';

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
 * Format payment amount as currency string
 */
function formatPaymentAmount(totalPrice: number): string {
  return `$${totalPrice.toFixed(2)}`;
}

interface BookingData {
  customerName: string;
  serviceType: string;
  totalPrice: number;
  address: string;
  preferredDate: string;
  serviceLocation?: string; // "new_jersey" or "vermont"
}

interface AdminNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp admin notification for new booking
 * Automatically routes to correct state admin based on serviceLocation
 * 
 * @param phoneNumberId - WhatsApp Business Phone Number ID
 * @param accessToken - WhatsApp API Access Token
 * @param booking - Booking data (includes serviceLocation for routing)
 * @param adminPhone - Optional admin phone (if not provided, uses routing)
 * @returns Result with success status
 */
export async function sendAdminNotification(
  phoneNumberId: string,
  accessToken: string,
  booking: BookingData,
  adminPhone?: string
): Promise<AdminNotificationResult> {
  // Validate required fields
  if (!booking.customerName || !booking.serviceType || !booking.address || !booking.preferredDate) {
    return {
      success: false,
      error: 'Missing required booking fields: customerName, serviceType, address, and preferredDate are required',
    };
  }

  // Get admin phone number based on service location (if not provided)
  const targetAdminPhone = adminPhone || getAdminNumber(booking.serviceLocation);
  const regionLabel = getRegionLabel(booking.serviceLocation);

  // Validate admin phone number
  if (!targetAdminPhone || targetAdminPhone.trim() === '') {
    const location = formatLocation(booking.serviceLocation);
    return {
      success: false,
      error: `Admin phone number not configured for ${location} (ADMIN_WHATSAPP_${booking.serviceLocation === 'vermont' ? 'VT' : 'NJ'} environment variable not set)`,
    };
  }

  // Format booking data
  const clientName = booking.customerName;
  const serviceType = formatServiceType(booking.serviceType);
  const paymentAmount = formatPaymentAmount(booking.totalPrice);
  const serviceAddress = booking.address;
  const scheduledDate = formatDate(booking.preferredDate);

  // Send WhatsApp message
  const result = await sendWhatsAppTemplate({
    phoneNumberId,
    accessToken,
    to: adminPhone || '',
    templateName: 'admin_notify_v3',
    languageCode: 'en_US',
    parameters: [
      clientName,      // Parameter 1: client_name
      serviceType,     // Parameter 2: service_type
      paymentAmount,   // Parameter 3: payment_amount
      serviceAddress,  // Parameter 4: service_address
      scheduledDate,   // Parameter 5: scheduled_date (YYYY-MM-DD)
    ],
  });

  if (result.success) {
    console.log(`Admin notification sent successfully [${regionLabel}]:`, {
      messageId: result.messageId,
      customerName: clientName,
      serviceType,
      paymentAmount,
      region: regionLabel,
      adminPhone: targetAdminPhone,
    });
    return {
      success: true,
      messageId: result.messageId,
    };
  } else {
    console.error(`Admin notification failed [${regionLabel}]:`, {
      error: result.error,
      customerName: clientName,
      region: regionLabel,
      adminPhone: targetAdminPhone,
    });
    return {
      success: false,
      error: result.error,
    };
  }
}

