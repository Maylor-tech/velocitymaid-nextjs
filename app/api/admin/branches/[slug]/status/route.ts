import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  // TODO: Add admin authentication check
  try {
    const { slug } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['ACTIVE', 'COMING_SOON', 'PAUSED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.update({
      where: { slug },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      branch,
    });
  } catch (error: any) {
    console.error('Update branch status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update branch status' },
      { status: 500 }
    );
  }
}


