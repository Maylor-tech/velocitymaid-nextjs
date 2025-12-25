export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is missing');
  if (secretKey.startsWith('pk_')) throw new Error('Use Stripe SECRET key (sk_...), not pk_');
  if (!secretKey.startsWith('sk_')) throw new Error('Invalid Stripe secret key format');

  // Safer: let SDK choose supported API version
  return new Stripe(secretKey);
}

export async function POST(req: NextRequest) {
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:17',message:'Checkout POST entry',data:{runId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:20',message:'Parsing request body',data:{runId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const body = await req.json();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:21',message:'Request body parsed',data:{runId,hasEmail:!!body.email,hasServiceType:!!body.serviceType,hasTotalPrice:!!body.totalPrice},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const {
      firstName,
      lastInitial,
      email,
      phone,
      address,
      serviceType,
      preferredDate,
      preferredTime,
      zipCode,
      branchSlug,
      branchId,
      currency = 'USD',
      referralCode,
      referralDiscount,
      totalPrice,
      serviceLocation,
      specialInstructions,
    } = body;

    if (!email || !serviceType || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: email, serviceType, totalPrice' },
        { status: 400 }
      );
    }

    const BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    if (!BASE_URL.startsWith('http')) {
      throw new Error(`BASE_URL is invalid: ${BASE_URL}`);
    }

    // Resolve branch with status check
    let branch = null;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:55',message:'Starting branch resolution',data:{runId,branchId,branchSlug,zipCode},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    if (branchId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:59',message:'Querying branch by ID',data:{runId,branchId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      try {
        branch = await prisma.branch.findUnique({ 
          where: { id: branchId },
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:62',message:'Branch query by ID result',data:{runId,branchFound:!!branch,branchId:branch?.id,branchStatus:branch?.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (dbError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:65',message:'Database error querying branch by ID',data:{runId,error:dbError?.message,errorCode:dbError?.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw dbError;
      }
    }

    if (!branch && branchSlug) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:68',message:'Querying branch by slug',data:{runId,branchSlug},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      try {
        branch = await prisma.branch.findUnique({ 
          where: { slug: branchSlug },
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:71',message:'Branch query by slug result',data:{runId,branchFound:!!branch,branchId:branch?.id,branchStatus:branch?.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      } catch (dbError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:74',message:'Database error querying branch by slug',data:{runId,error:dbError?.message,errorCode:dbError?.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        throw dbError;
      }
    }

    if (!branch && zipCode) {
      const normalizedZip = String(zipCode).trim().toUpperCase();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:80',message:'Querying branch by ZIP code',data:{runId,normalizedZip},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (normalizedZip.startsWith('PA-')) {
        try {
          const serviceArea = await prisma.branchServiceArea.findFirst({
            where: { zipCode: normalizedZip },
            include: { Branch: true },
          });
          branch = serviceArea?.Branch || null;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:87',message:'ZIP query result (PA-)',data:{runId,branchFound:!!branch,serviceAreaFound:!!serviceArea},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        } catch (dbError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:90',message:'Database error querying ZIP (PA-)',data:{runId,error:dbError?.message,errorCode:dbError?.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          throw dbError;
        }
      } else {
        try {
          const serviceArea = await prisma.branchServiceArea.findFirst({
            where: { zipCode: normalizedZip },
            include: { Branch: true },
            orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
          });
          branch = serviceArea?.Branch || null;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:100',message:'ZIP query result (standard)',data:{runId,branchFound:!!branch,serviceAreaFound:!!serviceArea},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        } catch (dbError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:103',message:'Database error querying ZIP (standard)',data:{runId,error:dbError?.message,errorCode:dbError?.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          throw dbError;
        }
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:108',message:'Branch resolution complete',data:{runId,branchFound:!!branch,branchId:branch?.id,branchStatus:branch?.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!branch) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:110',message:'Branch not found - returning error',data:{runId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Service area not supported. Please provide a valid location/ZIP.' },
        { status: 400 }
      );
    }

    // ✅ ENHANCEMENT: Check if branch is active
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:118',message:'Checking branch status',data:{runId,branchId:branch.id,branchStatus:branch.status},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (branch.status !== 'ACTIVE') {
      return NextResponse.json(
        { 
          error: `This location is currently ${branch.status === 'COMING_SOON' ? 'coming soon' : 'paused'}. Please check back later.` 
        },
        { status: 403 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:127',message:'Initializing Stripe',data:{runId,hasStripeKey:!!process.env.STRIPE_SECRET_KEY},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const stripe = getStripe();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:129',message:'Stripe initialized',data:{runId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Normalize serviceLocation
    let normalizedServiceLocation = serviceLocation || 'new_jersey';
    if (serviceLocation) {
      const location = serviceLocation.toLowerCase().trim();
      if (location === 'vermont' || location === 'vt') normalizedServiceLocation = 'vermont';
      else if (location === 'new_jersey' || location === 'new jersey' || location === 'nj') normalizedServiceLocation = 'new_jersey';
      else if (location === 'miami' || location === 'fl' || location === 'florida') normalizedServiceLocation = 'miami';
      else if (location === 'port_antonio' || location === 'port-antonio' || location === 'jamaica') normalizedServiceLocation = 'port_antonio';
    }

    const metadata: Record<string, string> = {
      firstName: firstName || '',
      lastInitial: lastInitial || '',
      phone: phone || '',
      email,
      address: address || '',
      serviceType,
      preferredDate: preferredDate || '',
      preferredTime: preferredTime || '',
      serviceLocation: normalizedServiceLocation,
      zipCode: zipCode || '',
      branchId: branch.id,
      branchSlug: branch.slug,
      currency: String(currency),
    };

    if (referralCode) {
      metadata.referralCode = String(referralCode);
      metadata.referralDiscount = String(referralDiscount || 0);
    }

    if (specialInstructions) {
      metadata.specialInstructions = String(specialInstructions).slice(0, 450);
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:163',message:'Creating Stripe checkout session',data:{runId,email,totalPrice,currency},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: String(currency).toLowerCase(),
            product_data: { name: 'Cleaning Service' },
            unit_amount: Math.round(Number(totalPrice) * 100),
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${BASE_URL}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/book`,
      billing_address_collection: 'required',
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:180',message:'Stripe session created',data:{runId,sessionId:session.id,hasUrl:!!session.url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    if (!session.url) throw new Error('Stripe session.url missing');

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:184',message:'Returning checkout URL',data:{runId,url:session.url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/92bbc5fe-c36d-4c77-827c-f6f5d387b5d0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/route.ts:188',message:'Checkout error caught',data:{runId,errorType:error?.constructor?.name,errorMessage:error?.message,errorCode:error?.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}