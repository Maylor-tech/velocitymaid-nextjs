export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { assertAdminJobRecord } from '@/lib/auth/adminJobAccess';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import { isHostNotifyChannel } from '@/lib/flags/jobFlagRules';
import { notifyHostOfFlag } from '@/lib/flags/jobFlags.server';

/** POST /api/admin/job-flags/[flagId]/notify — record that the host was told. Does not send a message. */
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

    const body = await request.json().catch(() => ({}));
    if (!isHostNotifyChannel(body.channel)) {
      return NextResponse.json(
        { success: false, error: 'Choose email, text, call, or in the report' },
        { status: 400 }
      );
    }

    const result = await notifyHostOfFlag({
      flagId: params.flagId,
      channel: body.channel,
      actorId: auth.userId,
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: 'Flag not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, changed: result.changed });
  } catch (error: unknown) {
    const authResponse = rethrowIfAuthResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : 'Could not record host notice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
