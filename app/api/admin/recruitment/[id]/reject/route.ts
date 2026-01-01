/**
 * Reject Application API
 * POST /api/admin/recruitment/[id]/reject
 * 
 * Rejects an application and sends WhatsApp message
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
    // TODO: Add admin authentication check

    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    const application = await prisma.cleanerApplication.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            slug: true,
            country: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update status
    await prisma.cleanerApplication.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    // Send WhatsApp rejection message (Jamaica only)
    const isJamaicaBranch =
      application.branch.country === 'Jamaica' ||
      application.branch.country === 'JM' ||
      application.branch.slug === 'port-antonio';

    if (isJamaicaBranch && (application.whatsappNumber || application.phone)) {
      const whatsappPhone = application.whatsappNumber || application.phone;
      const rejectionMessage = `Thank you for your interest in joining VelocityMaid.\n\nAfter careful review, we've decided not to move forward with your application at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nWe appreciate your interest and wish you the best in your job search.`;
      
      try {
        await sendWhatsAppMessage(whatsappPhone, rejectionMessage);
      } catch (whatsappError) {
        console.error('Failed to send rejection WhatsApp:', whatsappError);
        // Don't fail the rejection if WhatsApp fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Application rejected successfully',
    });
  } catch (error: any) {
    console.error('Reject application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject application' },
      { status: 500 }
    );
  }
}


