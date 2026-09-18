export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ServiceFeedbackStatus } from '@prisma/client';
import { requireRole } from '@/lib/auth/requireRole';
import { listServiceFeedbackForAdmin } from '@/lib/feedback/serviceFeedback';

/**
 * GET /api/admin/feedback
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const statusParam = request.nextUrl.searchParams.get('status');
    const lowOnly = request.nextUrl.searchParams.get('lowOnly') === '1';
    const status =
      statusParam &&
      Object.values(ServiceFeedbackStatus).includes(
        statusParam as ServiceFeedbackStatus
      )
        ? (statusParam as ServiceFeedbackStatus)
        : undefined;

    const rows = await listServiceFeedbackForAdmin({
      status,
      lowOnly,
      authBranchId: auth.branchId,
    });
    return NextResponse.json({
      success: true,
      items: rows.map((r) => ({
        id: r.id,
        status: r.status,
        overallRating: r.overallRating,
        cleanlinessRating: r.cleanlinessRating,
        communicationRating: r.communicationRating,
        timelinessRating: r.timelinessRating,
        comment: r.comment,
        submittedAt: r.submittedAt?.toISOString() ?? null,
        requestedAt: r.requestedAt.toISOString(),
        dispositionCategory: r.dispositionCategory,
        lowRating:
          r.overallRating != null && r.overallRating >= 1 && r.overallRating <= 3,
        underReview: r.status === 'UNDER_REVIEW',
        customer: r.Customer
          ? {
              id: r.Customer.id,
              name: `${r.Customer.firstName} ${r.Customer.lastName}`.trim(),
              email: r.Customer.email,
            }
          : null,
        cleaner: r.Cleaner
          ? { id: r.Cleaner.id, name: r.Cleaner.name, email: r.Cleaner.email }
          : null,
        property: r.Property
          ? {
              id: r.Property.id,
              name: r.Property.name,
              address: r.Property.address,
            }
          : null,
        job: {
          id: r.Job.id,
          jobReference: r.Job.jobReference,
          preferredDate: r.Job.preferredDate?.toISOString() ?? null,
          address: r.Job.address,
          status: r.Job.status,
          branchId: r.Job.branchId,
        },
      })),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to list feedback';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
