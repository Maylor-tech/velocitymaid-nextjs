import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add admin authentication check
  try {
    const { id } = params;
    const body = await request.json();
    const { status, internalNotes } = body;

    if (status && !['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes || null;
    }

    const application = await prisma.franchiseApplication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error: any) {
    console.error('Update franchise application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update application' },
      { status: 500 }
    );
  }
}



