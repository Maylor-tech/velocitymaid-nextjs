export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { createReview, getReviewsByJobId } from '@/utils/reviewData';
import Stripe from 'stripe';
import { sendAdminLowRatingAlert } from '@/lib/sendAdminLowRatingAlert';
import { createComplaint } from '@/utils/complaintData';
import { sendComplaintAlert } from '@/lib/sendComplaintAlert';

/**
 * Create Review API
 * 
 * POST /api/reviews/create
 * 
 * Body: {
 *   jobId: string,
 *   cleanerId: string,
 *   rating: number (1-5),
 *   comment?: string,
 *   requestReclean?: boolean,
 *   serviceLocation: "new_jersey" | "vermont"
 * }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, cleanerId, rating, comment, requestReclean, serviceLocation } = body;

    // Validations
    if (!jobId || !cleanerId || !serviceLocation) {
      return NextResponse.json(
        { success: false, error: 'jobId, cleanerId, and serviceLocation are required' },
        { status: 400 }
      );
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (serviceLocation !== 'new_jersey' && serviceLocation !== 'vermont') {
      return NextResponse.json(
        { success: false, error: 'serviceLocation must be "new_jersey" or "vermont"' },
        { status: 400 }
      );
    }

    // Check if review already exists for this job
    const existingReviews = getReviewsByJobId(jobId);
    if (existingReviews.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Review already exists for this job' },
        { status: 409 }
      );
    }

    // Verify job exists in Stripe
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(jobId);
      
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Create review
    const review = createReview({
      jobId,
      cleanerId,
      serviceLocation,
      rating: Math.round(rating),
      comment: comment?.trim() || undefined,
      requestReclean: requestReclean || false,
    });

    // Auto-create complaint if rating <= 3 OR requestReclean is true
    let complaintId: string | null = null;
    if (rating <= 3 || requestReclean) {
      try {
        // Get customer info from Stripe session
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(jobId);
        const metadata = session.metadata || {};
        
        const firstName = metadata.firstName || '';
        const lastInitial = metadata.lastInitial || '';
        const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

        if (customerName && metadata.phone) {
          const complaint = createComplaint({
            jobId,
            reviewId: review.id,
            cleanerId: cleanerId || null,
            serviceLocation,
            customerName,
            customerPhone: metadata.phone,
            rating: Math.round(rating),
            comment: comment?.trim() || null,
            requestReclean: requestReclean || false,
            status: 'pending',
            resolutionType: null,
            adminNotes: null,
          });

          complaintId = complaint.id;

          // Send complaint alert (non-blocking)
          sendComplaintAlert(complaint).catch((error) => {
            console.error('Failed to send complaint alert:', error);
          });
        }
      } catch (error) {
        console.error('Failed to create complaint:', error);
        // Don't fail review creation if complaint creation fails
      }
    }

    // Trigger low-rating alert if rating <= 3 (legacy alert, complaint alert is primary)
    if (rating <= 3) {
      try {
        await sendAdminLowRatingAlert(review);
      } catch (error) {
        console.error('Failed to send low-rating alert:', error);
        // Don't fail the review creation if alert fails
      }
    }

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      review,
      complaintId, // Include complaint ID if created
    });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}

