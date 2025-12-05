export const dynamic = 'force-dynamic';

/**
 * Get Referral Balance API
 * GET /api/referrals/get-balance?customerId={id}
 * 
 * Returns customer's referral credit balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Get all pending and applied credits
    const credits = await prisma.referralCredit.findMany({
      where: {
        customerId,
        status: {
          in: ['PENDING', 'APPLIED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total balance
    const totalBalance = credits
      .filter(c => c.status === 'PENDING')
      .reduce((sum, credit) => sum + Number(credit.amount), 0);

    // Get referral link
    const referralLink = await prisma.referralLink.findFirst({
      where: {
        customerId,
        isActive: true,
      },
      include: {
        branch: true,
      },
    });

    // Get referral stats
    const totalReferrals = await prisma.referralEvent.count({
      where: {
        referrerId: customerId,
        status: 'COMPLETED',
      },
    });

    const pendingReferrals = await prisma.referralEvent.count({
      where: {
        referrerId: customerId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      balance: {
        total: totalBalance,
        pending: totalBalance,
        applied: credits.filter(c => c.status === 'APPLIED').reduce((sum, c) => sum + Number(c.amount), 0),
      },
      referralLink: referralLink ? {
        code: referralLink.code,
        url: `https://velocitymaid.com/ref/${referralLink.code}`,
      } : null,
      stats: {
        totalReferrals,
        pendingReferrals,
        totalCredits: credits.length,
      },
      credits: credits.map(c => ({
        id: c.id,
        amount: Number(c.amount),
        status: c.status,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Get referral balance error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get referral balance' },
      { status: 500 }
    );
  }
}

