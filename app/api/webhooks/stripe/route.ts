import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendCustomerConfirmation } from '@/lib/sendCustomerConfirmation';
import { sendAdminNotification } from '@/lib/sendAdminNotification';

/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events, specifically checkout.session.completed
 * to send WhatsApp confirmation messages after successful payment.
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
 * Verify Stripe webhook signature
 */
async function verifyWebhookSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const stripe = getStripe();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return false;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set - skipping signature verification');
    return true; // Allow in development if secret not set
  }

  try {
    stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return true;
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return false;
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  
  // Extract booking data from metadata
  const phone = metadata.phone;
  const serviceType = metadata.serviceType;
  const preferredDate = metadata.preferredDate;
  const preferredTime = metadata.preferredTime;
  const address = metadata.address;

  // Validate required fields
  if (!phone || !serviceType || !preferredDate || !address) {
    console.error('Missing required booking data in Stripe session metadata:', {
      sessionId: session.id,
      hasPhone: !!phone,
      hasServiceType: !!serviceType,
      hasDate: !!preferredDate,
      hasAddress: !!address,
    });
    return {
      success: false,
      error: 'Missing required booking data',
    };
  }

  // Check if confirmation already sent (prevent duplicates)
  if (metadata.confirmationNumber && metadata.whatsappConfirmationSent === 'true') {
    console.log(`Confirmation already sent for session ${session.id}`);
    return {
      success: true,
      messageId: metadata.whatsappMessageId || undefined,
    };
  }

  // Get WhatsApp credentials
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !whatsappPhoneNumberId) {
    console.error('WhatsApp credentials not configured');
    return {
      success: false,
      error: 'WhatsApp credentials not configured',
    };
  }

  // Build customer name
  const firstName = metadata.firstName || '';
  const lastInitial = metadata.lastInitial || '';

  // Send WhatsApp confirmation
  const result = await sendCustomerConfirmation(
    whatsappPhoneNumberId,
    whatsappToken,
    {
      firstName,
      lastInitial,
      phone,
      serviceType,
      preferredDate,
      preferredTime: preferredTime || 'Morning',
      address,
    }
  );

  // Update Stripe session metadata with sent status
  if (result.success) {
    try {
      const stripe = getStripe();
      await stripe.checkout.sessions.update(session.id, {
        metadata: {
          ...metadata,
          whatsappConfirmationSent: 'true',
          whatsappConfirmationSentAt: new Date().toISOString(),
          whatsappMessageId: result.messageId || '',
        },
      });
      console.log(`Confirmation sent successfully for session ${session.id}`);
    } catch (error: any) {
      console.error(`Error updating Stripe metadata for session ${session.id}:`, error.message);
      // Don't fail the webhook if metadata update fails
    }
  }

  // Send admin notification (non-blocking - don't fail if this fails)
  // Routes to correct state admin based on serviceLocation
  try {
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const serviceLocation = metadata.serviceLocation;

    if (whatsappToken && whatsappPhoneNumberId) {
      // Build customer name from metadata
      const firstName = metadata.firstName || '';
      const lastInitial = metadata.lastInitial || '';
      const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

      if (customerName) {
        // Get total price from session amount
        const totalPrice = session.amount_total ? session.amount_total / 100 : 0;

        // Send admin notification (non-blocking) - routing handled inside function
        sendAdminNotification(
          whatsappPhoneNumberId,
          whatsappToken,
          {
            customerName,
            serviceType: metadata.serviceType || '',
            totalPrice,
            address: metadata.address || '',
            preferredDate: metadata.preferredDate || '',
            serviceLocation: serviceLocation || 'new_jersey', // Include serviceLocation for routing
          }
        ).then((adminResult) => {
          if (adminResult.success) {
            console.log(`Admin notification sent successfully for session ${session.id} [${serviceLocation || 'new_jersey'}]:`, {
              messageId: adminResult.messageId,
              customerName,
              serviceLocation,
            });
          } else {
            console.error(`Admin notification failed for session ${session.id}:`, adminResult.error);
          }
        }).catch((error) => {
          console.error(`Error sending admin notification for session ${session.id}:`, error);
        });
      } else {
        console.warn(`Skipping admin notification for session ${session.id}: customer name not available`);
      }
    } else {
      console.warn('WhatsApp credentials not configured - skipping admin notification');
    }
  } catch (error: any) {
    // Log error but don't block the webhook
    console.error(`Error in admin notification process for session ${session.id}:`, error.message);
  }

  return result;
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const log: string[] = [];

  try {
    // Get raw body for signature verification
    const body = await request.text();
    
    log.push(`[${new Date().toISOString()}] Stripe webhook received`);

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(request, body);
    if (!isValid) {
      log.push('ERROR: Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature', log },
        { status: 401 }
      );
    }

    // Parse webhook event
    const stripe = getStripe();
    const event = JSON.parse(body) as Stripe.Event;

    log.push(`Event type: ${event.type}`);
    log.push(`Event ID: ${event.id}`);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      log.push(`Processing checkout session: ${session.id}`);
      log.push(`Payment status: ${session.payment_status}`);

      // Only process if payment is successful
      if (session.payment_status === 'paid') {
        const result = await handleCheckoutCompleted(session);
        
        if (result.success) {
          log.push(`SUCCESS: WhatsApp confirmation sent${result.messageId ? ` (Message ID: ${result.messageId})` : ''}`);
        } else {
          log.push(`FAILED: ${result.error || 'Unknown error'}`);
        }

        const duration = Date.now() - startTime;
        log.push(`Processing completed in ${duration}ms`);

        return NextResponse.json({
          received: true,
          eventType: event.type,
          success: result.success,
          messageId: result.messageId,
          log,
          duration: `${duration}ms`,
        });
      } else {
        log.push(`SKIP: Payment not completed (status: ${session.payment_status})`);
        return NextResponse.json({
          received: true,
          eventType: event.type,
          message: 'Payment not completed, skipping confirmation',
          log,
        });
      }
    }

    // Handle other event types (acknowledge but don't process)
    log.push(`Event type ${event.type} acknowledged but not processed`);
    return NextResponse.json({
      received: true,
      eventType: event.type,
      message: 'Event acknowledged',
      log,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    log.push(`ERROR: ${error.message}`);
    log.push(`Failed after ${duration}ms`);

    console.error('Stripe webhook error:', error);

    return NextResponse.json(
      {
        error: error.message,
        log,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

// Support GET for webhook verification (Stripe may use this)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

