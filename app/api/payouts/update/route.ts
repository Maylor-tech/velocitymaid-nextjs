export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { updatePayout, getPayoutById } from '@/utils/payoutData';
import type { PayoutStatus, PaymentMethod } from '@/utils/payoutData';

/**
 * Update Payout API
 * 
 * PATCH /api/payouts/update
 * 
 * Body: {
 *   payoutId: string,
 *   status?: "pending" | "approved" | "paid",
 *   deductions?: number,
 *   paymentMethod?: "manual" | "stripe" | "bank_transfer" | "cash",
 *   paymentReference?: string
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body = await request.json();
    const { payoutId, status, deductions, paymentMethod, paymentReference } = body;

    if (!payoutId) {
      return NextResponse.json(
        { success: false, error: 'payoutId is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['pending', 'approved', 'paid'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: pending, approved, or paid' },
        { status: 400 }
      );
    }

    // Validate paymentMethod if provided
    if (paymentMethod !== undefined && paymentMethod !== null) {
      const validMethods = ['manual', 'stripe', 'bank_transfer', 'cash'];
      if (!validMethods.includes(paymentMethod)) {
        return NextResponse.json(
          { success: false, error: 'Invalid paymentMethod' },
          { status: 400 }
        );
      }
    }

    // Get existing payout
    const existingPayout = getPayoutById(payoutId);
    if (!existingPayout) {
      return NextResponse.json(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      );
    }

    // Prepare updates
    const updates: {
      status?: PayoutStatus;
      deductions?: number;
      paymentMethod?: PaymentMethod | null;
      paymentReference?: string | null;
    } = {};

    if (status) {
      updates.status = status as PayoutStatus;
    }

    if (deductions !== undefined) {
      updates.deductions = Math.max(0, deductions); // Ensure non-negative
    }

    if (paymentMethod !== undefined) {
      updates.paymentMethod = paymentMethod as PaymentMethod | null;
    }

    if (paymentReference !== undefined) {
      updates.paymentReference = paymentReference?.trim() || null;
    }

    // Update payout
    const updatedPayout = updatePayout(payoutId, updates);

    if (!updatedPayout) {
      return NextResponse.json(
        { success: false, error: 'Failed to update payout' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payout: updatedPayout,
    });
  } catch (error: any) {
    console.error('Update payout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update payout' },
      { status: 500 }
    );
  }
}




