export const dynamic = 'force-dynamic';

/**
 * Send Review Request SMS Message
 * POST /api/automations/reviews/send-sms
 * 
 * Sends SMS message requesting review after job completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Branch-aware: Only send for New Jersey
    const branch = branchSlug || customer.branch?.slug || 'new-jersey';
    if (branch !== 'new-jersey') {
      return NextResponse.json({
        success: true,
        message: 'Review requests only sent for New Jersey branch',
      });
    }

    const reviewUrl = `https://velocitymaid.com/review-us/new-jersey`;

    // Generate message (shorter for SMS)
    let message = '';
    if (messageType === 'initial') {
      message = `Hi ${customer.firstName}! Hope you're happy with your cleaning! Leave a review: ${reviewUrl} Thank you!`;
    } else {
      message = `Hey ${customer.firstName}! We'd love your feedback: ${reviewUrl} Thanks!`;
    }

    // SMS sending would go here (integrate with SMS service like Twilio)
    // For now, log it
    console.log('SMS message (would send):', {
      to: customer.phone,
      message,
    });

    return NextResponse.json({
      success: true,
      message: 'SMS review request queued',
    });
  } catch (error: any) {
    console.error('Send review request SMS error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send SMS review request' },
      { status: 500 }
    );
  }
}

