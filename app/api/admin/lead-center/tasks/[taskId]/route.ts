export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { serializeTask } from '@/lib/leadCenter/serialize';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    const body = await request.json();
    const status = body.status as 'PENDING' | 'COMPLETED' | 'CANCELLED' | undefined;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const task = await prisma.pipelineLeadTask.update({
      where: { id: params.taskId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      include: { lead: { select: { id: true, name: true, stage: true } } },
    });

    return NextResponse.json({ success: true, task: serializeTask(task) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    const statusCode = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status: statusCode });
  }
}
