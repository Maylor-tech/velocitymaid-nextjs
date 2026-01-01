/**
 * Reply Now - Send Morning Follow-Up Immediately
 * POST /api/admin/leads/[leadId]/reply-now
 * 
 * Manually triggers morning follow-up for a lead
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { getMorningFollowUpMessage } from '@/config/afterHoursMessages';

export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await request.json();
    const { branchId } = body;

    const lead = await prisma.lead.findUnique({
      where: { id: params.leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Generate morning follow-up message
    const message = getMorningFollowUpMessage(lead.name);

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(lead.phone, message);

    if (result.success) {
      // Update lead
      await prisma.lead.update({
        where: { id: params.leadId },
        data: {
          waitForMorning: false,
          status: 'ACTIVE',
          afterHoursMessage: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Morning follow-up sent',
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send WhatsApp message',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Reply now error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send follow-up' },
      { status: 500 }
    );
  }
}


