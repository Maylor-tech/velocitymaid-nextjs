/**
 * Nurture Sequence Messages
 * 7-Day Customer Nurture Sequence for VelocityMaid New Jersey
 */

export interface NurtureMessage {
  day: number;
  message: string;
  includeBookingLink: boolean;
  includeReferralCode: boolean;
}

export function getNurtureMessage(
  day: number,
  customerName: string,
  referralCode?: string,
  branchSlug: string = 'new-jersey'
): string {
  const bookingUrl = referralCode
    ? `https://velocitymaid.com/booking?branch=${branchSlug}&ref=${referralCode}`
    : `https://velocitymaid.com/booking?branch=${branchSlug}`;

  const messages: Record<number, string> = {
    0: `Hi ${customerName}! 👋

Welcome to VelocityMaid New Jersey! We're excited to help you keep your home spotless.

Our professional cleaners are background-checked, insured, and ready to serve you.

Book your first cleaning today: ${bookingUrl}

Questions? Just reply to this message!`,

    1: `Hey ${customerName}! 🌟

Still thinking about booking? Here's what makes VelocityMaid different:

✅ Flat-rate pricing (no surprises)
✅ Background-checked cleaners
✅ 100% satisfaction guarantee
✅ Eco-friendly supplies

Book now: ${bookingUrl}`,

    2: `Hi ${customerName}! 💡

Did you know? Regular cleaning saves you 4+ hours per week!

Our customers love:
• Weekly/bi-weekly plans
• Move-in/out cleaning
• Deep cleaning services

See our services: ${bookingUrl}`,

    3: `Hey ${customerName}! 🎁

Special offer for new customers: Book your first cleaning and get $20 off when you refer a friend!

${referralCode ? `Your referral code: ${referralCode}\n\n` : ''}Book now: ${bookingUrl}`,

    4: `Hi ${customerName}! ⭐

We've helped hundreds of New Jersey families keep their homes clean.

Here's what customers say:
"Best cleaning service we've used!"
"Reliable and professional"
"Worth every penny"

Join them: ${bookingUrl}`,

    5: `Hey ${customerName}! 🏠

Life's too short to spend weekends cleaning!

Let VelocityMaid handle it:
• Kitchen deep clean
• Bathroom sanitization
• Living areas refreshed
• All rooms dusted & vacuumed

Book today: ${bookingUrl}`,

    6: `Hi ${customerName}! 🎯

Last chance! We're here to make your life easier.

Book your cleaning in 2 minutes:
${bookingUrl}

Or reply with any questions - we're here to help!`,

    7: `Hey ${customerName}! 👋

We hope you'll give VelocityMaid a try. We're committed to making your home shine!

Book anytime: ${bookingUrl}

Thanks for considering us! 🙏`,
  };

  return messages[day] || messages[0];
}

export function shouldStopSequence(customerReplied: boolean, leadStatus: string): boolean {
  // Stop if customer replied or if they've booked
  return customerReplied || leadStatus === 'BOOKED' || leadStatus === 'CLOSED';
}

