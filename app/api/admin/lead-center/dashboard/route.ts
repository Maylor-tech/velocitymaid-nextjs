export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { computeDashboardMetrics } from '@/lib/leadCenter/metrics';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const leads = await prisma.pipelineLead.findMany();
    const metrics = computeDashboardMetrics(leads);

    return NextResponse.json({ success: true, metrics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
