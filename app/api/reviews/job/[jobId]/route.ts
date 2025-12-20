import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getReviewsByJobId } from '@/utils/reviewData';

/**
 * Get Job Details for Review Page
 * 
 * GET /api/reviews/job/[jobId]
 * 
 * Returns: Job details needed for review page
 */
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Get job from Stripe
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(jobId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    const metadata = session.metadata || {};
    const firstName = metadata.firstName || '';
    const lastInitial = metadata.lastInitial || '';
    const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

    // Check if review already exists
    const existingReviews = getReviewsByJobId(jobId);
    const hasReview = existingReviews.length > 0;

    // Get cleaner info from metadata
    const assignedCleanerName = metadata.assignedCleanerName || 'Your Cleaner';
    const assignedCleanerId = metadata.assignedCleanerPhone || ''; // Using phone as ID for now

    return NextResponse.json({
      success: true,
      job: {
        id: jobId,
        customerName,
        cleanerName: assignedCleanerName,
        cleanerId: assignedCleanerId,
        serviceDate: metadata.preferredDate || '',
        serviceTime: metadata.preferredTime || '',
        serviceType: metadata.serviceType || '',
        serviceLocation: metadata.serviceLocation || 'new_jersey',
        address: metadata.address || '',
      },
      hasReview,
      existingReview: hasReview ? existingReviews[0] : null,
    });
  } catch (error: any) {
    console.error('Get job details error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}




