/**
 * Send Review Request WhatsApp Message
 * POST /api/automations/reviews/send-whatsapp
 * 
 * Sends WhatsApp message requesting review after job completion
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, jobId, messageType, branchSlug } = body;

    if (!customerId || !jobId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and Job ID are required' },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
      },
    });

    if (!customer || !customer.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer or phone number not found' },
        { status: 404 }
      );
    }

    // Get job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Branch-aware: Only send for New Jersey
    const branch = branchSlug || customer.branch?.slug || 'new-jersey';
    if (branch !== 'new-jersey') {
      return NextResponse.json({
        success: true,
        message: 'Review requests only sent for New Jersey branch',
      });
    }

    const reviewUrl = `https://velocitymaid.com/review-us/new-jersey`;

    // Generate message based on type
    let message = '';
    if (messageType === 'initial') {
      message = `Hi ${customer.firstName}! 👋

We hope you're happy with your recent cleaning from VelocityMaid!

Your feedback means the world to us. Would you mind leaving a quick review?

${reviewUrl}

Thank you so much! 🙏`;
    } else if (messageType === 'followup') {
      message = `Hey ${customer.firstName}! 

Just a friendly reminder - we'd love to hear about your experience with VelocityMaid!

Leave a review: ${reviewUrl}

Your feedback helps us serve you better! ⭐`;
    } else {
      message = `Hi ${customer.firstName}! 

Thank you for choosing VelocityMaid! We'd appreciate your feedback:

${reviewUrl}

Thanks! 🙏`;
    }

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(customer.phone, message);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Review request sent',
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send WhatsApp message',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Send review request WhatsApp error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send review request' },
      { status: 500 }
    );
  }
}

