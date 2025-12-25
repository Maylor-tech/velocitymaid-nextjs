export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCleaner } from '@/lib/cleanerAuth';
import { prisma } from '@/lib/prisma';

/**
 * Get Cleaner Payment Method Status
 * 
 * GET /api/cleaners/payment-method/status
 * 
 * Returns: { success: true, verified: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedCleaner(request);

    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if cleaner has a verified payment method
    const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
      where: {
        cleanerId: authResult.cleanerId,
        isActive: true,
        verifiedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        verifiedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      verified: !!paymentMethod,
    });
  } catch (error: any) {
    console.error('Get payment method status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get payment method status' },
      { status: 500 }
    );
  }
}












