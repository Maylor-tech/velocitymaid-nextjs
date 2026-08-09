export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * TEMPORARY admin-only: one-time CalendarList.insert + get for ops calendar.
 * Remove immediately after capturing accessRole. Does not change normal sync.
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { requireRole } from '@/lib/auth/requireRole';

const SCOPE = 'https://www.googleapis.com/auth/calendar.calendarlist';

function normalizePrivateKey(raw: string): string {
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || null;
    const calendarId = process.env.GOOGLE_OPERATIONS_CALENDAR_ID?.trim() || null;
    const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || null;

    if (!email || !calendarId || !rawKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Google Calendar env',
          authenticated_service_account_email: email,
          configured_calendar_id: calendarId,
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

    let insertResult: {
      status: 'inserted' | 'already_exists' | 'error';
      http_status?: number | null;
      error_message?: string | null;
      error_reason?: string | null;
    };

    try {
      await calendar.calendarList.insert({
        requestBody: { id: calendarId },
      });
      insertResult = { status: 'inserted', http_status: 200 };
    } catch (err: unknown) {
      const e = err as {
        message?: string;
        code?: number;
        response?: {
          status?: number;
          data?: {
            error?: {
              code?: number;
              message?: string;
              errors?: Array<{ reason?: string }>;
            };
          };
        };
      };
      const httpStatus = e.response?.status ?? (typeof e.code === 'number' ? e.code : null);
      const reason = e.response?.data?.error?.errors?.[0]?.reason ?? null;
      const message = e.response?.data?.error?.message ?? e.message ?? null;

      // Duplicate / already in list
      if (
        httpStatus === 409 ||
        reason === 'duplicate' ||
        /already exists|duplicate/i.test(message ?? '')
      ) {
        insertResult = {
          status: 'already_exists',
          http_status: httpStatus,
          error_message: message,
          error_reason: reason,
        };
      } else {
        return NextResponse.json({
          success: false,
          scope: SCOPE,
          authenticated_service_account_email: email,
          configured_calendar_id: calendarId,
          insert_result: {
            status: 'error',
            http_status: httpStatus,
            error_message: message,
            error_reason: reason,
          },
          accessRole: null,
          summary: null,
        });
      }
    }

    try {
      const got = await calendar.calendarList.get({ calendarId });
      return NextResponse.json({
        success: true,
        scope: SCOPE,
        authenticated_service_account_email: email,
        configured_calendar_id: calendarId,
        insert_result: insertResult,
        accessRole: got.data.accessRole ?? null,
        summary: got.data.summary ?? null,
      });
    } catch (err: unknown) {
      const e = err as {
        message?: string;
        response?: {
          status?: number;
          data?: {
            error?: { message?: string; errors?: Array<{ reason?: string }> };
          };
        };
      };
      return NextResponse.json({
        success: false,
        scope: SCOPE,
        authenticated_service_account_email: email,
        configured_calendar_id: calendarId,
        insert_result: insertResult,
        accessRole: null,
        summary: null,
        get_error: {
          http_status: e.response?.status ?? null,
          error_message: e.response?.data?.error?.message ?? e.message ?? null,
          error_reason: e.response?.data?.error?.errors?.[0]?.reason ?? null,
        },
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
