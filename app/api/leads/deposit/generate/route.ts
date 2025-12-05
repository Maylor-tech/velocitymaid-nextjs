export const dynamic = 'force-dynamic';

/**
 * Generate Deposit URL for Tier C Leads
 * POST /api/leads/deposit/generate
 * 
 * Creates a deposit payment link for Tier C leads
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Get lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Only generate for Tier C leads
    if (lead.leadTier !== 'C') {
      return NextResponse.json(
        { success: false, error: 'Deposit only required for Tier C leads' },
        { status: 400 }
      );
    }

    // Generate deposit URL (in production, create Stripe checkout session)
    const depositAmount = 50; // $50 deposit for Tier C
    const depositUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com'}/leads/deposit/${leadId}?amount=${depositAmount}`;

    // Update lead with deposit URL
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        depositUrl,
        status: 'ACTIVE', // Move to active while waiting for deposit
      },
    });

    return NextResponse.json({
      success: true,
      depositUrl,
      depositAmount,
      message: 'Deposit URL generated',
    });
  } catch (error: any) {
    console.error('Generate deposit URL error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate deposit URL' },
      { status: 500 }
    );
  }
}

