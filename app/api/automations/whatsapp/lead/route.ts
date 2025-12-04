/**
 * WhatsApp Auto-Response for Leads
 * POST /api/automations/whatsapp/lead
 * 
 * Sends tiered WhatsApp response based on lead score
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { isAfterHours } from '@/lib/time/isAfterHours';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Get lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { branch: true },
    });

    if (!lead || !lead.phone) {
      return NextResponse.json(
        { success: false, error: 'Lead not found or no phone number' },
        { status: 404 }
      );
    }

    // Branch-aware: Only send for New Jersey
    if (lead.branch.slug !== 'new-jersey') {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp auto-response only for New Jersey branch',
      });
    }

    // Check if after-hours - if so, use after-hours automation
    if (isAfterHours()) {
      try {
        const afterHoursResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/after-hours/whatsapp`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: lead.id,
              phone: lead.phone,
              leadName: lead.name,
            }),
          }
        );

        const afterHoursData = await afterHoursResponse.json();
        if (afterHoursData.success) {
          return NextResponse.json({
            success: true,
            message: 'After-hours auto-response sent',
            isAfterHours: true,
            messageId: afterHoursData.messageId,
          });
        }
      } catch (error) {
        console.error('Failed to send after-hours message:', error);
        // Fall through to standard message
      }
    }

    let message = '';

    // Tier A: High-value script
    if (lead.leadTier === 'A') {
      message = `Hi ${lead.name}! 👋

Thank you for your interest in VelocityMaid New Jersey!

We'd love to help you with your cleaning needs. Based on your information, we can offer you:

✨ Priority scheduling
✨ Preferred cleaner assignment
✨ Special pricing for your area

Would you like to schedule a free consultation or book directly?

Book now: https://velocitymaid.com/booking?branch=new-jersey

Or reply to this message and we'll get you set up! 🎉`;
    }
    // Tier B: Medium-value script
    else if (lead.leadTier === 'B') {
      message = `Hi ${lead.name}! 👋

Thanks for reaching out to VelocityMaid New Jersey!

We're here to help make your home sparkle. Our professional cleaners are background-checked, insured, and ready to serve you.

Would you like to learn more about our services or book a cleaning?

Book now: https://velocitymaid.com/booking?branch=new-jersey

Reply to this message if you have any questions! 😊`;
    }
    // Tier C: Deposit-required script
    else {
      message = `Hi ${lead.name}! 👋

Thank you for your interest in VelocityMaid New Jersey!

To secure your booking and ensure we can serve you, we require a small deposit. This helps us:

✅ Reserve your preferred time slot
✅ Assign the best cleaner for your needs
✅ Guarantee service quality

Secure your booking: ${lead.depositUrl || 'https://velocitymaid.com/booking?branch=new-jersey'}

Reply to this message if you have questions! 🙏`;
    }

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(lead.phone, message);

    if (result.success) {
      // Update lead status
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: 'ACTIVE' },
      });

      return NextResponse.json({
        success: true,
        message: 'WhatsApp auto-response sent',
        messageId: result.messageId,
        tier: lead.leadTier,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send WhatsApp message',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('WhatsApp lead auto-response error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send auto-response' },
      { status: 500 }
    );
  }
}

