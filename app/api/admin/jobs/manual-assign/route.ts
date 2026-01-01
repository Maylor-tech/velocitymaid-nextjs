export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * Manual Assign Cleaner API
 * POST /api/admin/jobs/manual-assign
 * 
 * Manually assigns a cleaner to a job
 * Body: { jobId: string, cleanerId: string, sendWhatsApp?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import { sendCleanerAssignment } from '@/lib/sendCleanerAssignment';
import { logAuditEntry } from '@/lib/audit';
import { logAdminEvent } from '@/lib/auditLog';

export async function POST(request: NextRequest) {
  try {
    // Phase 2B: Get admin context to capture admin email for audit log
    const adminAuth = await requireRole(request, "ADMIN");
    const adminEmail = adminAuth.email || 'unknown@admin.com';

    const body = await request.json();
    const { jobId, cleanerId, sendWhatsApp = true, confirmReassign } = body;

    if (!jobId || !cleanerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'jobId and cleanerId are required',
        },
        { status: 400 }
      );
    }

    // Phase 1: Get job with relations (using capitalized relation field name)
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
          },
        },
        Customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    // Phase 2A: Payment Gating - Check payment status BEFORE any other validation
    // This prevents wasted API calls and ensures payment is verified first
    // Why unpaid jobs are blocked: Cleaners should only be assigned to jobs that are guaranteed to pay
    // This protects cleaner time and ensures payment integrity before assignment
    if (job.paymentStatus !== PaymentStatus.PAID) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job must be PAID before assignment',
          code: 'PAYMENT_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Phase 1: Safety check - prevent silent reassignment
    // If job already has an assigned cleaner, require explicit confirmation
    if (job.assignedCleanerId && job.assignedCleanerId !== cleanerId) {
      const { confirmReassign } = body;
      if (!confirmReassign) {
        return NextResponse.json(
          {
            success: false,
            error: 'Job is already assigned to another cleaner. Set confirmReassign=true to override.',
            code: 'REASSIGNMENT_REQUIRED',
            currentCleanerId: job.assignedCleanerId,
          },
          { status: 400 }
        );
      }
    }

    // Phase 1: Only CONFIRMED or RECEIVED jobs can be assigned (or jobs without assignment)
    // Assumption: Jobs in other statuses (e.g., IN_PROGRESS, COMPLETED) should not be reassigned
    if (job.status !== 'CONFIRMED' && job.status !== 'RECEIVED' && job.assignedCleanerId) {
      return NextResponse.json(
        {
          success: false,
          error: `Job status ${job.status} does not allow assignment`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Phase 1: Get cleaner with branch information
    // Must verify: role === "CLEANER" and isActive === true
    // Note: Payment check (Phase 2A) already passed above, so we can proceed with cleaner validation
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      include: {
        primaryBranch: {
          select: {
            id: true,
            country: true,
            slug: true,
          },
        },
        UserBranch: {
          include: {
            Branch: {
              select: {
                id: true,
              },
            },
          },
        },
        trainingStatus: {
          select: {
            overallStatus: true,
          },
        },
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cleaner not found or is not a CLEANER',
          code: 'CLEANER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Phase 1: Block assignment if cleaner is not active
    // Assumption: Only active cleaners can be assigned to jobs
    if (!cleaner.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cleaner is not active and cannot be assigned to jobs',
          code: 'CLEANER_INACTIVE',
        },
        { status: 403 }
      );
    }

    // Phase 1: Check cleaner has APPROVED application
    const approvedApplication = await prisma.cleanerApplication.findFirst({
      where: {
        email: cleaner.email,
        status: 'APPROVED',
      },
    });

    if (!approvedApplication) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cleaner does not have an approved application',
          code: 'NOT_APPROVED',
        },
        { status: 403 }
      );
    }

    // Phase 1: Enforce branch consistency - cleaner must be in same branch as job
    // Assumption: Cleaners can only be assigned to jobs in their assigned branch(es)
    // Note: UserBranch uses capitalized 'Branch' relation field name (join table model)
    const cleanerBranchIds = [
      cleaner.primaryBranchId,
      ...cleaner.UserBranch.map(ub => ub.Branch.id),
    ].filter(Boolean) as string[];

    if (!cleanerBranchIds.includes(job.branchId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cleaner must be in the same branch as the job',
          code: 'BRANCH_MISMATCH',
          jobBranchId: job.branchId,
          cleanerBranchIds,
        },
        { status: 400 }
      );
    }

    // Phase 1: Check if Jamaica branch - verify training (existing logic preserved)
    // Assumption: Jamaica branch requires additional training certification
    const isJamaicaBranch =
      job.Branch.country === 'Jamaica' ||
      job.Branch.country === 'JM' ||
      job.Branch.slug === 'port-antonio';

    if (isJamaicaBranch) {
      if (cleaner.trainingStatus?.overallStatus !== 'PASSED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Cleaner has not passed required training for Jamaica jobs',
            code: 'TRAINING_REQUIRED',
          },
          { status: 403 }
        );
      }
    }

    // Phase 1: Update job assignment
    // Requirements:
    // 1. Set job.assignedCleanerId to cleanerId
    // 2. Set job.status to "ASSIGNED" (if job was RECEIVED or CONFIRMED)
    // 3. Set job.assignedAt to current timestamp
    // Assumption: Status transitions are manual in Phase 1 (no automation)
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCleanerId: cleanerId,
        status: job.status === 'RECEIVED' || job.status === 'CONFIRMED' ? 'ASSIGNED' : job.status,
        assignedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Phase 5 Step 5: Log audit entry (existing system)
    await logAuditEntry({
      actorId: adminAuth.userId,
      actorRole: 'ADMIN',
      action: 'MANUAL_JOB_ASSIGNMENT',
      entityType: 'Job',
      entityId: jobId,
      description: `Cleaner ${cleaner.name || cleanerId} manually assigned to job ${jobId}`,
      changes: {
        assignedCleanerId: {
          from: job.assignedCleanerId,
          to: cleanerId,
        },
        status: {
          from: job.status,
          to: updatedJob.status,
        },
      },
    });

    // Phase 2B: Admin Audit Log - Log assignment event for observability
    // Why audit logs exist: Track admin actions for compliance and debugging
    // Why audit failures don't block ops: Audit is non-critical observability layer
    // Scope: Phase 2B is append-only - we only add entries, never modify behavior
    const isReassignment = job.assignedCleanerId && job.assignedCleanerId !== cleanerId;
    await logAdminEvent({
      eventType: 'JOB_ASSIGNED',
      adminEmail: adminEmail,
      jobId: jobId,
      cleanerId: cleanerId,
      branchId: job.branchId,
      notes: isReassignment ? `Reassigned from cleaner ${job.assignedCleanerId} to ${cleanerId}` : undefined,
    });

    // Send WhatsApp notification if requested
    if (sendWhatsApp) {
      try {
        const whatsappToken = process.env.WHATSAPP_TOKEN;
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (whatsappToken && whatsappPhoneNumberId) {
          // Get cleaner's phone from application
          const cleanerApp = await prisma.cleanerApplication.findFirst({
            where: {
              email: cleaner.email,
              status: 'APPROVED',
            },
            select: {
              phone: true,
            },
          });

          const cleanerPhone = cleanerApp?.phone;

          if (cleanerPhone) {
            await sendCleanerAssignment(
              whatsappPhoneNumberId,
              whatsappToken,
              {
                phone: cleanerPhone,
                name: cleaner.name || 'Cleaner',
              },
              {
                customerName: job.customerName || 'Customer',
                serviceType: job.serviceType || 'basic',
                preferredDate: job.preferredDate?.toISOString().split('T')[0] || '',
                preferredTime: job.preferredTime || 'Morning',
                address: job.address || '',
                serviceLocation: job.serviceLocation || undefined,
              }
            ).catch((error) => {
              console.error('WhatsApp notification failed (non-fatal):', error);
            });
          }
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification (non-fatal):', whatsappError);
      }
    }

    // Phase 1: Return updated job with cleaner information
    // The UI will refresh to show the assigned cleaner's name and email
    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        assignedCleaner: updatedJob.User ? {
          id: updatedJob.User.id,
          name: updatedJob.User.name,
          email: updatedJob.User.email,
        } : null,
      },
      message: 'Cleaner assigned successfully',
    });
  } catch (error: any) {
    console.error('Error manually assigning cleaner:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to assign cleaner',
      },
      { status: 500 }
    );
  }
}

