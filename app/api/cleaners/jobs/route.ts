export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { findCleanerById } from '@/utils/cleanerData';
import type { CleanerJob } from '@/utils/cleanerData';

/**
 * Get Cleaner's Jobs API
 * 
 * GET /api/cleaners/jobs?todayOnly=true&upcomingOnly=true
 * 
 * Returns: { success: true, jobs: CleanerJob[] }
 */

// Initialize Stripe
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

/**
 * Convert Stripe session to CleanerJob
 */
function sessionToCleanerJob(
  session: Stripe.Checkout.Session,
  cleanerId: string
): CleanerJob | null {
  const metadata = session.metadata || {};
  
  // Check if job is assigned to this cleaner
  if (metadata.assignedCleanerPhone) {
    // We'll match by phone since that's what we store
    // TODO: Use assignedCleanerId when available in metadata
  }

  const firstName = metadata.firstName || '';
  const lastInitial = metadata.lastInitial || '';
  const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

  if (!customerName || !metadata.preferredDate) {
    return null;
  }

  // Determine status from metadata
  let status: CleanerJob['status'] = 'assigned';
  if (metadata.completed === 'true') {
    status = 'completed';
  } else if (metadata.cancelled === 'true') {
    status = 'cancelled';
  } else if (metadata.onTheWay === 'true') {
    status = 'on_the_way';
  } else if (metadata.assignedCleanerPhone) {
    status = 'confirmed';
  }

  return {
    id: session.id,
    sessionId: session.id,
    customerName,
    address: metadata.address || '',
    serviceType: metadata.serviceType || '',
    preferredDate: metadata.preferredDate || '',
    preferredTime: metadata.preferredTime || 'Morning',
    serviceLocation: (metadata.serviceLocation as 'new_jersey' | 'vermont') || 'new_jersey',
    status,
    assignedCleanerId: cleanerId,
    specialInstructions: metadata.specialInstructions,
    phone: metadata.phone || '',
    email: metadata.email || session.customer_email || '',
    totalPrice: session.amount_total ? session.amount_total / 100 : 0,
  };
}

/**
 * Get cleaner's jobs from Stripe
 */
async function getCleanerJobsFromStripe(
  cleanerId: string,
  cleanerPhone: string
): Promise<CleanerJob[]> {
  const stripe = getStripe();
  const jobs: CleanerJob[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete',
      starting_after: startingAfter,
    });

    for (const session of sessions.data) {
      const metadata = session.metadata || {};
      
      // Check if this job is assigned to this cleaner
      if (metadata.assignedCleanerPhone === cleanerPhone) {
        // TODO: Also check branchId if cleaner has multiple branch assignments
        // For now, phone match is sufficient
        // When branchId is in metadata:
        //   const cleanerBranchIds = getUserBranchIds(cleanerId);
        //   if (metadata.branchId && cleanerBranchIds.includes(metadata.branchId)) {
        //     ... add job
        //   }
        const job = sessionToCleanerJob(session, cleanerId);
        if (job) {
          jobs.push(job);
        }
      }
    }

    hasMore = sessions.has_more;
    if (hasMore && sessions.data.length > 0) {
      startingAfter = sessions.data[sessions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return jobs;
}

export async function GET(request: NextRequest) {
  try {
    // Get cleaner ID from cookie
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find cleaner
    const cleaner = findCleanerById(cleanerId);
    if (!cleaner || !cleaner.active) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found or inactive' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const todayOnly = searchParams.get('todayOnly') === 'true';
    const upcomingOnly = searchParams.get('upcomingOnly') === 'true';

    // Fetch jobs from Stripe
    const allJobs = await getCleanerJobsFromStripe(cleaner.id, cleaner.phone);

    // TODO: Filter jobs by branch access
    // When moving to database:
    // 1. Get cleaner's assigned branches via getUserBranchIds(cleaner.id)
    // 2. Filter jobs where job.branchId is in cleaner's branch list
    // For now, jobs are filtered by assignedCleanerPhone match
    // Branch filtering will be added when branchId is stored in Stripe metadata

    // Filter jobs
    let filteredJobs = allJobs;

    if (todayOnly) {
      const today = new Date().toISOString().split('T')[0];
      filteredJobs = filteredJobs.filter((job) => job.preferredDate === today);
    }

    if (upcomingOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredJobs = filteredJobs.filter((job) => {
        const jobDate = new Date(job.preferredDate);
        return jobDate >= today && job.status !== 'completed' && job.status !== 'cancelled';
      });
    }

    // Sort by date and time
    filteredJobs.sort((a, b) => {
      const dateCompare = a.preferredDate.localeCompare(b.preferredDate);
      if (dateCompare !== 0) return dateCompare;
      return a.preferredTime.localeCompare(b.preferredTime);
    });

    return NextResponse.json({
      success: true,
      jobs: filteredJobs,
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
    // Get cleaner ID from cookie
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find cleaner
    const cleaner = findCleanerById(cleanerId);
    if (!cleaner || !cleaner.active) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found or inactive' },
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

    // Validate status
    const validStatuses = ['pending', 'assigned', 'confirmed', 'on_the_way', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get Stripe session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(jobId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify job belongs to this cleaner
    const metadata = session.metadata || {};
    if (metadata.assignedCleanerPhone !== cleaner.phone) {
      return NextResponse.json(
        { success: false, error: 'Job does not belong to this cleaner' },
        { status: 403 }
      );
    }

    // Update metadata with new status and timestamps
    const updatedMetadata = {
      ...metadata,
    };

    // Track timestamps for performance metrics
    const now = new Date().toISOString();

    if (status === 'completed') {
      updatedMetadata.completed = 'true';
      updatedMetadata.completedAt = now;
      // Keep existing onTheWayAt if not set
      if (!updatedMetadata.onTheWayAt && metadata.onTheWay === 'true') {
        updatedMetadata.onTheWayAt = metadata.onTheWayAt || now;
      }
    } else if (status === 'on_the_way') {
      updatedMetadata.onTheWay = 'true';
      updatedMetadata.onTheWayAt = now;
      // Track when assigned if not already set
      if (!updatedMetadata.assignedAt) {
        updatedMetadata.assignedAt = metadata.assignedCleanerAt || now;
      }
    } else if (status === 'cancelled') {
      updatedMetadata.cancelled = 'true';
      updatedMetadata.cancelledAt = now;
    } else if (status === 'assigned' || status === 'confirmed') {
      // Track assignment timestamp
      if (!updatedMetadata.assignedAt) {
        updatedMetadata.assignedAt = metadata.assignedCleanerAt || now;
      }
    }

    // Update Stripe session metadata
    await stripe.checkout.sessions.update(jobId, {
      metadata: updatedMetadata,
    });

    // Send review request if job is completed
    if (status === 'completed') {
      try {
        const { sendReviewRequest } = await import('@/lib/sendReviewRequest');
        const whatsappToken = process.env.WHATSAPP_TOKEN;
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (whatsappToken && whatsappPhoneNumberId && metadata.phone) {
          const firstName = metadata.firstName || '';
          const lastInitial = metadata.lastInitial || '';
          const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

          if (customerName) {
            // Send review request (non-blocking)
            sendReviewRequest({
              phoneNumberId: whatsappPhoneNumberId,
              accessToken: whatsappToken,
              customerPhone: metadata.phone,
              customerName,
              serviceDate: metadata.preferredDate || new Date().toISOString().split('T')[0],
              jobId,
            }).catch((error) => {
              console.error('Failed to send review request:', error);
              // Don't fail the status update if review request fails
            });
          }
        }
      } catch (error) {
        console.error('Error sending review request:', error);
        // Don't fail the status update if review request fails
      }
    }

    // Convert to CleanerJob format
    const job = sessionToCleanerJob(session, cleaner.id);
    if (job) {
      job.status = status as CleanerJob['status'];
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('Update job status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update job status' },
      { status: 500 }
    );
  }
}

