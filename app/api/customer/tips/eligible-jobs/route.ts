export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { findCustomerById } from '@/utils/customerData';
import { getBookingHistory } from '@/utils/customerBookings';
import { getTipByJobId } from '@/utils/tipData';

/**
 * Get Eligible Jobs for Tips API
 * 
 * GET /api/customer/tips/eligible-jobs
 * 
 * Returns last 5 completed bookings that can be tipped
 */
export async function GET(request: NextRequest) {
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

    // Get completed bookings
    const bookings = await getBookingHistory(customer.email);
    
    // Filter to only completed jobs (last 5)
    const eligibleJobs = bookings
      .filter(booking => booking.status === 'completed')
      .slice(0, 5)
      .map(booking => {
        // Check if already tipped
        const existingTip = getTipByJobId(booking.id);
        
        return {
          jobId: booking.id,
          date: booking.preferredDate,
          serviceType: booking.serviceType,
          cleanerName: booking.assignedCleanerName || 'Cleaner',
          cleanerId: booking.assignedCleanerId || null,
          address: booking.address,
          alreadyTipped: existingTip !== null,
          tipAmount: existingTip?.tipAmount || null,
        };
      });

    return NextResponse.json({
      success: true,
      jobs: eligibleJobs,
      count: eligibleJobs.length,
    });
  } catch (error: any) {
    console.error('Get eligible jobs error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch eligible jobs' },
      { status: 500 }
    );
  }
}

