export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById, upsertCustomerPreferences } from '@/utils/customerData';

/**
 * Update Customer Preferences API
 * 
 * PATCH /api/customer/preferences/update
 * 
 * Body: {
 *   preferredTimeWindow?: "morning" | "afternoon" | "evening",
 *   preferredDayOfWeek?: number,
 *   notesForCleaner?: string,
 *   allowWhatsApp?: boolean,
 *   allowEmail?: boolean
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const customerId = cookieStore.get('customerId')?.value;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const customer = findCustomerById(customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      preferredTimeWindow,
      preferredDayOfWeek,
      notesForCleaner,
      allowWhatsApp,
      allowEmail,
    } = body;

    // Validate preferredTimeWindow
    if (preferredTimeWindow !== undefined && preferredTimeWindow !== null) {
      const validWindows = ['morning', 'afternoon', 'evening'];
      if (!validWindows.includes(preferredTimeWindow)) {
        return NextResponse.json(
          { success: false, error: 'Invalid preferredTimeWindow' },
          { status: 400 }
        );
      }
    }

    // Validate preferredDayOfWeek
    if (preferredDayOfWeek !== undefined && preferredDayOfWeek !== null) {
      if (preferredDayOfWeek < 0 || preferredDayOfWeek > 6) {
        return NextResponse.json(
          { success: false, error: 'preferredDayOfWeek must be between 0 and 6' },
          { status: 400 }
        );
      }
    }

    // Update preferences
    const preferences = upsertCustomerPreferences(customerId, {
      preferredTimeWindow: preferredTimeWindow || null,
      preferredDayOfWeek: preferredDayOfWeek !== undefined ? preferredDayOfWeek : null,
      notesForCleaner: notesForCleaner?.trim() || null,
      allowWhatsApp: allowWhatsApp !== undefined ? allowWhatsApp : true,
      allowEmail: allowEmail !== undefined ? allowEmail : true,
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error('Update customer preferences error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

