export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stop Nurture Sequence on Customer Reply
 * POST /api/webhooks/whatsapp/stop-nurture
 * 
 * Called when customer replies to WhatsApp message
 * Stops all future nurture messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, customerId } = body;

    if (!phone && !customerId) {
      return NextResponse.json(
        { success: false, error: 'Phone number or Customer ID is required' },
        { status: 400 }
      );
    }

    // Find customer by phone or ID
    let customer;
    if (customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { nurtureSequence: true },
      });
    } else {
      customer = await prisma.customer.findFirst({
        where: { phone },
        include: { nurtureSequence: true },
      });
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Stop nurture sequence if active
    if (customer.nurtureSequence && customer.nurtureSequence.isActive) {
      await prisma.nurtureSequence.update({
        where: { id: customer.nurtureSequence.id },
        data: {
          isActive: false,
          pausedAt: new Date(),
        },
      });

      // Mark any pending messages as stopped
      await prisma.nurtureHistory.updateMany({
        where: {
          nurtureSequenceId: customer.nurtureSequence.id,
          status: 'PENDING',
        },
        data: {
          status: 'STOPPED',
        },
      });
    }

    // Update customer status to ACTIVE (they're engaging)
    if (customer.leadStatus === 'NEW') {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { leadStatus: 'ACTIVE' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Nurture sequence stopped',
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error('Stop nurture sequence error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to stop nurture sequence' },
      { status: 500 }
    );
  }
}

