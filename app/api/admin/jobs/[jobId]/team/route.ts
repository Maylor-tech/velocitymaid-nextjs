export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { loadJobTeamMembers } from '@/lib/cleaners/internalCleanerService';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const team = await loadJobTeamMembers(params.jobId);
    return NextResponse.json({ success: true, team });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load team';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();
    const cleanerIds = Array.isArray(body.cleanerIds) ? (body.cleanerIds as string[]) : [];

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    await prisma.jobTeamMember.deleteMany({ where: { jobId: params.jobId } });

    if (cleanerIds.length > 0) {
      await prisma.jobTeamMember.createMany({
        data: cleanerIds.map((cleanerId, index) => ({
          jobId: params.jobId,
          cleanerId,
          sortOrder: index,
        })),
      });

      await prisma.job.update({
        where: { id: params.jobId },
        data: { assignedCleanerId: cleanerIds[0], assignedAt: new Date() },
      });
    }

    const team = await loadJobTeamMembers(params.jobId);
    return NextResponse.json({ success: true, team });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to update team';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
