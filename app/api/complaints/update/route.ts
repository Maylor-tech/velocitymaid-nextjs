export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { updateComplaint, getComplaintById } from '@/utils/complaintData';
import type { ComplaintStatus, ResolutionType } from '@/utils/complaintData';

/**
 * Update Complaint API
 * 
 * PATCH /api/complaints/update
 * 
 * Body: {
 *   complaintId: string,
 *   status?: "pending" | "in_progress" | "resolved" | "closed",
 *   resolutionType?: "reclean" | "refund_partial" | "refund_full" | "credit" | "no_issue",
 *   adminNotes?: string
 * }
 */
export async function PATCH(request: NextRequest) {
  // TODO: Protect this route with admin authentication
  // if (!isAdmin(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  // }

  try {
    const body = await request.json();
    const { complaintId, status, resolutionType, adminNotes } = body;

    if (!complaintId) {
      return NextResponse.json(
        { success: false, error: 'complaintId is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: pending, in_progress, resolved, or closed' },
        { status: 400 }
      );
    }

    // Validate resolutionType if provided
    if (resolutionType !== undefined && resolutionType !== null) {
      const validTypes = ['reclean', 'refund_partial', 'refund_full', 'credit', 'no_issue'];
      if (!validTypes.includes(resolutionType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid resolutionType' },
          { status: 400 }
        );
      }
    }

    // Get existing complaint
    const existingComplaint = getComplaintById(complaintId);
    if (!existingComplaint) {
      return NextResponse.json(
        { success: false, error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Prepare updates
    const updates: {
      status?: ComplaintStatus;
      resolutionType?: ResolutionType | null;
      adminNotes?: string | null;
    } = {};

    if (status) {
      updates.status = status as ComplaintStatus;
    }

    if (resolutionType !== undefined) {
      updates.resolutionType = resolutionType as ResolutionType | null;
    }

    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes?.trim() || null;
    }

    // Update complaint
    const updatedComplaint = updateComplaint(complaintId, updates);

    if (!updatedComplaint) {
      return NextResponse.json(
        { success: false, error: 'Failed to update complaint' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      complaint: updatedComplaint,
    });
  } catch (error: any) {
    console.error('Update complaint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update complaint' },
      { status: 500 }
    );
  }
}




