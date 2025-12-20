/**
 * After-Hours Auto-Response Message Templates
 * 
 * Tiered messages for different lead scenarios
 */

export interface AfterHoursMessageTemplate {
  title: string;
  message: string;
}

export type MessageType = 
  | 'general'
  | 'high-value'
  | 'same-day-request'
  | 'risky-zip'
  | 'large-clean'
  | 'price-shopper'
  | 'complaint'
  | 'referral'
  | 'emergency';

/**
 * Get after-hours message template based on type
 */
export function getAfterHoursMessage(
  type: MessageType,
  leadName?: string,
  hoursUntilMorning?: string
): string {
  const name = leadName || 'there';
  const timeUntilMorning = hoursUntilMorning || 'a few hours';
  
  const templates: Record<MessageType, string> = {
    general: `Hi ${name}! 👋

Thanks for reaching out to VelocityMaid New Jersey!

We're currently outside our regular business hours (8am-8pm EST), but we've received your message and will get back to you first thing in the morning (around 8:30am EST).

In the meantime, you can:
📅 Book online: https://velocitymaid.com/booking?branch=new-jersey
💬 Leave your preferred date/time and we'll confirm ASAP

We'll be in touch in ${timeUntilMorning}! 🌅`,
    
    'high-value': `Hi ${name}! 👋

Thank you for your interest in VelocityMaid New Jersey!

We've received your inquiry and noticed you're looking for premium service. Our team is currently offline, but we'll prioritize your request and reach out first thing tomorrow morning (around 8:30am EST).

As a high-value customer, we can offer:
✨ Priority scheduling
✨ Preferred cleaner assignment
✨ Special pricing for your area

We'll contact you in ${timeUntilMorning} to discuss your needs! 🌅`,
    
    'same-day-request': `Hi ${name}! 👋

Thanks for reaching out! We see you're looking for same-day service.

We're currently outside business hours (8am-8pm EST), but we'll check availability first thing tomorrow morning (8:30am EST) and get back to you immediately.

For urgent requests, please call our emergency line: (555) 123-4567

Otherwise, we'll be in touch in ${timeUntilMorning}! 🌅`,
    
    'risky-zip': `Hi ${name}! 👋

Thank you for contacting VelocityMaid New Jersey!

We've received your message and will review your request when our team returns at 8:30am EST tomorrow.

For service in your area, we may require a deposit to secure your booking. We'll discuss this with you tomorrow morning.

We'll be in touch in ${timeUntilMorning}! 🌅`,
    
    'large-clean': `Hi ${name}! 👋

Thanks for reaching out about your large cleaning project!

We're currently offline, but we've received your details and will prepare a custom quote for you. Our team will reach out first thing tomorrow morning (8:30am EST) with pricing and availability.

For large projects, we offer:
📋 Custom pricing
👥 Team assignments
📅 Flexible scheduling

We'll contact you in ${timeUntilMorning}! 🌅`,
    
    'price-shopper': `Hi ${name}! 👋

Thank you for your interest in VelocityMaid New Jersey!

We've received your inquiry and will send you our competitive pricing when our team returns tomorrow morning (8:30am EST).

Our flat-rate pricing means:
✅ No hidden fees
✅ Transparent costs
✅ Quality guaranteed

We'll be in touch in ${timeUntilMorning} with pricing details! 🌅`,
    
    complaint: `Hi ${name},

Thank you for reaching out. We take all concerns seriously.

We're currently outside business hours, but we've received your message and will address your concern first thing tomorrow morning (8:30am EST).

Our team will review your case and contact you to resolve this matter.

We apologize for any inconvenience and appreciate your patience.

We'll be in touch in ${timeUntilMorning}.`,
    
    referral: `Hi ${name}! 👋

Thanks for referring VelocityMaid New Jersey!

We're currently offline, but we've received your referral and will process it when our team returns tomorrow morning (8:30am EST).

As a thank you, you'll receive:
🎁 $20 credit for each successful referral
💰 Bonus when your friend books

We'll be in touch in ${timeUntilMorning} to confirm! 🌅`,
    
    emergency: `Hi ${name},

We've received your urgent request. While we're currently outside regular hours, we understand this is time-sensitive.

For immediate assistance, please call our emergency line:
📞 (555) 123-4567

Our on-call team will do their best to assist you.

Otherwise, we'll prioritize your request and contact you first thing tomorrow morning (8:30am EST).

We'll be in touch in ${timeUntilMorning}.`,
  };
  
  return templates[type] || templates.general;
}

/**
 * Determine message type based on lead data
 */
export function determineMessageType(lead: {
  leadTier?: string;
  urgency?: string;
  zip?: string | null;
  bedrooms?: number | null;
  previousService?: boolean;
  referralSource?: string | null;
  riskFlags?: string[];
}): MessageType {
  // Emergency or same-day request
  if (lead.urgency === 'asap' || lead.urgency === 'this_week') {
    return 'same-day-request';
  }
  
  // High-value (Tier A)
  if (lead.leadTier === 'A') {
    return 'high-value';
  }
  
  // Risky ZIP
  if (lead.riskFlags && lead.riskFlags.includes('risk_zip')) {
    return 'risky-zip';
  }
  
  // Large clean (4+ bedrooms)
  if (lead.bedrooms && lead.bedrooms >= 4) {
    return 'large-clean';
  }
  
  // Price shopper (low urgency, exploring)
  if (lead.urgency === 'exploring') {
    return 'price-shopper';
  }
  
  // Referral
  if (lead.referralSource === 'referral') {
    return 'referral';
  }
  
  // Default to general
  return 'general';
}

/**
 * Get morning follow-up message
 */
export function getMorningFollowUpMessage(leadName?: string): string {
  const name = leadName || 'there';
  
  return `Good morning ${name}! ☀️

This is VelocityMaid New Jersey following up on your inquiry from last night.

We're here to help with your cleaning needs! Would you like to:
📅 Schedule a cleaning
💰 Get a quote
💬 Ask questions

Reply to this message or call us at (555) 123-4567.

We're ready to serve you! 🧹✨`;
}


