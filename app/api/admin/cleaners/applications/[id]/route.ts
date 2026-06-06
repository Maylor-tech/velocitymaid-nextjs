export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, "ADMIN");
    
    const { id } = params;

    const application = await prisma.cleanerApplication.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, name: true, slug: true, city: true, state: true, country: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Get cleaner application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

