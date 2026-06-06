export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getAllComplaints, calculateComplaintStats } from '@/utils/complaintData';
import type { ComplaintStatus, ServiceRegion } from '@/utils/complaintData';

/**
 * List Complaints API
 * 
 * GET /api/complaints/list?status=pending&location=new_jersey
 * 
 * Returns: List of complaints with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');
    const locationParam = searchParams.get('location');

    const status: ComplaintStatus | undefined = 
      statusParam && ['pending', 'in_progress', 'resolved', 'closed'].includes(statusParam)
        ? statusParam as ComplaintStatus
        : undefined;

    const serviceLocation: ServiceRegion | undefined =
      locationParam === 'new_jersey' || locationParam === 'vermont'
        ? locationParam
        : undefined;

    // Get complaints with filters
    const complaints = getAllComplaints({
      status,
      serviceLocation,
    });

    // Calculate statistics
    const stats = calculateComplaintStats(serviceLocation);

    return NextResponse.json({
      success: true,
      complaints,
      stats,
      count: complaints.length,
    });
  } catch (error: any) {
    console.error('List complaints error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch complaints' },
      { status: 500 }
    );
  }
}




