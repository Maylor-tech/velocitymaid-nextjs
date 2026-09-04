export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { send24HourReminder } from '@/lib/whatsapp';

/**
 * 24-Hour WhatsApp Reminder Cron Job
 * 
 * This endpoint should be called daily at midnight (server time) to send
 * WhatsApp reminders to customers whose bookings are 24 hours away.
 * 
 * Setup:
 * - Vercel Cron: Add to vercel.json
 * - External Cron: Use a service like cron-job.org to call this endpoint
 * - Manual Testing: Call GET /api/cron/reminder-24h?test=true
 */

// Initialize Stripe
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

interface Booking {
  sessionId: string;
  customerName: string;
  phone: string;
  email: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  address: string;
  reminderSent: boolean;
}

/**
 * Check if a booking is exactly 24 hours away (within a 1-hour window)
 */
function is24HoursAway(dateString: string, timeString: string): boolean {
  try {
    // Parse date and time
    const bookingDate = new Date(dateString);
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    // Convert to 24-hour format
    let hour24 = hours;
    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period?.toUpperCase() === 'AM' && hours === 12) {
      hour24 = 0;
    }

    // Set the booking time
    bookingDate.setHours(hour24, minutes || 0, 0, 0);

    // Get current time
    const now = new Date();

    // Calculate time difference in hours
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Check if booking is between 23 and 25 hours away (1-hour window)
    return hoursUntilBooking >= 23 && hoursUntilBooking <= 25;
  } catch (error) {
    console.error('Error calculating 24-hour window:', error);
    return false;
  }
}

/**
 * Fetch completed Stripe checkout sessions with booking metadata
 */
async function fetchUpcomingBookings(): Promise<Booking[]> {
  const stripe = getStripe();
  const bookings: Booking[] = [];

  try {
    // Fetch completed checkout sessions from the last 7 days
    // (to catch bookings scheduled for the next few days)
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);

    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        status: 'complete',
        created: { gte: sevenDaysAgo },
        starting_after: startingAfter,
      });

      for (const session of sessions.data) {
        // Extract booking data from metadata
        const metadata = session.metadata || {};
        const preferredDate = metadata.preferredDate;
        const preferredTime = metadata.preferredTime;
        const phone = metadata.phone;
        const reminderSent = metadata.reminder24hSent === 'true';

        // Skip if missing required fields
        if (!preferredDate || !preferredTime || !phone) {
          continue;
        }

        // Check if reminder already sent
        if (reminderSent) {
          continue;
        }

        // Check if booking is 24 hours away
        if (!is24HoursAway(preferredDate, preferredTime)) {
          continue;
        }

        // Build customer name
        const firstName = metadata.firstName || '';
        const lastInitial = metadata.lastInitial || '';
        const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

        if (!customerName) {
          continue;
        }

        bookings.push({
          sessionId: session.id,
          customerName,
          phone,
          email: metadata.email || session.customer_email || '',
          serviceType: metadata.serviceType || '',
          preferredDate,
          preferredTime,
          address: metadata.address || '',
          reminderSent: false,
        });
      }

      hasMore = sessions.has_more;
      if (hasMore && sessions.data.length > 0) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('Error fetching bookings from Stripe:', error);
    throw error;
  }

  return bookings;
}

/**
 * Mark reminder as sent in Stripe metadata
 */
async function markReminderSent(sessionId: string): Promise<void> {
  const stripe = getStripe();
  try {
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        reminder24hSent: 'true',
        reminder24hSentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`Error marking reminder as sent for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Main cron job handler
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const log: string[] = [];
  
  log.push(`[${new Date().toISOString()}] Starting 24-hour reminder cron job`);

  try {
    // Verify required environment variables
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken) {
      log.push('ERROR: WHATSAPP_TOKEN environment variable is not set');
      return NextResponse.json(
        { error: 'WHATSAPP_TOKEN not configured', log },
        { status: 500 }
      );
    }

    if (!whatsappPhoneNumberId) {
      log.push('ERROR: WHATSAPP_PHONE_NUMBER_ID environment variable is not set');
      return NextResponse.json(
        { error: 'WHATSAPP_PHONE_NUMBER_ID not configured', log },
        { status: 500 }
      );
    }

    // Check for test mode
    const searchParams = request.nextUrl.searchParams;
    const isTest = searchParams.get('test') === 'true';

    if (isTest) {
      log.push('TEST MODE: Running in test mode');
    }

    // Fetch upcoming bookings
    log.push('Fetching upcoming bookings from Stripe...');
    const bookings = await fetchUpcomingBookings();
    log.push(`Found ${bookings.length} booking(s) requiring reminders`);

    if (bookings.length === 0) {
      log.push('No reminders to send');
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        remindersSent: 0,
        log,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Send reminders
    let successCount = 0;
    let failureCount = 0;
    const results: Array<{ booking: Booking; success: boolean; error?: string }> = [];

    for (const booking of bookings) {
      try {
        // Validate phone number exists
        if (!booking.phone || booking.phone.trim() === '') {
          log.push(`SKIP: Booking ${booking.sessionId} - No phone number`);
          results.push({
            booking,
            success: false,
            error: 'No phone number',
          });
          failureCount++;
          continue;
        }

        // Send WhatsApp reminder
        log.push(`Sending reminder to ${booking.customerName} (${booking.phone})...`);
        
        const result = await send24HourReminder(
          whatsappPhoneNumberId,
          whatsappToken,
          booking.phone,
          booking.customerName,
          booking.serviceType,
          booking.preferredDate,
          booking.preferredTime,
          booking.address
        );

        if (result.success) {
          // Mark reminder as sent in Stripe
          await markReminderSent(booking.sessionId);
          log.push(`SUCCESS: Reminder sent to ${booking.customerName} (Message ID: ${result.messageId})`);
          successCount++;
          results.push({ booking, success: true });
        } else {
          log.push(`FAILED: Reminder failed for ${booking.customerName} - ${result.error}`);
          failureCount++;
          results.push({
            booking,
            success: false,
            error: result.error,
          });
        }

        // Rate limiting: Wait 1 second between messages to avoid API limits
        if (!isTest) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error: unknown) {
        log.push(`ERROR: Exception sending reminder to ${booking.customerName} - ${(error instanceof Error ? error.message : undefined)}`);
        failureCount++;
        results.push({
          booking,
          success: false,
          error: (error instanceof Error ? error.message : undefined),
        });
      }
    }

    const duration = Date.now() - startTime;
    log.push(`[${new Date().toISOString()}] Cron job completed in ${duration}ms`);
    log.push(`Summary: ${successCount} sent, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      remindersSent: successCount,
      remindersFailed: failureCount,
      totalBookings: bookings.length,
      results,
      log,
      duration: `${duration}ms`,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    log.push(`ERROR: ${(error instanceof Error ? error.message : undefined)}`);
    log.push(`[${new Date().toISOString()}] Cron job failed after ${duration}ms`);

    return NextResponse.json(
      {
        success: false,
        error: (error instanceof Error ? error.message : undefined),
        log,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that prefer POST
export async function POST(request: NextRequest) {
  return GET(request);
}




