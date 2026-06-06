export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { updateComplaint, getComplaintById } from '@/utils/complaintData';

/**
 * Resolve Complaint Via Re-clean API
 * 
 * PATCH /api/complaints/resolveViaReclean
 * 
 * Body: {
 *   complaintId: string,
 *   newJobId?: string,
 *   resolutionNotes?: string
 * }
 * 
 * Sets complaint status to "resolved" with resolutionType "reclean"
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body = await request.json();
    const { complaintId, newJobId, resolutionNotes } = body;

    if (!complaintId) {
      return NextResponse.json(
        { success: false, error: 'complaintId is required' },
        { status: 400 }
      );
    }

    const complaint = getComplaintById(complaintId);
    if (!complaint) {
      return NextResponse.json(
        { success: false, error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Build resolution notes
    const notes = [
      complaint.adminNotes || '',
      `Resolved via re-clean${newJobId ? ` (New Job ID: ${newJobId})` : ''}`,
      resolutionNotes || '',
    ]
      .filter(n => n.trim())
      .join('\n\n');

    // Update complaint
    const updatedComplaint = updateComplaint(complaintId, {
      status: 'resolved',
      resolutionType: 'reclean',
      adminNotes: notes.trim() || null,
    });

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
    console.error('Resolve complaint via reclean error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resolve complaint' },
      { status: 500 }
    );
  }
}




