export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings/integrations/health
 *
 * Read-only Google Workspace exception desk. Never calls Google APIs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { getIntegrationHealthReport } from '@/lib/google/integrationHealth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const report = await getIntegrationHealthReport();
    return NextResponse.json({ success: true, ...report });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load integration health';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
