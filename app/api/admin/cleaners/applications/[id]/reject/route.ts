import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add admin authentication check
  try {
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

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Application has already been processed' },
        { status: 400 }
      );
    }

    await prisma.cleanerApplication.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    // TODO: Send rejection email

    return NextResponse.json({
      success: true,
      message: 'Application rejected',
    });
  } catch (error: any) {
    console.error('Reject cleaner application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject application' },
      { status: 500 }
    );
  }
}



