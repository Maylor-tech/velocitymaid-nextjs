export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { isOpenCleanerApplication } from '@/lib/cleaners/applicationStatus';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, "ADMIN");
    const { id } = params;

    const application = await prisma.cleanerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    if (!isOpenCleanerApplication(application.status)) {
      return NextResponse.json(
        { success: false, error: 'Application has already been processed' },
        { status: 400 }
      );
    }

    await prisma.cleanerApplication.update({
      where: { id },
      data: { status: 'REJECTED', updatedAt: new Date() },
    });

    // TODO: Send rejection email

    return NextResponse.json({
      success: true,
      message: 'Application rejected',
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Reject cleaner application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject application' },
      { status: 500 }
    );
  }
}

