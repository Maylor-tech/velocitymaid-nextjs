/**
 * WhatsApp Templates for Jamaica Operations
 * 
 * Contains all message templates for Port Antonio branch
 */

import { sendWhatsAppMessage } from './whatsappService';

interface BookingConfirmationParams {
  phone: string;
  branch: string;
  service: string;
  date: string;
  price: number;
  currency: 'USD' | 'JMD';
}

/**
 * Send booking confirmation message
 * Different messages for Jamaica (JMD) vs USA (USD)
 */
export async function sendWhatsAppBookingConfirmation(
  params: BookingConfirmationParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phone, branch, service, date, price, currency } = params;
  
  const isJamaica = branch === 'port-antonio' || currency === 'JMD';
  
  let message: string;
  
  if (isJamaica) {
    // Jamaica booking confirmation
    message = `Your booking is confirmed! 🎉\n\n` +
      `Branch: Port Antonio\n` +
      `Service: ${service}\n` +
      `Date: ${date}\n` +
      `Total: JMD $${price.toLocaleString()}\n\n` +
      `We'll reach out shortly to finalize details.`;
  } else {
    // USA booking confirmation (Stripe handled separately)
    message = `Your booking is confirmed! 🎉\n\n` +
      `Service: ${service}\n` +
      `Date: ${date}\n` +
      `Total: $${price.toFixed(2)}\n\n` +
      `Payment will be processed via Stripe.`;
  }
  
  return sendWhatsAppMessage(phone, message);
}

/**
 * Send cleaner onboarding message
 */
export async function sendCleanerOnboardingMessage(
  phone: string,
  branchName: string = 'Port Antonio'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `Thanks for applying to VelocityMaid ${branchName}! 👷\n\n` +
    `Our team will review your information and contact you shortly.\n\n` +
    `In the meantime, please prepare:\n` +
    `• Government ID\n` +
    `• 2 references\n\n` +
    `We look forward to working with you!`;
  
  return sendWhatsAppMessage(phone, message);
}


