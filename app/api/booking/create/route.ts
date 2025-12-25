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
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:40',message:'Booking create POST entry',data:{runId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  try {
    // 🚨 STEP 1: Extract session_id from request body
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:44',message:'Parsing request body',data:{runId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    const body = await req.json();
    const sessionId = body.session_id;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:47',message:'Session ID extracted',data:{runId,hasSessionId:!!sessionId,sessionIdPrefix:sessionId?.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Payment session ID required. Job creation requires confirmed payment.' },
        { status: 400 }
      );
    }

    // 🚨 STEP 2: Verify Stripe session exists
    let session: Stripe.Checkout.Session;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:55',message:'Retrieving Stripe session',data:{runId,sessionId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    try {
      const stripe = getStripe();
      session = await stripe.checkout.sessions.retrieve(sessionId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:59',message:'Stripe session retrieved',data:{runId,paymentStatus:session.payment_status,hasMetadata:!!session.metadata},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
    } catch (stripeError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:62',message:'Stripe session retrieval failed',data:{runId,error:stripeError?.message,errorType:stripeError?.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:114',message:'Starting customer lookup/create',data:{runId,hasEmail:!!email,email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    if (email) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:117',message:'Querying customer by email',data:{runId,email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        let customer = await prisma.customer.findUnique({
          where: { email },
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:120',message:'Customer query result',data:{runId,customerFound:!!customer,customerId:customer?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'J'})}).catch(()=>{});
        // #endregion

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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:165',message:'Customer ID set',data:{runId,customerId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
      } catch (customerError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:168',message:'Customer creation/lookup error',data:{runId,error:customerError?.message,errorCode:customerError?.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        console.error('[BOOKING CREATE] Error creating/finding customer:', customerError.message);
        // Continue without customerId - job can still be created
      }
    }

    // 🚨 STEP 7: Get total price from Stripe session
    const totalPrice = session.amount_total ? session.amount_total / 100 : null;

    // 🚨 STEP 8: Create job with payment confirmation (IDEMPOTENT)
    // Using upsert ensures safe retries - if job already exists, no duplicate is created
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:177',message:'Creating job via upsert',data:{runId,sessionId,branchId,customerId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'K'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:221',message:'Job created successfully',data:{runId,jobId:job.id,sessionId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'K'})}).catch(()=>{});
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'booking/create/route.ts:258',message:'Booking create error caught',data:{runId,errorType:error?.constructor?.name,errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'L'})}).catch(()=>{});
    // #endregion
    console.error('[BOOKING CREATE] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}