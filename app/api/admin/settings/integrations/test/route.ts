export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { testDriveConnection, testCalendarConnection } from '@/lib/google/testConnection';

/**
 * POST /api/admin/settings/integrations/test
 * Body: { provider: "drive" | "calendar" }
 * Read-only — confirms credentials/IDs work without creating or modifying anything.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();
    const provider = body.provider;

    if (provider === 'drive') {
      const result = await testDriveConnection();
      return NextResponse.json({ success: true, ...result });
    }
    if (provider === 'calendar') {
      const result = await testCalendarConnection();
      return NextResponse.json({ success: true, ...result });
    }
    return NextResponse.json({ success: false, error: 'provider must be "drive" or "calendar"' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Connection test failed';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
