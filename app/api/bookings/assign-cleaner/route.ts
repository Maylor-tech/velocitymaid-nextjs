import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendCleanerAssignment, validateCleanerRegion } from '@/lib/sendCleanerAssignment';
import { formatLocation } from '@/lib/whatsappRouter';
import { isCleanerTrainingEligible } from '@/utils/trainingEligibility';
import { prisma } from '@/lib/prisma';

/**
 * Assign Cleaner to Booking API Route
 * 
 * Assigns a cleaner to a booking and sends WhatsApp notification.
 * 
 * POST /api/bookings/assign-cleaner
 * 
 * Body:
 * {
 *   "sessionId": "cs_test_...",
 *   "cleaner": {
 *     "phone": "+1234567890",
 *     "name": "John Cleaner" (optional)
 *   }
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
  const startTime = Date.now();
  const log: string[] = [];

  try {
    const body = await request.json();
    const { sessionId, cleaner } = body;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: sessionId',
        },
        { status: 400 }
      );
    }

    if (!cleaner || !cleaner.phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: cleaner.phone',
        },
        { status: 400 }
      );
    }

    log.push(`[${new Date().toISOString()}] Assigning cleaner to booking ${sessionId}`);

    // Get Stripe session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking session not found',
        },
        { status: 404 }
      );
    }

    const metadata = session.metadata || {};

    // Check if cleaner already assigned
    const currentAssignedCleaner = metadata.assignedCleanerPhone;
    if (currentAssignedCleaner && currentAssignedCleaner === cleaner.phone) {
      log.push('Cleaner already assigned to this booking');
      return NextResponse.json({
        success: true,
        message: 'Cleaner already assigned',
        cleanerAlertSent: metadata.cleanerAlertSent === 'true',
        log,
      });
    }

    // Extract booking data from metadata
    const firstName = metadata.firstName || '';
    const lastInitial = metadata.lastInitial || '';
    const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

    if (!customerName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer name not found in booking metadata',
        },
        { status: 400 }
      );
    }

    const serviceLocation = metadata.serviceLocation || 'new_jersey'; // Default to NJ if not specified

    const booking: {
      customerName: string;
      serviceType: string;
      preferredDate: string;
      preferredTime: string;
      address: string;
      serviceLocation: string;
    } = {
      customerName,
      serviceType: metadata.serviceType || '',
      preferredDate: metadata.preferredDate || '',
      preferredTime: metadata.preferredTime || 'Morning',
      address: metadata.address || '',
      serviceLocation,
    };

    // Validate booking data
    if (!booking.serviceType || !booking.preferredDate || !booking.address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing booking data: serviceType, preferredDate, or address not found in metadata',
        },
        { status: 400 }
      );
    }

    // Validate cleaner belongs to the booking's service region
    const regionValidationError = validateCleanerRegion(cleaner.phone, serviceLocation);
    if (regionValidationError) {
      log.push(`REGION VALIDATION FAILED: ${regionValidationError}`);
      return NextResponse.json(
        {
          success: false,
          error: regionValidationError,
          serviceLocation,
          region: formatLocation(serviceLocation),
        },
        { status: 400 }
      );
    }

    log.push(`Region validation passed: Cleaner ${cleaner.phone} is valid for ${formatLocation(serviceLocation)}`);

    // Check training eligibility for Jamaica branch
    // Find cleaner user by phone (check applications first, then users)
    let cleanerUser = null;
    
    // Try to find by application phone
    const cleanerApplication = await prisma.cleanerApplication.findFirst({
      where: {
        phone: cleaner.phone,
        status: 'APPROVED',
      },
      include: {
        branch: {
          select: {
            country: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (cleanerApplication) {
      // Find user by email from application
      cleanerUser = await prisma.user.findUnique({
        where: { email: cleanerApplication.email },
        include: {
          primaryBranch: {
            select: {
              country: true,
              slug: true,
            },
          },
        },
      });
    } else {
      // Try to find user directly (if phone is stored somewhere)
      // For now, we'll check if this is a Jamaica booking
      const isJamaicaBooking = serviceLocation?.toLowerCase().includes('jamaica') ||
                               serviceLocation?.toLowerCase().includes('port-antonio');
      
      if (isJamaicaBooking) {
        log.push(`WARNING: Could not find cleaner application for ${cleaner.phone}. Training check skipped.`);
        // For safety, we'll allow assignment but log the warning
        // In production, you may want to require finding the user
      }
    }

    if (cleanerUser) {
      const isJamaicaBranch =
        cleanerUser.primaryBranch?.country === 'Jamaica' ||
        cleanerUser.primaryBranch?.country === 'JM' ||
        cleanerUser.primaryBranch?.slug === 'port-antonio';

      if (isJamaicaBranch) {
        const eligibility = await isCleanerTrainingEligible(cleanerUser.id);
        if (!eligibility.eligible) {
          log.push(`TRAINING CHECK FAILED: ${eligibility.reason}`);
          return NextResponse.json(
            {
              success: false,
              error: eligibility.reason || 'Training not completed',
              trainingRequired: true,
              trainingStatus: eligibility.trainingStatus,
            },
            { status: 403 }
          );
        }
        log.push(`Training check passed: Cleaner has completed training`);
      }
    }

    // Get WhatsApp credentials
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !whatsappPhoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp credentials not configured',
        },
        { status: 500 }
      );
    }

    // Send WhatsApp notification to cleaner (non-blocking)
    let cleanerAlertSent = false;
    let messageId: string | undefined;

    try {
      log.push(`Sending WhatsApp notification to cleaner ${cleaner.phone}...`);
      
      const result = await sendCleanerAssignment(
        whatsappPhoneNumberId,
        whatsappToken,
        {
          phone: cleaner.phone,
          name: cleaner.name,
        },
        booking
      );

      if (result.success) {
        cleanerAlertSent = true;
        messageId = result.messageId;
        log.push(`SUCCESS: Cleaner notification sent (Message ID: ${result.messageId})`);
      } else {
        log.push(`FAILED: Cleaner notification failed - ${result.error}`);
        // Don't fail the assignment if WhatsApp fails
      }
    } catch (error: any) {
      log.push(`ERROR: Exception sending cleaner notification - ${error.message}`);
      // Don't fail the assignment if WhatsApp fails
    }

    // Update Stripe session metadata with assigned cleaner
    try {
      await stripe.checkout.sessions.update(sessionId, {
        metadata: {
          ...metadata,
          assignedCleanerPhone: cleaner.phone,
          assignedCleanerName: cleaner.name || '',
          assignedCleanerAt: new Date().toISOString(),
          cleanerAlertSent: cleanerAlertSent ? 'true' : 'false',
          cleanerAlertMessageId: messageId || '',
        },
      });
      log.push('Stripe metadata updated with cleaner assignment');
    } catch (error: any) {
      log.push(`WARNING: Failed to update Stripe metadata - ${error.message}`);
      // Continue even if metadata update fails
    }

    const duration = Date.now() - startTime;
    log.push(`Assignment completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Cleaner assigned successfully',
      cleanerAlertSent,
      messageId,
      cleaner: {
        phone: cleaner.phone,
        name: cleaner.name,
      },
      booking: {
        customerName: booking.customerName,
        serviceType: booking.serviceType,
        scheduledDate: booking.preferredDate,
        timeSlot: booking.preferredTime,
        address: booking.address,
        serviceLocation: booking.serviceLocation,
        region: formatLocation(booking.serviceLocation),
      },
      log,
      duration: `${duration}ms`,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    log.push(`ERROR: ${error.message}`);
    log.push(`Failed after ${duration}ms`);

    console.error('Cleaner assignment error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to assign cleaner',
        log,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

