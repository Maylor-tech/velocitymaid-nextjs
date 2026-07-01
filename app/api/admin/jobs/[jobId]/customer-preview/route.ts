export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { PaymentStatus, JobStatus } from '@prisma/client';
import { loadJobTeamBatch } from '@/lib/cleaners/internalCleanerService';
import {
  mergePrimaryWithTeam,
  type TeamMemberDisplay,
} from '@/lib/cleaners/teamDisplay';

function mapCustomerJobStatus(status: JobStatus, paymentStatus: PaymentStatus): string {
  if (status === JobStatus.COMPLETED && paymentStatus === PaymentStatus.PAID) return 'completed';
  if (status === JobStatus.COMPLETED) return 'completed';
  if (status === JobStatus.IN_PROGRESS || status === JobStatus.ON_THE_WAY) return 'in_progress';
  if (status === JobStatus.ASSIGNED || status === JobStatus.CONFIRMED) return 'assigned';
  if (
    status === JobStatus.CANCELLED ||
    status === JobStatus.CANCELLED_EMERGENCY
  ) {
    return 'cancelled';
  }
  return 'pending';
}

/**
 * GET /api/admin/jobs/[jobId]/customer-preview
 * Read-only view of what the customer sees in their portal for this job.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: {
        Branch: { select: { name: true } },
        User: {
          select: {
            id: true,
            name: true,
            CleanerProfile: { select: { publicDisplayName: true } },
          },
        },
        photos: { orderBy: { uploadedAt: 'asc' }, take: 6 },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const teamMap = await loadJobTeamBatch([job.id]);
    const primaryMember: TeamMemberDisplay | null = job.User
      ? {
          id: job.User.id,
          name: job.User.name,
          publicDisplayName: job.User.CleanerProfile?.publicDisplayName ?? null,
        }
      : null;
    const team = mergePrimaryWithTeam(primaryMember, teamMap.get(job.id) ?? []);

    return NextResponse.json({
      success: true,
      preview: {
        id: job.id,
        status: mapCustomerJobStatus(job.status, job.paymentStatus),
        rawStatus: job.status,
        serviceType: job.serviceType || 'Professional cleaning',
        scheduledDate: job.preferredDate?.toISOString() ?? null,
        timeWindow: job.preferredTime,
        address: job.address || 'Address on file',
        price:
          job.quotedTotal != null
            ? Number(job.quotedTotal)
            : job.totalPrice != null
              ? Number(job.totalPrice)
              : null,
        balanceDue: job.balanceDue != null ? Number(job.balanceDue) : null,
        paymentStatus: job.paymentStatus,
        serviceTeamLine:
          team.length > 0
            ? team.map((m) => m.publicDisplayName || m.name || 'Team member').join(', ')
            : null,
        photos: job.photos.map((p) => ({ url: p.url, caption: p.caption })),
        customerId: job.customerId,
        customerPortalUrl: job.customerId ? `/customer/jobs/${job.id}` : null,
      },
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load preview';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
