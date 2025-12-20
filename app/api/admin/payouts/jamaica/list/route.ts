export const dynamic = 'force-dynamic'

/**
 * List Jamaica Payouts API
 * GET /api/admin/payouts/jamaica/list?branchId=xxx&status=xxx
 * 
 * Lists all payouts for a Jamaica branch
 * Only accessible by ADMIN role
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { getBranchPayouts } from '@/app/services/payouts/jamaicaPayoutService';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check
    const searchParams = request.nextUrl.searchParams;
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status') || undefined;

    if (!branchId) {
      return NextResponse.json(
        { success: false, error: 'Missing branchId parameter' },
        { status: 400 }
      );
    }

    const payouts = await getBranchPayouts(branchId, status);

    return NextResponse.json({
      success: true,
      payouts,
    });
  } catch (error: any) {
    console.error('List payouts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list payouts' },
      { status: 500 }
    );
  }
}


