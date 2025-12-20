export const dynamic = 'force-dynamic';

/**
 * Change Cleaner Assignment API
 * POST /api/admin/jobs/change-cleaner
 * 
 * Changes the assigned cleaner for a job
 * Body: { jobId: string, cleanerId: string, sendWhatsApp?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';
import { sendCleanerAssignment } from '@/lib/sendCleanerAssignment';

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

    if (!cleaner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cleaner not found',
        },
        { status: 404 }
      );
    }

    // Check if Jamaica branch - verify training
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

    // Update job assignment
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedCleanerId: cleanerId,
        status: job.status === 'pending' ? 'assigned' : job.status,
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
      message: 'Cleaner assignment updated successfully',
    });
  } catch (error: any) {
    console.error('Error changing cleaner assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to change cleaner assignment',
      },
      { status: 500 }
    );
  }
}

