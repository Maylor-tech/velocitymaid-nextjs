/**
 * 🚨 PAYMENT ENFORCEMENT - CRITICAL 🚨
 * 
 * This route ONLY creates jobs after confirmed Stripe payment.
 * Jobs MUST NOT be created without payment verification.
 * 
 * Flow:
 * 1. User completes Stripe checkout
 * 2. Stripe redirects to /book/confirmation?session_id=...
 * 3. Confirmation page calls this route with session_id
 * 4. This route verifies payment status
 * 5. Only then creates the job
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import { autoAssignCleaner } from '@/lib/cleaner-assignment';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (secretKey.startsWith('pk_')) {
    throw new Error('You are using a PUBLISHABLE key. Please use a SECRET key instead.');
  }
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

export async function POST(req: NextRequest) {
  try {
    // 🚨 STEP 1: Extract session_id from request body
    const body = await req.json();
    const sessionId = body.session_id;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Payment session ID required. Job creation requires confirmed payment.' },
        { status: 400 }
      );
    }

    // 🚨 STEP 2: Verify Stripe session exists
    let session: Stripe.Checkout.Session;
    try {
      const stripe = getStripe();
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError: any) {
      console.error('[BOOKING CREATE] Invalid Stripe session:', stripeError.message);
      return NextResponse.json(
        { success: false, error: 'Invalid payment session. Please complete checkout again.' },
        { status: 400 }
      );
    }

    // 🚨 STEP 3: Verify payment status - CRITICAL ENFORCEMENT
    if (session.payment_status !== 'paid') {
      console.error('[BOOKING CREATE] Payment not completed. Status:', session.payment_status);
      return NextResponse.json(
        { success: false, error: 'Payment not completed. Job cannot be created without confirmed payment.' },
        { status: 400 }
      );
    }

    // 🚨 STEP 4: Extract booking data from Stripe metadata
    const metadata = session.metadata || {};
    
    const firstName = metadata.firstName || '';
    const lastInitial = metadata.lastInitial || '';
    const email = metadata.email || session.customer_email || '';
    const phone = metadata.phone || '';
    const address = metadata.address || '';
    const serviceType = metadata.serviceType || '';
    const preferredDate = metadata.preferredDate ? new Date(metadata.preferredDate) : null;
    const preferredTime = metadata.preferredTime || null;
    const serviceLocation = metadata.serviceLocation || '';
    const branchId = metadata.branchId || null;
    const zipCode = metadata.zipCode || null;
    const currency = metadata.currency || 'USD';
    const referralCode = metadata.referralCode || null;
    const promoCode = metadata.promoCode || null;
    const promoDiscount = metadata.referralDiscount ? parseFloat(metadata.referralDiscount) : null;

    if (!branchId) {
      return NextResponse.json(
        { success: false, error: 'Branch ID not found in payment session' },
        { status: 400 }
      );
    }

    // 🚨 STEP 5: Extract Stripe IDs for audit trail
    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id || null;

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

    // 🚨 STEP 6: Create or find customer
    let customerId: string | null = null;
    if (email) {
      try {
        let customer = await prisma.customer.findUnique({
          where: { email },
        });

        if (!customer) {
          // Extract ZIP from address if available
          let homeZipCode: string | null = null;
          if (zipCode) {
            homeZipCode = zipCode;
          } else if (address) {
            const zipMatch = address.match(/\b\d{5}\b/);
            if (zipMatch) {
              homeZipCode = zipMatch[0];
            }
          }

          customer = await prisma.customer.create({
            data: {
              id: randomUUID(), // Generate unique ID
              firstName,
              lastName: lastInitial || '',
              email,
              phone: phone || null,
              branchId,
              homeZipCode,
              stripeCustomerId, // Store Stripe customer ID for future reference
              updatedAt: new Date(), // Required field
            },
          });
        } else {
          // Update customer info if needed
          const updates: any = {};
          if (phone && !customer.phone) {
            updates.phone = phone;
          }
          if (!customer.branchId) {
            updates.branchId = branchId;
          }
          if (stripeCustomerId && !customer.stripeCustomerId) {
            updates.stripeCustomerId = stripeCustomerId;
          }
          if (Object.keys(updates).length > 0) {
            await prisma.customer.update({
              where: { id: customer.id },
              data: updates,
            });
          }
        }

        customerId = customer.id;
      } catch (customerError: any) {
        console.error('[BOOKING CREATE] Error creating/finding customer:', customerError.message);
        // Continue without customerId - job can still be created
      }
    }

    // 🚨 STEP 7: Get total price from Stripe session
    const totalPrice = session.amount_total ? session.amount_total / 100 : null;

    // 🚨 STEP 8: Create job with payment confirmation (IDEMPOTENT)
    // Using upsert ensures safe retries - if job already exists, no duplicate is created
    const job = await prisma.job.upsert({
      where: { sessionId: session.id },
      update: {
        // Job already exists - update payment status if needed
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
      },
      create: {
        id: randomUUID(),

        // 🔐 Stripe binding (critical for audit trail)
        sessionId: session.id,
        checkoutSessionId: session.id,
        paymentIntentId: paymentIntentId,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),

        // 🏢 Business context
        branchId,
        customerId,
        customerName: `${firstName} ${lastInitial}`.trim(),

        // 📅 Booking details
        preferredDate,
        preferredTime,
        serviceType,
        serviceLocation,
        address,

        // 💰 Pricing
        totalPrice: totalPrice ? totalPrice : null,
        currency,

        // ⚙️ State
        status: 'pending',
        paymentMethod: 'stripe',

        // 🎁 Promotions
        appliedReferralCode: referralCode,
        promoApplied: promoCode,
        promoDiscount: promoDiscount ? promoDiscount : null,
      },
    });

    console.log(`[BOOKING CREATE] Job created: ${job.id} for session ${sessionId}${customerId ? ` (customer ${customerId})` : ''}`);

    // Auto-assign cleaner (non-blocking)
    try {
      const assignmentResult = await autoAssignCleaner(job.id);
      console.log('[BOOKING CREATE] Auto-assignment result:', assignmentResult);
    } catch (assignError: any) {
      console.error('[BOOKING CREATE] Auto-assignment error (non-fatal):', assignError.message);
    }

    // Track referral event if referral code exists (non-blocking)
    if (referralCode && customerId && branchId) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/referrals/track-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode,
            referredCustomerId: customerId,
            branchId,
            jobId: job.id,
          }),
        }).catch((error) => {
          console.error('[BOOKING CREATE] Referral tracking error (non-blocking):', error);
        });
      } catch (error) {
        console.error('[BOOKING CREATE] Referral tracking error (non-blocking):', error);
      }
    }

    // 🚨 STEP 9: Return success response
    return NextResponse.json({
      success: true,
      jobId: job.id,
      customerId,
      message: 'Booking created successfully',
    });
  } catch (error: any) {
    console.error('[BOOKING CREATE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}