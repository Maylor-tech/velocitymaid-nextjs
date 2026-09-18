export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import {
  getReleasedFeedbackForCleaner,
  listReleasedFeedbackForCleaner,
  submitCleanerFeedbackResponse,
} from '@/lib/feedback/serviceFeedback';

/**
 * GET /api/cleaner/feedback — released feedback only for authenticated cleaner.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const row = await getReleasedFeedbackForCleaner(id, auth.userId);
      if (!row) {
        return NextResponse.json(
          { success: false, error: 'Feedback not found or not released' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        feedback: {
          id: row.id,
          overallRating: row.overallRating,
          cleanlinessRating: row.cleanlinessRating,
          communicationRating: row.communicationRating,
          timelinessRating: row.timelinessRating,
          comment: row.comment,
          status: row.status,
          releasedAt: row.releasedAt?.toISOString() ?? null,
          submittedAt: row.submittedAt?.toISOString() ?? null,
          cleanerResponse: row.cleanerResponse,
          cleanerRespondedAt: row.cleanerRespondedAt?.toISOString() ?? null,
          job: {
            jobReference: row.Job.jobReference,
            preferredDate: row.Job.preferredDate?.toISOString() ?? null,
            address: row.Job.address,
            propertyName: row.Job.Property?.name ?? null,
          },
        },
      });
    }

    const rows = await listReleasedFeedbackForCleaner(auth.userId);
    return NextResponse.json({ success: true, items: rows });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load feedback';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/cleaner/feedback — one internal response on released feedback.
 * Body: { feedbackId, response }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'CLEANER');
    const body = await request.json();
    const feedbackId = String(body.feedbackId || '');
    const response = String(body.response || '');

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, error: 'feedbackId is required' },
        { status: 400 }
      );
    }

    const updated = await submitCleanerFeedbackResponse(
      feedbackId,
      auth.userId,
      response
    );

    return NextResponse.json({
      success: true,
      feedback: {
        id: updated.id,
        cleanerResponse: updated.cleanerResponse,
        cleanerRespondedAt: updated.cleanerRespondedAt?.toISOString() ?? null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to save response';
    const status =
      message.includes('not found') ||
      message.includes('already') ||
      message.includes('required') ||
      message.includes('too long')
        ? 400
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
