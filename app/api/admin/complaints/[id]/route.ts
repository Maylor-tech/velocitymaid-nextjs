export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';

// GET /api/admin/complaints/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual Complaint model query when schema is updated
    // const complaint = await prisma.complaint.findUnique({
    //   where: { id },
    //   include: {
    //     Job: {
    //       select: {
    //         id: true,
    //         customerName: true,
    //         address: true,
    //         preferredDate: true,
    //         Branch: { select: { id: true, name: true } },
    //       },
    //     },
    //     User: { select: { id: true, name: true, email: true } },
    //   },
    // });

    // Placeholder
    return NextResponse.json({
      success: false,
      error: 'Complaint model not yet implemented in Prisma schema',
    });
  } catch (error: any) {
    console.error('Get complaint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get complaint' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/complaints/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, resolutionNotes } = body;

    if (status && !['OPEN', 'RESOLVED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be OPEN or RESOLVED' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Complaint model update when schema is updated
    // const oldComplaint = await prisma.complaint.findUnique({
    //   where: { id },
    //   select: { status: true },
    // });
    //
    // const complaint = await prisma.complaint.update({
    //   where: { id },
    //   data: {
    //     ...(status && { status }),
    //     ...(resolutionNotes !== undefined && { resolutionNotes }),
    //     updatedAt: new Date(),
    //   },
    // });

    // Phase 5 Step 5: Log audit entry
    await logAuditEntry({
      actorId: null, // TODO: Get from session
      actorRole: 'ADMIN',
      action: 'COMPLAINT_RESOLVED',
      entityType: 'Complaint',
      entityId: id,
      description: status === 'RESOLVED' ? 'Complaint marked as resolved' : 'Complaint status updated',
      changes: {
        status: status || undefined,
        resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Complaint updated',
    });
  } catch (error: any) {
    console.error('Update complaint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update complaint' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/complaints/[id] (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual Complaint model soft delete when schema is updated
    // await prisma.complaint.update({
    //   where: { id },
    //   data: { status: 'DELETED', updatedAt: new Date() },
    // });

    return NextResponse.json({
      success: true,
      message: 'Complaint deleted',
    });
  } catch (error: any) {
    console.error('Delete complaint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete complaint' },
      { status: 500 }
    );
  }
}

