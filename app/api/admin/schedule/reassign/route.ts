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
        branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
          },
        },
        customer: {
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
        primaryBranch: {
          select: {
            country: true,
            slug: true,
          },
        },
        trainingStatus: {
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
      job.branch.country === 'Jamaica' ||
      job.branch.country === 'JM' ||
      job.branch.slug === 'port-antonio';

    // For Jamaica, check training status
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

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCleanerId: newCleanerId,
        status: isJamaicaBranch && sendWhatsApp ? 'pending' : 'assigned',
        assignedAt: new Date(),
      },
      include: {
        assignedCleaner: {
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
            customerName: job.customerName || (job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'Customer'),
            address: job.address || 'Address TBD',
            preferredDate: job.preferredDate,
            preferredTime: job.preferredTime,
            serviceType: job.serviceType,
            totalPrice: job.totalPrice,
            currency: job.currency || 'JMD',
          };

          await sendJobOffer(cleanerPhone, jobInfo);
        } catch (whatsappError: any) {
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
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('Reassign job error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reassign job' },
      { status: 500 }
    );
  }
}

