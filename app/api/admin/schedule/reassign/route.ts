export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'
/**
 * Reassign Cleaner to Job API
 * POST /api/admin/schedule/reassign
 * 
 * Reassigns a job to a different cleaner
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { JobStatus } from "@prisma/client";
import { prisma } from '@/lib/prisma';
import { sendJobOffer } from '@/app/services/whatsappService';
import { awaitJobCalendarSync } from '@/lib/google/jobGoogleSync';

interface ReassignRequest {
  jobId: string;
  newCleanerId: string;
  sendWhatsApp?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body: ReassignRequest = await request.json();
    const { jobId, newCleanerId, sendWhatsApp = true } = body;

    if (!jobId || !newCleanerId) {
      return NextResponse.json(
        { success: false, error: 'Job ID and Cleaner ID are required' },
        { status: 400 }
      );
    }

    // Get job
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
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get new cleaner
    const cleaner = await prisma.user.findUnique({
      where: { id: newCleanerId, role: 'CLEANER' },
      include: {
        Branch_User_primaryBranchIdToBranch: {
          select: {
            country: true,
            slug: true,
          },
        },
        TrainingStatus: {
          select: {
            overallStatus: true,
          },
        },
      },
    });

    // Get cleaner application separately (if exists)
    const cleanerApplication = cleaner
      ? await prisma.cleanerApplication.findFirst({
          where: { email: cleaner.email },
          orderBy: { createdAt: 'desc' },
          select: { phone: true },
        })
      : null;

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Check if Jamaica branch
    const isJamaicaBranch =
      job.Branch.country === 'Jamaica' ||
      job.Branch.country === 'JM' ||
      job.Branch.slug === 'port-antonio';

    // For Jamaica, check training status
    if (isJamaicaBranch) {
      if (cleaner.TrainingStatus?.overallStatus !== 'PASSED') {
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

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCleanerId: newCleanerId,
        status: isJamaicaBranch && sendWhatsApp ? ('pending' as JobStatus) : 'ASSIGNED',
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

    // Send WhatsApp job offer for Jamaica branches
    if (isJamaicaBranch && sendWhatsApp) {
      const cleanerPhone =
        cleanerApplication?.phone ||
        cleaner.email;

      if (cleanerPhone) {
        try {
          const jobInfo = {
            jobId: job.id,
            customerName: job.customerName || (job.Customer ? `${job.Customer.firstName} ${job.Customer.lastName}` : 'Customer'),
            address: job.address || 'Address TBD',
            preferredDate: job.preferredDate,
            preferredTime: job.preferredTime,
            serviceType: job.serviceType,
            totalPrice: job.totalPrice,
            currency: job.currency || 'JMD',
          };

          await sendJobOffer(cleanerPhone, jobInfo);
        } catch (whatsappError) {
          console.error('Error sending WhatsApp job offer:', whatsappError);
          // Don't fail the reassignment if WhatsApp fails
        }
      }
    }

    await awaitJobCalendarSync(jobId);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: isJamaicaBranch && sendWhatsApp
        ? 'Job reassigned. WhatsApp offer sent to cleaner.'
        : 'Job reassigned successfully.',
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('Reassign job error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reassign job' },
      { status: 500 }
    );
  }
}

