export const dynamic = 'force-dynamic';

/**
 * Corporate Quote Request API
 * POST /api/corporate/request-quote
 * 
 * Stores corporate quote requests and sends notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      businessName,
      businessType,
      squareFootage,
      cleaningFrequency,
      branch,
    } = body;

    // Validations
    if (!name || !email || !phone || !businessName || !businessType || !squareFootage || !cleaningFrequency) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Branch-aware: Only process NJ requests
    if (branch !== 'new-jersey') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is for New Jersey corporate services only' },
        { status: 400 }
      );
    }

    // Store quote request (in production, save to database)
    // For now, log it and send notifications
    const quoteRequest = {
      name,
      email,
      phone,
      businessName,
      businessType,
      squareFootage,
      cleaningFrequency,
      branch: 'new-jersey',
      createdAt: new Date().toISOString(),
    };

    console.log('Corporate quote request received:', quoteRequest);

    // In production, save to database:
    // await prisma.corporateQuoteRequest.create({
    //   data: {
    //     name,
    //     email,
    //     phone,
    //     businessName,
    //     businessType,
    //     squareFootage: parseInt(squareFootage),
    //     cleaningFrequency,
    //     branchId: branchId,
    //     status: 'NEW',
    //   },
    // });

    // Send confirmation email (placeholder - integrate with email service)
    console.log('Confirmation email (would send):', {
      to: email,
      subject: 'Thank you for your corporate cleaning quote request',
      body: `Hi ${name},\n\nThank you for requesting a quote from VelocityMaid New Jersey. We'll contact you within 24 hours.\n\nBest regards,\nVelocityMaid Team`,
    });

    // Notify admin (placeholder - integrate with notification service)
    console.log('Admin notification (would send):', {
      type: 'corporate_quote_request',
      data: quoteRequest,
    });

    // In production, send via email/webhook:
    // await fetch(process.env.ADMIN_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     type: 'corporate_quote_request',
    //     data: quoteRequest,
    //   }),
    // });

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted successfully',
      quoteRequest: {
        id: `quote_${Date.now()}`,
        ...quoteRequest,
      },
    });
  } catch (error: any) {
    console.error('Corporate quote request error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit quote request' },
      { status: 500 }
    );
  }
}

