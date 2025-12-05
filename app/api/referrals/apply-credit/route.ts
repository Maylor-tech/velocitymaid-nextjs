export const dynamic = 'force-dynamic';

/**
 * Apply Referral Credit API
 * POST /api/referrals/apply-credit
 * 
 * Applies a referral credit to a booking
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, jobId, creditId } = body;

    if (!customerId || !jobId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and Job ID are required' },
        { status: 400 }
      );
    }

    // Get customer's available credits
    const credits = await prisma.referralCredit.findMany({
      where: {
        customerId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (credits.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No available referral credits' },
        { status: 400 }
      );
    }

    // Use specific credit if provided, otherwise use first available
    const creditToApply = creditId
      ? credits.find(c => c.id === creditId)
      : credits[0];

    if (!creditToApply) {
      return NextResponse.json(
        { success: false, error: 'Credit not found' },
        { status: 404 }
      );
    }

    // Get job to update
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Apply credit
    const creditAmount = Number(creditToApply.amount);
    const currentPrice = Number(job.totalPrice || 0);
    const newPrice = Math.max(0, currentPrice - creditAmount);

    // Update job price
    await prisma.job.update({
      where: { id: jobId },
      data: {
        totalPrice: newPrice,
      },
    });

    // Mark credit as applied
    await prisma.referralCredit.update({
      where: { id: creditToApply.id },
      data: {
        status: 'APPLIED',
        appliedToJobId: jobId,
      },
    });

    return NextResponse.json({
      success: true,
      creditApplied: {
        amount: creditAmount,
        originalPrice: currentPrice,
        newPrice: newPrice,
      },
    });
  } catch (error: any) {
    console.error('Apply referral credit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to apply referral credit' },
      { status: 500 }
    );
  }
}

