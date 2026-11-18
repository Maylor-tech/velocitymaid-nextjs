export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { assertAdminJobRecord } from '@/lib/auth/adminJobAccess';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import { resolveOpenFlag } from '@/lib/flags/jobFlags.server';

/** POST /api/admin/job-flags/[flagId]/resolve — close an open flag. Admin only. */
export async function POST(
  request: NextRequest,
  { params }: { params: { flagId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const flag = await prisma.jobFlag.findUnique({
      where: { id: params.flagId },
      select: { jobId: true },
    });
    if (!flag) {
      return NextResponse.json({ success: false, error: 'Flag not found' }, { status: 404 });
    }
    await assertAdminJobRecord(auth, flag.jobId);

    const result = await resolveOpenFlag({
      flagId: params.flagId,
      actorId: auth.userId,
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: 'Flag not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, changed: result.changed });
  } catch (error: unknown) {
    const authResponse = rethrowIfAuthResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Could not resolve flag';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
