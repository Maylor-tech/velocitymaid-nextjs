/**
 * Update Villa Application Status
 * POST /api/admin/villas/[id]/status
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['NEW', 'CONTACTED', 'TRIAL', 'ACTIVE', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const application = await prisma.villaPartnerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update status
    const updated = await prisma.villaPartnerApplication.update({
      where: { id },
      data: { status },
    });

    // Send WhatsApp message based on status (non-blocking)
    try {
      if (status === 'TRIAL') {
        const message = `We are ready for your trial clean! 🧹\n\nPlease send us your preferred date and time, and we'll schedule your trial cleaning service.\n\nWe're excited to show you the VelocityMaid difference!`;
        await sendWhatsAppMessage(application.whatsapp, message);
      } else if (status === 'ACTIVE') {
        const message = `Welcome to our Villa Partnership Program! 🎉\n\nYour villa "${application.propertyName}" now receives priority service and dedicated support from our team.\n\nYou'll receive:\n✅ Priority scheduling\n✅ Dedicated account manager\n✅ Regular quality checks\n✅ 24/7 WhatsApp support\n\nWe're here to make your villa management effortless!`;
        await sendWhatsAppMessage(application.whatsapp, message);
      }
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp message:', whatsappError);
      // Don't fail the status update if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      application: updated,
    });
  } catch (error: any) {
    console.error('Update villa application status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}


