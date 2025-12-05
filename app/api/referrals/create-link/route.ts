export const dynamic = 'force-dynamic';

/**
 * Create Referral Link API
 * POST /api/referrals/create-link
 * 
 * Creates a referral link for a customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, branchId } = body;

    if (!customerId || !branchId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and Branch ID are required' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if referral link already exists
    const existingLink = await prisma.referralLink.findFirst({
      where: {
        customerId,
        branchId,
        isActive: true,
      },
    });

    if (existingLink) {
      return NextResponse.json({
        success: true,
        referralLink: {
          id: existingLink.id,
          code: existingLink.code,
          url: `https://velocitymaid.com/ref/${existingLink.code}`,
        },
      });
    }

    // Generate referral code (NJ-{customerId} or similar)
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    const branchPrefix = branch?.slug === 'new-jersey' ? 'NJ' : branch?.slug.toUpperCase().substring(0, 2) || 'VM';
    const code = `${branchPrefix}-${customerId.substring(0, 8).toUpperCase()}`;

    // Create referral link
    const referralLink = await prisma.referralLink.create({
      data: {
        customerId,
        branchId,
        code,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      referralLink: {
        id: referralLink.id,
        code: referralLink.code,
        url: `https://velocitymaid.com/ref/${referralLink.code}`,
      },
    });
  } catch (error: any) {
    console.error('Create referral link error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create referral link' },
      { status: 500 }
    );
  }
}

