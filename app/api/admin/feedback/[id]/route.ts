export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ServiceFeedbackDisposition } from '@prisma/client';
import { requireRole } from '@/lib/auth/requireRole';
import {
  DISPOSITION_CATEGORIES,
  adminResendServiceFeedbackRequest,
  adminUpdateServiceFeedback,
  getServiceFeedbackAdminDetail,
} from '@/lib/feedback/serviceFeedback';
import {
  parseGuestClassFromAdminNotes,
  stripGuestClassBlock,
} from '@/lib/feedback/guestFeedbackClassification';
import { CARE_CHECKLIST_TOTAL } from '@/lib/brand/careChecklist';
import { guestFacingDisplayName } from '@/lib/stay/propertyGuestAccess';

/**
 * GET /api/admin/feedback/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const row = await getServiceFeedbackAdminDetail(params.id, auth.branchId);
    if (!row) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const checklistDone = row.Job.JobChecklistItem.length;
    const opsClassParsed = parseGuestClassFromAdminNotes(row.adminNotes);
    return NextResponse.json({
      success: true,
      feedback: {
        id: row.id,
        source: row.source,
        status: row.status,
        overallRating: row.overallRating,
        cleanlinessRating: row.cleanlinessRating,
        communicationRating: row.communicationRating,
        timelinessRating: row.timelinessRating,
        comment: row.comment,
        requestedAt: row.requestedAt.toISOString(),
        submittedAt: row.submittedAt?.toISOString() ?? null,
        reminderSentAt: row.reminderSentAt?.toISOString() ?? null,
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        releasedAt: row.releasedAt?.toISOString() ?? null,
        resolvedAt: row.resolvedAt?.toISOString() ?? null,
        dispositionCategory: row.dispositionCategory,
        adminNotes: stripGuestClassBlock(row.adminNotes),
        opsClassification: opsClassParsed
          ? {
              opsClass: opsClassParsed.opsClass,
              issueTopic: opsClassParsed.issueTopic,
              reasons: opsClassParsed.reasons,
            }
          : null,
        cleanerResponse: row.cleanerResponse,
        cleanerRespondedAt: row.cleanerRespondedAt?.toISOString() ?? null,
        lowRating:
          row.overallRating != null &&
          row.overallRating >= 1 &&
          row.overallRating <= 3,
        customer: row.Customer,
        cleaner: row.Cleaner,
        property: row.Property
          ? {
              id: row.Property.id,
              name: row.Property.name,
              address: row.Property.address,
              city: row.Property.city,
              state: row.Property.state,
              guestDisplayName: guestFacingDisplayName(
                row.Property.guestDisplayName
              ),
            }
          : null,
        job: {
          id: row.Job.id,
          jobReference: row.Job.jobReference,
          preferredDate: row.Job.preferredDate?.toISOString() ?? null,
          preferredTime: row.Job.preferredTime,
          address: row.Job.address,
          status: row.Job.status,
          branchId: row.Job.branchId,
          internalNotes: row.Job.internalNotes,
          completedAt: row.Job.completedAt?.toISOString() ?? null,
          submittedForQcAt: row.Job.submittedForQcAt?.toISOString() ?? null,
        },
        evidence: {
          completionReport: row.Job.CompletionReport
            ? {
                id: row.Job.CompletionReport.id,
                reportNumber: row.Job.CompletionReport.reportNumber,
                publicToken: row.Job.CompletionReport.publicToken,
                issuesFound: row.Job.CompletionReport.issuesFound,
                supplyRequests: row.Job.CompletionReport.supplyRequests,
                status: row.Job.CompletionReport.status,
              }
            : null,
          issuePhotos: row.Job.photos.map((p) => ({
            id: p.id,
            url: p.url,
            caption: p.caption,
            category: p.category,
          })),
          checklistCompleted: checklistDone,
          checklistTotal: CARE_CHECKLIST_TOTAL,
          escalations: row.Job.ComplianceIssue,
        },
        dispositionOptions: DISPOSITION_CATEGORIES,
      },
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load feedback';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/feedback/[id]
 * Body: { dispositionCategory?, adminNotes?, action?: 'review'|'release'|'resolve'|'resend_request' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const body = await request.json();

    if (body.action === 'resend_request') {
      try {
        const result = await adminResendServiceFeedbackRequest(
          params.id,
          auth.userId,
          auth.branchId
        );
        return NextResponse.json({
          success: true,
          email: result.email,
          feedbackId: result.feedback.id,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Resend failed';
        const status = message.includes('not found') ? 404 : 400;
        return NextResponse.json({ success: false, error: message }, { status });
      }
    }

    let disposition: ServiceFeedbackDisposition | null | undefined;
    if (body.dispositionCategory === '' || body.dispositionCategory === null) {
      disposition = null;
    } else if (body.dispositionCategory !== undefined) {
      disposition = body.dispositionCategory as ServiceFeedbackDisposition;
    }
    if (
      disposition != null &&
      !DISPOSITION_CATEGORIES.includes(disposition)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid disposition category' },
        { status: 400 }
      );
    }

    const action = body.action as 'review' | 'release' | 'resolve' | undefined;
    if (action && !['review', 'release', 'resolve'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    try {
      const updated = await adminUpdateServiceFeedback(
        params.id,
        {
          dispositionCategory: disposition,
          adminNotes: body.adminNotes,
          action,
        },
        auth.userId,
        auth.branchId
      );

      return NextResponse.json({
        success: true,
        feedback: {
          id: updated.id,
          status: updated.status,
          dispositionCategory: updated.dispositionCategory,
          adminNotes: updated.adminNotes,
          reviewedAt: updated.reviewedAt?.toISOString() ?? null,
          releasedAt: updated.releasedAt?.toISOString() ?? null,
          resolvedAt: updated.resolvedAt?.toISOString() ?? null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update feedback';
      const status = message.includes('not found')
        ? 404
        : message.includes('Cannot')
          ? 400
          : 500;
      return NextResponse.json({ success: false, error: message }, { status });
    }
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to update feedback';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
