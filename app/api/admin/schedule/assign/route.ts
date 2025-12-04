export const dynamic = 'force-dynamic'
/**
 * Assign Cleaner to Job API
 * POST /api/admin/schedule/assign
 * 
 * Assigns a cleaner to a job and sends WhatsApp notification (Jamaica only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendJobOffer } from '@/app/services/whatsappService';

interface AssignRequest {
  jobId: string;
  cleanerId: string;
  sendWhatsApp?: boolean; // Default true for Jamaica
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

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

    // Get cleaner
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
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
        assignedCleanerId: cleanerId,
        status: isJamaicaBranch && sendWhatsApp ? 'pending' : 'assigned', // For Jamaica, wait for WhatsApp acceptance
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
        cleaner.email; // Fallback to email if no phone

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
          // Don't fail the assignment if WhatsApp fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: isJamaicaBranch && sendWhatsApp
        ? 'Job assigned. WhatsApp offer sent to cleaner.'
        : 'Job assigned successfully.',
    });
  } catch (error: any) {
    console.error('Assign job error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign job' },
      { status: 500 }
    );
  }
}

