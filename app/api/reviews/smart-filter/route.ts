/**
 * Smart Review Filter API
 * POST /api/reviews/smart-filter
 * 
 * Routes reviews based on rating:
 * - Rating >= 5 → redirect to Google review URL
 * - Rating = 4 → save internal review + thank-you message
 * - Rating <= 3 → create complaint record + trigger WhatsApp apology workflow
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createReview } from '@/utils/reviewData';
import { createComplaint } from '@/utils/complaintData';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';

const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_NJ_GOOGLE_REVIEW_URL || 'https://g.page/r/YOUR_GOOGLE_REVIEW_URL';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, cleanerId, rating, comment, requestReclean, serviceLocation, customerId, customerPhone } = body;

    // Validations
    if (!jobId || !cleanerId || !rating || !serviceLocation) {
      return NextResponse.json(
        { success: false, error: 'jobId, cleanerId, rating, and serviceLocation are required' },
        { status: 400 }
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Branch-aware: Only process NJ reviews
    if (serviceLocation !== 'new_jersey') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is for New Jersey reviews only' },
        { status: 400 }
      );
    }

    const roundedRating = Math.round(rating);

    // Rating >= 5: Redirect to Google Review
    if (roundedRating >= 5) {
      // Save internal review first
      const review = createReview({
        jobId,
        cleanerId,
        serviceLocation: 'new_jersey',
        rating: roundedRating,
        comment: comment?.trim() || undefined,
        requestReclean: false,
      });

      // Update customer status if provided
      if (customerId) {
        await prisma.customer.update({
          where: { id: customerId },
          data: { leadStatus: 'BOOKED' },
        }).catch(() => {
          // Ignore if customer not found
        });
      }

      return NextResponse.json({
        success: true,
        action: 'redirect_google',
        googleReviewUrl: GOOGLE_REVIEW_URL,
        reviewId: review.id,
        message: 'Thank you for the 5-star rating! Redirecting to Google...',
      });
    }

    // Rating = 4: Save internal review + thank-you message
    if (roundedRating === 4) {
      const review = createReview({
        jobId,
        cleanerId,
        serviceLocation: 'new_jersey',
        rating: roundedRating,
        comment: comment?.trim() || undefined,
        requestReclean: requestReclean || false,
      });

      // Send thank-you message if phone provided
      if (customerPhone) {
        const thankYouMessage = `Thank you for your 4-star review! We're glad you enjoyed our service. 

Is there anything we could improve? Reply to this message and we'll make it right! 🙏`;
        
        await sendWhatsAppMessage(customerPhone, thankYouMessage).catch((error) => {
          console.error('Failed to send thank-you message:', error);
        });
      }

      return NextResponse.json({
        success: true,
        action: 'saved_internal',
        reviewId: review.id,
        message: 'Thank you for your feedback! We appreciate your review.',
      });
    }

    // Rating <= 3: Create complaint + trigger WhatsApp apology
    if (roundedRating <= 3) {
      // Get job to fetch customer name
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      const customerName = job?.customer
        ? `${job.customer.firstName} ${job.customer.lastName}`
        : job?.customerName || 'Customer';

      // Save internal review
      const review = createReview({
        jobId,
        cleanerId,
        serviceLocation: 'new_jersey',
        rating: roundedRating,
        comment: comment?.trim() || undefined,
        requestReclean: requestReclean || false,
      });

      // Create complaint record
      const complaint = createComplaint({
        reviewId: review.id,
        jobId,
        cleanerId,
        serviceLocation: 'new_jersey',
        customerName,
        customerPhone: customerPhone || job?.customer?.phone || '',
        rating: roundedRating,
        comment: comment?.trim() || `Low rating: ${roundedRating} stars`,
        requestReclean: requestReclean || false,
        status: 'pending',
        resolutionType: null,
        adminNotes: null,
      });

      // Send WhatsApp apology if phone provided
      if (customerPhone) {
        const apologyMessage = `We're sorry your experience wasn't perfect. 😔

We take your feedback seriously and want to make this right. Our team will reach out to you within 24 hours to resolve this.

Thank you for giving us the opportunity to improve. 🙏`;
        
        await sendWhatsAppMessage(customerPhone, apologyMessage).catch((error) => {
          console.error('Failed to send apology message:', error);
        });
      }

      // Notify admin (in production, send to admin dashboard/webhook)
      console.log('Low rating complaint created:', {
        complaintId: complaint.id,
        rating: roundedRating,
        jobId,
        cleanerId,
      });

      return NextResponse.json({
        success: true,
        action: 'complaint_created',
        reviewId: review.id,
        complaintId: complaint.id,
        message: 'We apologize for the inconvenience. Our team will contact you shortly.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid rating' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Smart review filter error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process review' },
      { status: 500 }
    );
  }
}

