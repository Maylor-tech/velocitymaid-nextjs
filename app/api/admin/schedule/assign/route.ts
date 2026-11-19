export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'
/**
 * Assign Cleaner to Job API
 * POST /api/admin/schedule/assign
 * 
 * Assigns a cleaner to a job and sends WhatsApp notification (Jamaica only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { JobStatus } from "@prisma/client";
import { prisma } from '@/lib/prisma';
import { sendJobOffer } from '@/app/services/whatsappService';
import { awaitJobCalendarSync } from '@/lib/google/jobGoogleSync';

interface AssignRequest {
  jobId: string;
  cleanerId: string;
  sendWhatsApp?: boolean; // Default true for Jamaica
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const body: AssignRequest = await request.json();
    const { jobId, cleanerId, sendWhatsApp = true } = body;

    if (!jobId || !cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Job ID and Cleaner ID are required' },
        { status: 400 }
      );
    }

    // Get job with branch info
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

    // Get cleaner
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
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
        assignedCleanerId: cleanerId,
        status: isJamaicaBranch && sendWhatsApp ? ('pending' as JobStatus) : 'ASSIGNED', // For Jamaica, wait for WhatsApp acceptance
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
        cleaner.email; // Fallback to email if no phone

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
          // Don't fail the assignment if WhatsApp fails
        }
      }
    }

    await awaitJobCalendarSync(jobId);

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: isJamaicaBranch && sendWhatsApp
        ? 'Job assigned. WhatsApp offer sent to cleaner.'
        : 'Job assigned successfully.',
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('Assign job error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign job' },
      { status: 500 }
    );
  }
}

