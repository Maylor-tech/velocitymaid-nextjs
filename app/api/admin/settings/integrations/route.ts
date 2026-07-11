export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import {
  getGoogleIntegrationStatus,
  updateGoogleIntegrationSettings,
} from '@/lib/admin/googleIntegrationSettings';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const status = await getGoogleIntegrationStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load integration status';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();
    const driveEnabled = typeof body.driveEnabled === 'boolean' ? body.driveEnabled : undefined;
    const calendarEnabled = typeof body.calendarEnabled === 'boolean' ? body.calendarEnabled : undefined;
    const status = await updateGoogleIntegrationSettings({ driveEnabled, calendarEnabled });
    return NextResponse.json({ success: true, ...status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update integration settings';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
