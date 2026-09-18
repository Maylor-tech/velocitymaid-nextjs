export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicFeedbackByToken,
  submitPublicFeedback,
} from '@/lib/feedback/serviceFeedback';

/**
 * GET /api/feedback/[token] — public token view (no auth).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const view = await getPublicFeedbackByToken(params.token);
    if (view.state === 'invalid') {
      return NextResponse.json(
        { success: false, error: 'Feedback link is invalid or expired', code: 'INVALID_TOKEN' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, ...view });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load feedback';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/feedback/[token] — one-shot customer submit.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const result = await submitPublicFeedback(params.token, {
      overallRating: Number(body.overallRating),
      cleanlinessRating: Number(body.cleanlinessRating),
      communicationRating: Number(body.communicationRating),
      timelinessRating: Number(body.timelinessRating),
      comment: body.comment ?? null,
    });

    if (result.ok === false) {
      const status = result.code === 'INVALID_TOKEN' ? 404 : 400;
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      alreadySubmitted: result.alreadySubmitted,
      status: result.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit feedback';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
