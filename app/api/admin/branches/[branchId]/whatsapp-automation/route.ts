import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * WhatsApp Automation API
 * 
 * GET /api/admin/branches/[slug]/whatsapp-automation - Get automation config
 * PUT /api/admin/branches/[slug]/whatsapp-automation - Update automation config
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;
    const branch = await prisma.branch.findUnique({
      where: { slug },
    });
    
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    const config = await prisma.branchAutomationConfig.findUnique({
      where: { branchId: branch.id },
    });
    
    return NextResponse.json({
      success: true,
      config: config || null,
    });
  } catch (error: any) {
    console.error('Get WhatsApp automation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch automation config' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { branchId: string } }
) {
  try {
    const { branchId } = params;
    // branchId is actually a slug in this context
    const slug = branchId;
    const body = await request.json();

    const branch = await prisma.branch.findUnique({
      where: { slug },
    });
    
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      );
    }

    // Update or create automation config
    const config = await prisma.branchAutomationConfig.upsert({
      where: { branchId: branch.id },
      create: {
        branchId: branch.id,
        bookingWebhookUrl: body.bookingWebhookUrl || null,
        reminderWebhookUrl: body.reminderWebhookUrl || null,
        reviewWebhookUrl: body.reviewWebhookUrl || null,
        whatsappTemplateBooking: body.whatsappTemplateBooking || null,
        whatsappTemplateReminder: body.whatsappTemplateReminder || null,
        whatsappTemplateReview: body.whatsappTemplateReview || null,
      },
      update: {
        bookingWebhookUrl: body.bookingWebhookUrl !== undefined ? (body.bookingWebhookUrl || null) : undefined,
        reminderWebhookUrl: body.reminderWebhookUrl !== undefined ? (body.reminderWebhookUrl || null) : undefined,
        reviewWebhookUrl: body.reviewWebhookUrl !== undefined ? (body.reviewWebhookUrl || null) : undefined,
        whatsappTemplateBooking: body.whatsappTemplateBooking !== undefined ? (body.whatsappTemplateBooking || null) : undefined,
        whatsappTemplateReminder: body.whatsappTemplateReminder !== undefined ? (body.whatsappTemplateReminder || null) : undefined,
        whatsappTemplateReview: body.whatsappTemplateReview !== undefined ? (body.whatsappTemplateReview || null) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      config,
      message: 'WhatsApp automation settings saved',
    });
  } catch (error: any) {
    console.error('Update WhatsApp automation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update automation config' },
      { status: 500 }
    );
  }
}

