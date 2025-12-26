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

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    // TODO: Add admin authentication check

    const body = await request.json();
    const { jobId, cleanerId, sendWhatsApp = true } = body;

    if (!jobId || !cleanerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'jobId and cleanerId are required',
        },
        { status: 400 }
      );
    }

    // Get job with relations
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

    // Phase 1: Only PAID jobs can be assigned
    if (job.paymentStatus !== PaymentStatus.PAID) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only PAID jobs can be assigned to cleaners',
          code: 'PAYMENT_REQUIRED',
        },
        { status: 400 }
      );
    }

    // Phase 1: Only CONFIRMED jobs can be assigned (or jobs without assignment)
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

    // Get cleaner with branch information
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      include: {
        Branch_User_primaryBranchIdToBranch: {
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
          error: 'Cleaner not found',
        },
        { status: 404 }
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

    // Check if Jamaica branch - verify training (existing logic preserved)
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

    // Update job assignment - Phase 1: Set status to ASSIGNED
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

    // Phase 5 Step 5: Log audit entry
    await logAuditEntry({
      actorId: null, // TODO: Get from session
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

    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        assignedCleaner: updatedJob.User,
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

