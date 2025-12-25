export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCleaner } from '@/lib/cleanerAuth';
import { prisma } from '@/lib/prisma';
import type { CleanerJob } from '@/app/cleaners/components/JobCard';

/**
 * Get Cleaner's Jobs API
 * 
 * GET /api/cleaners/jobs?todayOnly=true&upcomingOnly=true
 * 
 * Returns: { success: true, jobs: CleanerJob[] }
 */

export async function GET(request: NextRequest) {
  try {
    // Authenticate cleaner
    const authResult = await getAuthenticatedCleaner(request);

    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get cleaner with branch information
    const cleaner = await prisma.user.findUnique({
      where: { id: authResult.cleanerId },
      include: {
        Branch_User_primaryBranchIdToBranch: {
          select: { id: true },
        },
        UserBranch: {
          include: {
            Branch: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Get cleaner's branch IDs (primary + assigned)
    const branchIds = [
      cleaner.primaryBranchId,
      ...cleaner.UserBranch.map(ub => ub.Branch.id),
    ].filter(Boolean) as string[];

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const todayOnly = searchParams.get('todayOnly') === 'true';
    const upcomingOnly = searchParams.get('upcomingOnly') === 'true';

    // Build date filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch jobs from database, filtered by branch
    const whereClause: any = {
      assignedCleanerId: authResult.cleanerId,
      branchId: { in: branchIds }, // Filter by cleaner's branches (Miami + any others)
    };

    if (todayOnly) {
      whereClause.preferredDate = {
        gte: today,
        lt: tomorrow,
      };
    } else if (upcomingOnly) {
      whereClause.preferredDate = {
        gte: today,
      };
      whereClause.status = {
        notIn: ['COMPLETED', 'CANCELLED'],
      };
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        Customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { preferredDate: 'asc' },
        { preferredTime: 'asc' },
      ],
    });

    // Convert database jobs to CleanerJob format
    const cleanerJobs: CleanerJob[] = jobs.map((job) => {
      // Map serviceLocation based on branch slug (for backward compatibility)
      let serviceLocation: 'new_jersey' | 'vermont' = 'new_jersey';
      if (job.Branch?.slug === 'vermont') {
        serviceLocation = 'vermont';
      } else if (job.Branch?.slug === 'miami') {
        // Miami maps to new_jersey for now (can be extended later)
        serviceLocation = 'new_jersey';
      }

      return {
        id: job.id,
        sessionId: job.id, // Use job ID as sessionId for compatibility
        customerName: job.Customer?.name || 'Unknown Customer',
        address: job.address || '',
        serviceType: job.serviceType || '',
        preferredDate: job.preferredDate.toISOString().split('T')[0],
        preferredTime: job.preferredTime || 'Morning',
        serviceLocation,
        status: job.status.toLowerCase() as CleanerJob['status'],
        specialInstructions: job.specialInstructions || undefined,
        phone: job.Customer?.phone || undefined,
        totalPrice: job.totalPrice ? Number(job.totalPrice) : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      jobs: cleanerJobs,
    });
  } catch (error: any) {
    console.error('Get cleaner jobs error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

/**
 * Update Job Status
 * 
 * PATCH /api/cleaners/jobs
 * 
 * Body: { jobId: string, status: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate cleaner
    const authResult = await getAuthenticatedCleaner(request);

    if (!authResult.success || !authResult.cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId, status } = body;

    if (!jobId || !status) {
      return NextResponse.json(
        { success: false, error: 'jobId and status are required' },
        { status: 400 }
      );
    }

    // Validate status and map to database enum
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'assigned': 'ASSIGNED',
      'confirmed': 'CONFIRMED',
      'on_the_way': 'ON_THE_WAY',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
    };

    const dbStatus = statusMap[status.toLowerCase()];
    if (!dbStatus) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get job from database
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        Customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    // Verify job belongs to this cleaner
    if (job.assignedCleanerId !== authResult.cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Job does not belong to this cleaner' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: dbStatus,
      updatedAt: new Date(),
    };

    // Track timestamps for performance metrics
    const now = new Date();

    if (status === 'completed') {
      updateData.completedAt = now;
      // Keep existing onTheWayAt if not set
      if (!job.onTheWayAt) {
        updateData.onTheWayAt = job.onTheWayAt || now;
      }
    } else if (status === 'on_the_way') {
      updateData.onTheWayAt = now;
      // Track when assigned if not already set
      if (!job.assignedAt) {
        updateData.assignedAt = job.assignedAt || now;
      }
    } else if (status === 'cancelled') {
      updateData.cancelledAt = now;
    } else if (status === 'assigned' || status === 'confirmed') {
      // Track assignment timestamp
      if (!job.assignedAt) {
        updateData.assignedAt = now;
      }
    }

    // Update job in database
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: {
        Customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Send review request if job is completed
    if (status === 'completed' && updatedJob.Customer?.phone) {
      try {
        const { sendReviewRequest } = await import('../../../../lib/sendReviewRequest');
        const whatsappToken = process.env.WHATSAPP_TOKEN;
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (whatsappToken && whatsappPhoneNumberId) {
          const customerName = updatedJob.Customer.name || 'Customer';

          // Send review request (non-blocking)
          sendReviewRequest({
            phoneNumberId: whatsappPhoneNumberId,
            accessToken: whatsappToken,
            customerPhone: updatedJob.Customer.phone,
            customerName,
            serviceDate: updatedJob.preferredDate.toISOString().split('T')[0],
            jobId,
          }).catch((error) => {
            console.error('Failed to send review request:', error);
            // Don't fail the status update if review request fails
          });
        }
      } catch (error) {
        console.error('Error sending review request:', error);
        // Don't fail the status update if review request fails
      }
    }

    // Convert to CleanerJob format
    let serviceLocation: 'new_jersey' | 'vermont' = 'new_jersey';
    if (updatedJob.Branch?.slug === 'vermont') {
      serviceLocation = 'vermont';
    } else if (updatedJob.Branch?.slug === 'miami') {
      serviceLocation = 'new_jersey'; // Miami maps to new_jersey for now
    }

    const cleanerJob: CleanerJob = {
      id: updatedJob.id,
      sessionId: updatedJob.id,
      customerName: updatedJob.Customer?.name || 'Unknown Customer',
      address: updatedJob.address || '',
      serviceType: updatedJob.serviceType || '',
      preferredDate: updatedJob.preferredDate.toISOString().split('T')[0],
      preferredTime: updatedJob.preferredTime || 'Morning',
      serviceLocation,
      status: status.toLowerCase() as CleanerJob['status'],
      specialInstructions: updatedJob.specialInstructions || undefined,
      phone: updatedJob.Customer?.phone || undefined,
      totalPrice: updatedJob.totalPrice ? Number(updatedJob.totalPrice) : undefined,
    };

    return NextResponse.json({
      success: true,
      job: cleanerJob,
    });
  } catch (error: any) {
    console.error('Update job status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update job status' },
      { status: 500 }
    );
  }
}

