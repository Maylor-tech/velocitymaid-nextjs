/**
 * Send Weekly Incentive Summary to Cleaner
 * 
 * Sends WhatsApp message to cleaner with their weekly performance and bonus
 */

import { sendWhatsAppTemplate } from './whatsapp';

interface WeeklyIncentiveSummaryParams {
  cleanerId: string;
  cleanerName: string;
  cleanerPhone: string;
  tier: string;
  totalJobs: number;
  bonusAmount: number;
}

interface WeeklyIncentiveSummaryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send weekly incentive summary to cleaner
 */
export async function sendWeeklyIncentiveSummary({
  cleanerId,
  cleanerName,
  cleanerPhone,
  tier,
  totalJobs,
  bonusAmount,
}: WeeklyIncentiveSummaryParams): Promise<WeeklyIncentiveSummaryResult> {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !whatsappPhoneNumberId) {
    console.warn('WhatsApp credentials not configured - skipping incentive summary');
    return {
      success: false,
      error: 'WhatsApp credentials not configured',
    };
  }

  if (!cleanerPhone) {
    return {
      success: false,
      error: 'Cleaner phone number is required',
    };
  }

  // Format bonus amount
  const formattedBonus = `$${bonusAmount.toFixed(2)}`;

  // Send WhatsApp template message
  // Template: "weekly_incentive_summary_v1"
  // Parameters: [cleaner_name, tier, total_jobs, bonus_amount]
  
  const result = await sendWhatsAppTemplate({
    phoneNumberId: whatsappPhoneNumberId,
    accessToken: whatsappToken,
    to: cleanerPhone,
    templateName: 'weekly_incentive_summary_v1',
    languageCode: 'en_US',
    parameters: [
      cleanerName,
      tier,
      totalJobs.toString(),
      formattedBonus,
    ],
  });

  if (result.success) {
    console.log('Weekly incentive summary sent successfully:', {
      messageId: result.messageId,
      cleanerPhone,
      cleanerId,
    });
    return {
      success: true,
      messageId: result.messageId,
    };
  } else {
    console.error('Failed to send weekly incentive summary:', result.error);
    return {
      success: false,
      error: result.error,
    };
  }
}



