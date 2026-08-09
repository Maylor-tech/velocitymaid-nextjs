export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * TEMPORARY admin-only diagnostic — calendarList.get accessRole probe.
 * Remove after capturing result. Does not insert events or change sync.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { requireRole } from '@/lib/auth/requireRole';

const SCOPE = 'https://www.googleapis.com/auth/calendar.calendarlist.readonly';

function normalizePrivateKey(raw: string): string {
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || null;
    const calendarId = process.env.GOOGLE_OPERATIONS_CALENDAR_ID?.trim() || null;
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || null;

    if (!email || !calendarId || !rawKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Google Calendar env on this deployment',
          scope: SCOPE,
          authenticated_service_account_email: email,
          configured_calendar_id: calendarId,
          private_key_state:
            rawKey == null ? 'undefined' : rawKey.length === 0 ? 'empty' : 'set',
        },
        { status: 500 }
      );
    }

    const auth = new JWT({
      email,
      key: normalizePrivateKey(rawKey),
      scopes: [SCOPE],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const res = await calendar.calendarList.get({ calendarId });
      return NextResponse.json({
        success: true,
        scope: SCOPE,
        authenticated_service_account_email: email,
        configured_calendar_id: calendarId,
        accessRole: res.data.accessRole ?? null,
        summary: res.data.summary ?? null,
        calendarList_id: res.data.id ?? null,
      });
    } catch (err: unknown) {
      const e = err as {
        message?: string;
        response?: {
          status?: number;
          data?: { error?: { message?: string; errors?: Array<{ reason?: string }> } };
        };
      };
      return NextResponse.json({
        success: false,
        scope: SCOPE,
        authenticated_service_account_email: email,
        configured_calendar_id: calendarId,
        accessRole: null,
        http_status: e.response?.status ?? null,
        error_message: e.response?.data?.error?.message ?? e.message ?? null,
        error_reason: e.response?.data?.error?.errors?.[0]?.reason ?? null,
      });
    }
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return NextResponse.json(
      { success: false, error: 'Diagnostic failed' },
      { status: 500 }
    );
  }
}
