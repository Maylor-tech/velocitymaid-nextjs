import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { markModuleComplete } from '@/lib/cleaners/trainingProgress';
import { getTrainingModule } from '@/lib/cleaners/trainingModules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/cleaner/training/[moduleSlug]/complete */
export async function POST(
  req: NextRequest,
  { params }: { params: { moduleSlug: string } }
) {
  try {
    const auth = await requireRole(req, 'CLEANER');
    const moduleDef = getTrainingModule(params.moduleSlug);
    if (!moduleDef) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }
    if (moduleDef.kind !== 'content') {
      return NextResponse.json(
        { success: false, error: 'This module cannot be marked complete manually' },
        { status: 400 }
      );
    }

    await markModuleComplete(auth.userId, params.moduleSlug);

    return NextResponse.json({ success: true, message: 'Module marked complete' });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    const message = error instanceof Error ? error.message : 'Failed to complete module';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
