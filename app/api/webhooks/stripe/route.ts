export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { sendCustomerConfirmation } from '@/lib/sendCustomerConfirmation';
import { sendAdminNotification } from '@/lib/sendAdminNotification';
import { sendInvoiceReceiptForPayment } from '@/lib/notifications/invoiceReceipt';
import { sendRefundConfirmation } from '@/lib/notifications/refundConfirmation';
import { prisma } from '@/lib/prisma';
import { autoAssignCleaner } from '@/lib/cleaner-assignment';
import { getStripeAccountStatus } from '@/lib/stripe/connect';
import { getStripe } from '@/lib/stripe';
import { isDepositBookingMode } from '@/lib/booking/paymentConfig';
import { computeJobPaymentFromSession } from '@/lib/booking/jobPayment';
import { upsertJobFromCheckoutSession } from '@/lib/booking/upsertJobFromCheckoutSession';
import { PaymentStatus } from '@prisma/client';
import { createPayoutIfEligible } from '@/src/server/payout/createPayoutIfEligible';

/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events:
 * - checkout.session.completed (customer bookings and SaaS subscriptions)
 * - invoice.payment_succeeded (subscription renewals)
 * - refund.created / charge.refunded (refund confirmation WhatsApp)
 * - account.updated (Stripe Connect)
 */

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

  if (metadata.paymentType === 'billing_invoice' && metadata.invoiceId) {
    const amount = (session.amount_total ?? 0) / 100;
    const { recordInvoicePayment } = await import('@/lib/invoices/invoiceService');
    const { serializeInvoice } = await import('@/lib/invoices/serializeInvoice');
    const { sendInvoiceReceiptEmail } = await import('@/lib/email/invoiceEmails');
    const { prisma } = await import('@/lib/prisma');

    const existing = await prisma.invoicePayment.findFirst({
      where: { stripeSessionId: session.id },
    });
    if (!existing && amount > 0) {
      const payment = await recordInvoicePayment({
        invoiceId: metadata.invoiceId,
        amount,
        paymentMethod: 'STRIPE',
        transactionReference: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
        stripeSessionId: session.id,
      });
      const invoice = await prisma.invoice.findUnique({
        where: { id: metadata.invoiceId },
        include: { items: true, payments: true },
      });
      if (invoice) {
        await sendInvoiceReceiptEmail(serializeInvoice(invoice), amount);
        const { finalizeInvoicePayment } = await import('@/lib/invoices/invoiceService');
        await finalizeInvoicePayment(metadata.invoiceId, payment.id, amount);
      }
    }
    return { success: true, message: 'Billing invoice payment recorded' };
  }

  if (metadata.paymentType === 'balance' && metadata.jobId) {
    const paymentFields = computeJobPaymentFromSession(session, metadata);
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

    await prisma.job.update({
      where: { id: metadata.jobId },
      data: {
        amountPaid: paymentFields.amountPaid,
        balanceDue: paymentFields.balanceDue,
        paymentStatus: PaymentStatus.PAID,
        balanceSessionId: session.id,
        balancePaymentIntentId: paymentIntentId,
        balancePaidAt: new Date(),
      },
    });

    const payoutResult = await createPayoutIfEligible(metadata.jobId);
    console.log(
      `Balance payment recorded for job ${metadata.jobId}; payout:`,
      payoutResult
    );

    return {
      success: true,
      message: 'Balance payment recorded',
      payout: payoutResult,
    };
  }
  
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

  // Create or find Job record in database
  let jobId: string | null = null;
  try {
    const branchId = metadata.branchId || null;
    if (!branchId) {
      console.warn(`No branchId in metadata for session ${session.id} - skipping job creation`);
    } else {
      const firstName = metadata.firstName || '';
      const lastInitial = metadata.lastInitial || '';
      const email = metadata.email || '';

      // Create or find Customer record to link to Job
      let customerId: string | null = null;
      if (email) {
        try {
          let customer = await prisma.customer.findUnique({
            where: { email },
          });

          if (!customer) {
            // Extract ZIP from address if available for homeZipCode
            let homeZipCode: string | null = null;
            if (metadata.address) {
              const zipMatch = metadata.address.match(/\b\d{5}\b/);
              if (zipMatch) {
                homeZipCode = zipMatch[0];
              }
            }

            customer = await prisma.customer.create({
              data: {
                id: randomUUID(),
                firstName,
                lastName: lastInitial || '',
                email,
                phone: phone || null,
                branchId,
                homeZipCode,
                updatedAt: new Date(),
              },
            });
          } else {
            // Update customer info if needed (phone, branchId)
            if (phone && !customer.phone) {
              await prisma.customer.update({
                where: { id: customer.id },
                data: { phone },
              });
            }
            if (!customer.branchId) {
              await prisma.customer.update({
                where: { id: customer.id },
                data: { branchId },
              });
            }
          }

          customerId = customer.id;
        } catch (customerError: any) {
          console.error(`Error creating/finding customer for session ${session.id} (non-fatal):`, customerError.message);
          // Continue without customerId - job can still be created
        }
      }

      // Idempotent job create — safe if confirmation page already created the job
      const { job, created } = await upsertJobFromCheckoutSession({
        session,
        metadata,
        customerId,
      });
      jobId = job.id;
      console.log(
        created
          ? `Job created for session ${session.id}: ${jobId}${customerId ? ` (linked to customer ${customerId})` : ''}`
          : `Job already exists for session ${session.id}: ${jobId}`
      );

      if (created && !isDepositBookingMode()) {
        try {
          const assignmentResult = await autoAssignCleaner(job.id);
          console.log('Auto-assignment result:', assignmentResult);
        } catch (assignError: unknown) {
          const msg = assignError instanceof Error ? assignError.message : String(assignError);
          console.error('Auto-assignment error (non-fatal):', msg);
        }
      }
    }
  } catch (jobError: any) {
    console.error(`Error creating/finding job for session ${session.id} (non-fatal):`, jobError.message || jobError);
    // Don't fail the webhook if job creation fails
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
        const quotedTotal = metadata.quotedTotal
          ? parseFloat(metadata.quotedTotal)
          : session.amount_total
            ? session.amount_total / 100
            : 0;

        sendAdminNotification(
          whatsappPhoneNumberId,
          whatsappToken,
          {
            customerName,
            serviceType: metadata.serviceType || '',
            totalPrice: quotedTotal,
            address: metadata.address || '',
            preferredDate: metadata.preferredDate || '',
            serviceLocation: serviceLocation || 'new_jersey',
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

  // Send invoice receipt once per payment (audit guard prevents duplicates)
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
    const amount = session.amount_total != null ? session.amount_total / 100 : 0;
    const invoiceNumber = session.id.startsWith('cs_') ? `VM-${session.id.slice(-8).toUpperCase()}` : session.id;
    const sent = await sendInvoiceReceiptForPayment({
      paymentId: session.id,
      invoiceNumber,
      amount,
      date: new Date(),
      receiptLink: `${baseUrl}/customer/jobs`,
      customerPhone: metadata.phone || null,
    });
    if (sent) console.log(`Invoice receipt sent for session ${session.id}`);
  } catch (err: any) {
    console.error(`Error sending invoice receipt for session ${session.id}:`, err?.message);
  }

  return result;
}

/**
 * Handle account.updated event (Stripe Connect)
 * Syncs payout readiness fields from Stripe
 */
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    // Find cleaner by stripeAccountId
    const cleaner = await prisma.user.findFirst({
      where: {
        stripeAccountId: account.id,
        role: 'CLEANER',
      },
      select: {
        id: true,
      },
    });

    if (!cleaner) {
      console.log(`No cleaner found for Stripe account ${account.id}`);
      return {
        success: false,
        error: 'Cleaner not found',
      };
    }

    // Get account status
    const status = await getStripeAccountStatus(account.id);

    // Update cleaner payout readiness fields
    await prisma.user.update({
      where: { id: cleaner.id },
      data: {
        stripeChargesEnabled: status.chargesEnabled,
        stripePayoutsEnabled: status.payoutsEnabled,
        stripeOnboardingStatus: status.onboardingStatus,
        stripeRequirementsDueCount: status.requirementsDueCount,
        stripeLastAccountUpdateAt: new Date(),
      },
    });

    console.log(`Updated Stripe status for cleaner ${cleaner.id}:`, {
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      onboardingStatus: status.onboardingStatus,
      requirementsDueCount: status.requirementsDueCount,
    });

    return {
      success: true,
      cleanerId: cleaner.id,
      status,
    };
  } catch (error: any) {
    console.error('[ACCOUNT_UPDATED] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update account status',
    };
  }
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
      log.push(`Mode: ${session.mode}`);

      // Check if this is a subscription checkout (SaaS billing)
      if (session.mode === 'subscription' && session.subscription) {
        log.push(`Processing subscription checkout for tenant: ${session.metadata?.tenantId}`);
        
        try {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const tenantId = session.metadata?.tenantId;
          if (!tenantId) {
            log.push(`WARNING: No tenantId in session metadata`);
          } else {
            // Update subscription record
            await prisma.subscription.update({
              where: {
                stripeCustomerId: subscription.customer as string,
              },
              data: {
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0]?.price.id || null,
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
              },
            });

            log.push(`SUCCESS: Subscription updated for tenant ${tenantId}`);
          }
        } catch (error: any) {
          log.push(`ERROR: Failed to update subscription: ${error.message}`);
          console.error('Subscription update error:', error);
        }

        const duration = Date.now() - startTime;
        return NextResponse.json({
          received: true,
          eventType: event.type,
          success: true,
          log,
          duration: `${duration}ms`,
        });
      }

      // Otherwise, handle as customer booking checkout
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

    // Handle invoice.payment_succeeded event (subscription renewals)
    if (event.type === 'invoice.payment_succeeded') {
      const stripeInvoice = event.data.object as unknown as Stripe.Invoice;
      const stripeInvoiceRaw = event.data.object as unknown as Record<string, unknown>;
      const subscriptionId =
        typeof stripeInvoiceRaw.subscription === 'string'
          ? stripeInvoiceRaw.subscription
          : stripeInvoiceRaw.subscription &&
              typeof stripeInvoiceRaw.subscription === 'object' &&
              'id' in stripeInvoiceRaw.subscription
            ? String((stripeInvoiceRaw.subscription as { id: string }).id)
            : null;

      log.push(`Processing invoice payment: ${stripeInvoice.id}`);
      log.push(`Subscription: ${subscriptionId ?? 'none'}`);

      if (subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Update subscription record
          await prisma.subscription.update({
            where: {
              stripeSubscriptionId: subscription.id,
            },
            data: {
              stripePriceId: subscription.items.data[0]?.price.id || null,
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });

          log.push(`SUCCESS: Subscription updated for ${subscription.id}`);
        } catch (error: any) {
          log.push(`ERROR: Failed to update subscription: ${error.message}`);
          console.error('Subscription update error:', error);
        }
      }

      // Send invoice receipt once per payment (audit guard prevents duplicates)
      try {
        const customerEmail = stripeInvoice.customer_email ?? null;
        let customerPhone: string | null = null;
        if (customerEmail) {
          const customer = await prisma.customer.findUnique({
            where: { email: customerEmail },
            select: { phone: true },
          });
          customerPhone = customer?.phone ?? null;
        }
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com').replace(/\/$/, '');
        const receiptLink = stripeInvoice.hosted_invoice_url || stripeInvoice.invoice_pdf || `${baseUrl}/customer/billing`;
        const sent = await sendInvoiceReceiptForPayment({
          paymentId: stripeInvoice.id,
          invoiceNumber: stripeInvoice.number || stripeInvoice.id,
          amount: (stripeInvoice.amount_paid ?? 0) / 100,
          date: new Date((stripeInvoice.created ?? 0) * 1000),
          receiptLink,
          customerPhone,
        });
        if (sent) log.push('SUCCESS: Invoice receipt WhatsApp sent');
      } catch (receiptErr: any) {
        log.push(`Invoice receipt skip/error: ${receiptErr?.message || receiptErr}`);
      }

      const duration = Date.now() - startTime;
      return NextResponse.json({
        received: true,
        eventType: event.type,
        success: true,
        log,
        duration: `${duration}ms`,
      });
    }

    // Handle refund.created — send refund confirmation once per refund (preferred: full refund payload)
    if (event.type === 'refund.created') {
      const refund = event.data.object as Stripe.Refund;
      if (refund.status !== 'succeeded') {
        const duration = Date.now() - startTime;
        return NextResponse.json({ received: true, eventType: event.type, log, duration: `${duration}ms` });
      }
      log.push(`Processing refund: ${refund.id}`);

      try {
        const stripe = getStripe();
        const chargeId = typeof refund.charge === 'string' ? refund.charge : refund.charge?.id;
        let stripeCustomerId: string | null = null;
        let email: string | null = null;
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          stripeCustomerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id ?? null;
          email = charge.receipt_email ?? charge.billing_details?.email ?? null;
        }
        let customerPhone: string | null = null;
        if (stripeCustomerId) {
          const c = await prisma.customer.findFirst({
            where: { stripeCustomerId },
            select: { phone: true },
          });
          customerPhone = c?.phone ?? null;
        }
        if (!customerPhone && email) {
          const c = await prisma.customer.findUnique({
            where: { email },
            select: { phone: true },
          });
          customerPhone = c?.phone ?? null;
        }
        const amount = (refund.amount ?? 0) / 100;
        const sent = await sendRefundConfirmation({
          refundId: refund.id,
          amount,
          customerPhone,
        });
        if (sent) log.push('SUCCESS: Refund confirmation WhatsApp sent');
        else log.push('SKIP: Refund notice not sent (no phone or already sent)');
      } catch (refundErr: any) {
        log.push(`Refund confirmation error: ${refundErr?.message || refundErr}`);
      }

      const duration = Date.now() - startTime;
      return NextResponse.json({
        received: true,
        eventType: event.type,
        success: true,
        log,
        duration: `${duration}ms`,
      });
    }

    // Handle charge.refunded — send refund confirmation (fallback when refund.created not configured)
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      log.push(`Processing refund for charge: ${charge.id}`);

      try {
        const stripe = getStripe();
        let refunds = charge.refunds?.data ?? [];
        if (refunds.length === 0) {
          const list = await stripe.refunds.list({ charge: charge.id, limit: 10 });
          refunds = list.data ?? [];
        }
        const lastRefund = refunds.length > 0 ? refunds[refunds.length - 1] : null;
        if (!lastRefund) {
          log.push('SKIP: No refund details on charge');
        } else {
          const stripeCustomerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id ?? null;
          const email = charge.receipt_email ?? charge.billing_details?.email ?? null;
          let customerPhone: string | null = null;
          if (stripeCustomerId) {
            const c = await prisma.customer.findFirst({
              where: { stripeCustomerId },
              select: { phone: true },
            });
            customerPhone = c?.phone ?? null;
          }
          if (!customerPhone && email) {
            const c = await prisma.customer.findUnique({
              where: { email },
              select: { phone: true },
            });
            customerPhone = c?.phone ?? null;
          }
          const amount = (lastRefund.amount ?? 0) / 100;
          const sent = await sendRefundConfirmation({
            refundId: lastRefund.id,
            amount,
            customerPhone,
          });
          if (sent) log.push('SUCCESS: Refund confirmation WhatsApp sent');
          else log.push('SKIP: Refund notice not sent (no phone or already sent)');
        }
      } catch (refundErr: any) {
        log.push(`Refund confirmation error: ${refundErr?.message || refundErr}`);
      }

      const duration = Date.now() - startTime;
      return NextResponse.json({
        received: true,
        eventType: event.type,
        success: true,
        log,
        duration: `${duration}ms`,
      });
    }

    // Handle account.updated event (Stripe Connect)
    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      
      log.push(`Processing account update: ${account.id}`);

      const result = await handleAccountUpdated(account);
      
      if (result.success) {
        log.push(`SUCCESS: Updated cleaner payout status for ${result.cleanerId}`);
      } else {
        log.push(`FAILED: ${result.error || 'Unknown error'}`);
      }

      const duration = Date.now() - startTime;
      log.push(`Processing completed in ${duration}ms`);

      return NextResponse.json({
        received: true,
        eventType: event.type,
        success: result.success,
        cleanerId: result.cleanerId,
        log,
        duration: `${duration}ms`,
      });
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

