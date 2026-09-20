export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { checkStayResolveRateLimit } from '@/lib/stay/rateLimit';
import { resolveStayToGuestFeedback } from '@/lib/stay/resolveStay';

type RouteContext = { params: { token: string } };

/**
 * POST /api/stay/[token]/resolve
 * Body: { checkoutDate: "YYYY-MM-DD" }
 * Success: GUEST feedback token + safe labels only. Never Job.id / job lists / PII.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateKey = `${ip}:${params.token?.slice(0, 12) ?? ''}`;

    if (!(await checkStayResolveRateLimit(rateKey))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many attempts. Please try again later.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const checkoutDate =
      typeof body.checkoutDate === 'string' ? body.checkoutDate : '';

    const result = await resolveStayToGuestFeedback(params.token, checkoutDate);

    if (result.ok === false) {
      const status =
        result.code === 'INVALID_TOKEN'
          ? 404
          : result.code === 'RATE_LIMITED'
            ? 429
            : 400;
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: result.code,
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      feedbackToken: result.feedbackToken,
      feedbackUrl: result.feedbackUrl,
      tipGrantToken: result.tipGrantToken,
      tipUrl: result.tipUrl,
      tipGrantStatus: result.tipGrantStatus,
      propertyLabel: result.propertyLabel,
      serviceDate: result.serviceDate,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to resolve stay';
    console.error('[api/stay/:token/resolve POST]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
