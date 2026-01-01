export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * After-Hours WhatsApp Auto-Response
 * POST /api/automations/after-hours/whatsapp
 * 
 * Sends automated after-hours response based on lead tier and context
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { isAfterHours, getTimeUntilMorningFormatted } from '@/lib/time/isAfterHours';
import { 
  getAfterHoursMessage, 
  determineMessageType,
  type MessageType 
} from '@/config/afterHoursMessages';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, phone, leadName } = body;

    if (!leadId && !phone) {
      return NextResponse.json(
        { success: false, error: 'Lead ID or phone number is required' },
        { status: 400 }
      );
    }

    // Check if after-hours
    if (!isAfterHours()) {
      return NextResponse.json({
        success: false,
        error: 'Not after-hours. Use standard messaging.',
        isAfterHours: false,
      });
    }

    // Get lead data
    let lead = null;
    if (leadId) {
      lead = await prisma.lead.findUnique({
        where: { id: leadId },
      });
    } else if (phone) {
      lead = await prisma.lead.findFirst({
        where: { phone },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Determine message type
    const messageType = determineMessageType({
      leadTier: lead.leadTier,
      urgency: lead.urgency || undefined,
      zip: lead.zip || undefined,
      bedrooms: lead.bedrooms || undefined,
      previousService: lead.previousService,
      referralSource: lead.referralSource || undefined,
      riskFlags: lead.riskFlags || [],
    });

    // Get time until morning
    const timeUntilMorning = getTimeUntilMorningFormatted();

    // Generate message
    const message = getAfterHoursMessage(
      messageType,
      leadName || lead.name,
      timeUntilMorning
    );

    // Send WhatsApp message
    const phoneNumber = phone || lead.phone;
    const result = await sendWhatsAppMessage(phoneNumber, message);

    if (result.success) {
      // Update lead
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          waitForMorning: true,
          afterHoursMessage: message,
          status: 'ACTIVE', // Move to active while waiting
        },
      });

      // Log message in lead history (if you have a history table)
      // For now, we store it in afterHoursMessage field

      return NextResponse.json({
        success: true,
        message: 'After-hours auto-response sent',
        messageId: result.messageId,
        messageType,
        waitForMorning: true,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send WhatsApp message',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('After-hours WhatsApp error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send after-hours message' },
      { status: 500 }
    );
  }
}

/**
 * Check if after-hours (GET endpoint for testing)
 */
export async function GET(request: NextRequest) {
  const isAfterHoursNow = isAfterHours();
  const timeUntilMorning = getTimeUntilMorningFormatted();
  
  return NextResponse.json({
    isAfterHours: isAfterHoursNow,
    timeUntilMorning,
    currentTime: new Date().toISOString(),
  });
}

