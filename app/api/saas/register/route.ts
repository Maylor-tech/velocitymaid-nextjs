import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { randomUUID } from 'crypto';
import { validateEmail, validateName, validatePhone } from '@/lib/validation/saas';

export const runtime = 'nodejs';

/**
 * Register a new SaaS tenant
 * 
 * POST /api/saas/register
 * 
 * Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@company.com",
 *   "companyName": "ABC Cleaning Services",
 *   "phone": "(555) 123-4567" (optional)
 * }
 */
export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    // Parse and validate request body
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

    const { name, email, companyName, phone } = body;

    // Validate required fields
    if (!name || !email || !companyName) {
      return NextResponse.json(
        { error: 'Name, email, and company name are required', requestId },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error, requestId },
        { status: 400 }
      );
    }

    // Validate name
    const nameValidation = validateName(name, 'Name');
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error, requestId },
        { status: 400 }
      );
    }

    // Validate company name
    const companyValidation = validateName(companyName, 'Company name');
    if (!companyValidation.valid) {
      return NextResponse.json(
        { error: companyValidation.error, requestId },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return NextResponse.json(
          { error: phoneValidation.error, requestId },
          { status: 400 }
        );
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists (do this BEFORE creating any resources)
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbError: any) {
      console.error(`[${requestId}] Database error checking existing user:`, dbError);
      return NextResponse.json(
        { error: 'Database error. Please try again.', requestId },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log(`[${requestId}] Registration attempt with existing email: ${normalizedEmail}`);
      return NextResponse.json(
        { error: 'An account with this email already exists', requestId },
        { status: 409 }
      );
    }

    // Create tenant
    let tenant;
    try {
      tenant = await prisma.tenant.create({
        data: {
          name: companyName.trim(),
        },
      });
      console.log(`[${requestId}] Tenant created: ${tenant.id}`);
    } catch (tenantError: any) {
      console.error(`[${requestId}] Tenant creation error:`, tenantError);
      console.error(`[${requestId}] Tenant error details:`, {
        code: tenantError.code,
        meta: tenantError.meta,
        message: tenantError.message,
      });
      
      // Provide more specific error message
      let errorMessage = 'Failed to create tenant';
      if (tenantError.code === 'P2002') {
        errorMessage = 'A tenant with this name already exists. Please try a different company name.';
      } else if (tenantError.message) {
        errorMessage = `Failed to create tenant: ${tenantError.message}`;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          requestId,
          details: process.env.NODE_ENV === 'development' ? tenantError.message : undefined,
        },
        { status: 500 }
      );
    }

    // Create Stripe customer for the tenant (optional - allow registration without Stripe)
    let stripeCustomerId: string | null = null;
    if (isStripeConfigured()) {
      try {
        const stripe = getStripe();
        const stripeCustomer = await stripe.customers.create({
          email: normalizedEmail,
          name: companyName.trim(),
          metadata: {
            tenantId: tenant.id,
          },
        });
        stripeCustomerId = stripeCustomer.id;
        console.log(`[${requestId}] Stripe customer created: ${stripeCustomer.id}`);
      } catch (stripeError: any) {
        console.warn(`[${requestId}] Stripe customer creation failed (continuing without Stripe):`, stripeError.message);
        // Continue registration without Stripe - can be set up later
        // This allows registration to work even if Stripe is not configured
      }
    } else {
      console.log(`[${requestId}] Stripe not configured, skipping customer creation`);
    }

    // Create subscription record (without active subscription yet)
    // If Stripe is not available, generate a unique placeholder ID
    const finalStripeCustomerId = stripeCustomerId || `temp_cust_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    let subscription;
    try {
      subscription = await prisma.subscription.create({
        data: {
          id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          tenantId: tenant.id,
          stripeCustomerId: finalStripeCustomerId,
        },
      });
      console.log(`[${requestId}] Subscription record created: ${subscription.id}`);
    } catch (subError: any) {
      console.error(`[${requestId}] Subscription creation error:`, subError);
      // Clean up tenant if subscription creation fails
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
      // Clean up Stripe customer if it was created (only if it's a real Stripe ID)
      if (stripeCustomerId && stripeCustomerId.startsWith('cus_')) {
        try {
          const stripe = getStripe();
          await stripe.customers.del(stripeCustomerId);
        } catch {}
      }
      return NextResponse.json(
        { error: 'Failed to create subscription record', requestId, details: subError.message },
        { status: 500 }
      );
    }

    // Create user (admin for the tenant)
    let user;
    try {
      const userId = randomUUID();
      user = await prisma.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          name: name.trim(),
          role: 'ADMIN',
          tenantId: tenant.id,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      console.log(`[${requestId}] User created: ${user.id}`);
    } catch (userError: any) {
      console.error(`[${requestId}] User creation error:`, userError);
      console.error(`[${requestId}] Error details:`, {
        code: userError.code,
        meta: userError.meta,
        message: userError.message,
      });
      // Clean up resources if user creation fails
      await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
      if (stripeCustomerId && stripeCustomerId.startsWith('cus_')) {
        try {
          const stripe = getStripe();
          await stripe.customers.del(stripeCustomerId);
        } catch {}
      }
      return NextResponse.json(
        { 
          error: 'Failed to create user account', 
          requestId,
          details: process.env.NODE_ENV === 'development' ? userError.message : undefined,
        },
        { status: 500 }
      );
    }

    // Set session cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set('saas_user_id', user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } catch (cookieError: any) {
      console.error(`[${requestId}] Cookie setting error:`, cookieError);
      // Don't fail registration if cookie fails, but log it
    }

    console.log(`[${requestId}] Registration successful for: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      subscription: {
        id: subscription.id,
        stripeCustomerId: subscription.stripeCustomerId,
        hasStripe: stripeCustomerId !== null,
      },
      requestId,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Unexpected registration error:`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.', requestId },
      { status: 500 }
    );
  }
}

