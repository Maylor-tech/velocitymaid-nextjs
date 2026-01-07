import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/requireAuth';
import { validatePriceId, validateTenantId } from '@/lib/validation/saas';
import { getEnvVar } from '@/lib/env/validate';

export const runtime = 'nodejs';

/**
 * Create Stripe Checkout Session for SaaS Subscription
 * 
 * POST /api/billing/create-checkout-session
 * 
 * Body:
 * {
 *   "priceId": "price_xxx", // Stripe Price ID
 *   "tenantId": "tenant_xxx" // Optional, will use authenticated user's tenant
 * }
 */
export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', requestId },
        { status: 400 }
      );
    }

    const { priceId, tenantId: providedTenantId } = body;

    // Validate priceId
    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required', requestId },
        { status: 400 }
      );
    }

    const priceValidation = validatePriceId(priceId);
    if (!priceValidation.valid) {
      return NextResponse.json(
        { error: priceValidation.error, requestId },
        { status: 400 }
      );
    }

    // Get authenticated user
    let auth;
    try {
      auth = await requireAuth(req);
    } catch (authError: any) {
      console.error(`[${requestId}] Authentication error:`, authError);
      return NextResponse.json(
        { error: 'Authentication required', requestId },
        { status: 401 }
      );
    }
    
    // Use provided tenantId or fall back to user's tenantId
    const tenantId = providedTenantId || auth.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required. User must be associated with a tenant.', requestId },
        { status: 400 }
      );
    }

    // Validate tenantId format if provided
    if (providedTenantId) {
      const tenantValidation = validateTenantId(providedTenantId);
      if (!tenantValidation.valid) {
        return NextResponse.json(
          { error: tenantValidation.error, requestId },
          { status: 400 }
        );
      }
    }

    // Verify user has access to this tenant
    if (auth.tenantId !== tenantId && auth.role !== 'ADMIN') {
      console.log(`[${requestId}] Unauthorized tenant access attempt: ${auth.userId} -> ${tenantId}`);
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this tenant', requestId },
        { status: 403 }
      );
    }

    // Get or create subscription record
    let subscription = await prisma.subscription.findUnique({
      where: { tenantId },
    });

    // If subscription doesn't exist, create it with a Stripe customer
    if (!subscription) {
      const stripe = getStripe();
      
      // Get tenant info
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: { role: 'ADMIN' },
            take: 1,
          },
        },
      });

      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: tenant.users[0]?.email || auth.email,
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
        },
      });

      // Create subscription record
      subscription = await prisma.subscription.create({
        data: {
          id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          tenantId: tenant.id,
          stripeCustomerId: customer.id,
        },
      });
    }

    // Create Stripe Checkout session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer: subscription.stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${getEnvVar('NEXTAUTH_URL', getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'))}/saas/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getEnvVar('NEXTAUTH_URL', getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'))}/saas/billing`,
      metadata: {
        tenantId: tenantId,
        requestId: requestId,
      },
    });

    if (!session.url) {
      console.error(`[${requestId}] Stripe session created but no URL returned`);
      return NextResponse.json(
        { error: 'Failed to create checkout session URL', requestId },
        { status: 500 }
      );
    }

    console.log(`[${requestId}] Checkout session created: ${session.id} for tenant: ${tenantId}`);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
      requestId,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error creating checkout session:`, error);
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Failed to create checkout session'
      : error.message || 'Failed to create checkout session';
    
    return NextResponse.json(
      { error: errorMessage, requestId },
      { status: 500 }
    );
  }
}

