export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { serializeTask } from '@/lib/leadCenter/serialize';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const status = request.nextUrl.searchParams.get('status') ?? 'PENDING';

    const where: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      dueAt?: { gte?: Date; lte?: Date };
    } = {};

    if (status !== 'ALL') {
      where.status = status as 'PENDING' | 'COMPLETED' | 'CANCELLED';
    }

    if (from || to) {
      where.dueAt = {};
      if (from) where.dueAt.gte = new Date(from);
      if (to) where.dueAt.lte = new Date(to);
    }

    const tasks = await prisma.pipelineLeadTask.findMany({
      where,
      include: { lead: { select: { id: true, name: true, stage: true } } },
      orderBy: { dueAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      tasks: tasks.map(serializeTask),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list tasks';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
