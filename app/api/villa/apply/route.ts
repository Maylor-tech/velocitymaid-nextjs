export const dynamic = 'force-dynamic';

/**
 * Villa Partnership Application API
 * POST /api/villa/apply
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      propertyName,
      managerName,
      whatsapp,
      bedrooms,
      bathrooms,
      turnoverFrequency,
      needsInventory,
      needsLinenService,
      notes,
    } = body;

    // Basic validation
    if (!propertyName || !managerName || !whatsapp || !bedrooms || !bathrooms || !turnoverFrequency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.villaPartnerApplication.create({
      data: {
        propertyName,
        managerName,
        whatsapp,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        turnoverFrequency,
        needsInventory: needsInventory || false,
        needsLinenService: needsLinenService || false,
        notes: notes || null,
        status: 'NEW',
      },
    });

    // Send WhatsApp message (non-blocking)
    try {
      const brochureUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com'}/villa-partnership/brochure`;
      const message = `Thanks for requesting a Villa Partnership with VelocityMaid Jamaica! 🏖️\n\nWe received your details for ${propertyName}. Our team will review your application and contact you within 24-48 hours.\n\nDownload the partnership guide here:\n${brochureUrl}\n\nQuestions? Reply to this message!`;
      await sendWhatsAppMessage(whatsapp, message);
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp message:', whatsappError);
      // Don't fail the application if WhatsApp fails
    }

    return NextResponse.json({
      success: true,
      application,
      message: 'Application submitted successfully',
    });
  } catch (error: any) {
    console.error('Villa application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}

