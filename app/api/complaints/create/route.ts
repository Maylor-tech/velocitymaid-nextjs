import { NextRequest, NextResponse } from 'next/server';
import { createComplaint } from '@/utils/complaintData';

/**
 * Create Complaint API
 * 
 * POST /api/complaints/create
 * 
 * Body: {
 *   jobId: string,
 *   reviewId?: string | null,
 *   cleanerId?: string | null,
 *   serviceLocation: "new_jersey" | "vermont",
 *   customerName: string,
 *   customerPhone: string,
 *   rating: number,
 *   comment?: string | null,
 *   requestReclean: boolean
 * }
 * 
 * Note: This is typically called automatically when a low-rating review is created.
 * Can also be used for manual complaint logging by admin.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId,
      reviewId,
      cleanerId,
      serviceLocation,
      customerName,
      customerPhone,
      rating,
      comment,
      requestReclean,
    } = body;

    // Validations
    if (!jobId || !serviceLocation || !customerName || !customerPhone || rating === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: jobId, serviceLocation, customerName, customerPhone, and rating are required' },
        { status: 400 }
      );
    }

    if (serviceLocation !== 'new_jersey' && serviceLocation !== 'vermont') {
      return NextResponse.json(
        { success: false, error: 'serviceLocation must be "new_jersey" or "vermont"' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Create complaint
    const complaint = createComplaint({
      jobId,
      reviewId: reviewId || null,
      cleanerId: cleanerId || null,
      serviceLocation,
      customerName,
      customerPhone,
      rating: Math.round(rating),
      comment: comment?.trim() || null,
      requestReclean: requestReclean || false,
      status: 'pending',
      resolutionType: null,
      adminNotes: null,
    });

    // TODO: Send WhatsApp alert to admin
    // TODO: Send email alert to admin
    // See sendComplaintAlert() function

    return NextResponse.json({
      success: true,
      complaintId: complaint.id,
      complaint,
    });
  } catch (error: any) {
    console.error('Create complaint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create complaint' },
      { status: 500 }
    );
  }
}



