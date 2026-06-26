export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { CleanerApplicationStatus } from '@prisma/client';

const ALLOWED_STATUSES: CleanerApplicationStatus[] = [
  'NEW',
  'REVIEWING',
  'ACCEPTED',
  'REJECTED',
  'TRAINING_INVITED',
  'PENDING',
  'APPROVED',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    const application = await prisma.cleanerApplication.findUnique({
      where: { id: params.id },
      include: {
        Branch: {
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

    return NextResponse.json({ success: true, application });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Get cleaner application error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch application';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status || !ALLOWED_STATUSES.includes(status as CleanerApplicationStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const application = await prisma.cleanerApplication.update({
      where: { id: params.id },
      data: { status: status as CleanerApplicationStatus, updatedAt: new Date() },
      include: {
        Branch: {
          select: { id: true, name: true, slug: true, city: true, state: true, country: true },
        },
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('Update cleaner application error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update application';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
