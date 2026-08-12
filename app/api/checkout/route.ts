export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
  getBookingDepositCents,
  getBookingDepositDollars,
  isDepositBookingMode,
} from '@/lib/booking/paymentConfig';
import { assertStripeTestModeForDepositBooking } from '@/lib/stripe/stripeMode';
import { resolveAuthoritativeCheckoutQuote } from '@/lib/booking/checkoutPricing';
import { dollarsToCents } from '@/lib/pricing/money';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is missing');
  if (secretKey.startsWith('pk_')) throw new Error('Use Stripe SECRET key (sk_...), not pk_');
  if (!secretKey.startsWith('sk_')) throw new Error('Invalid Stripe secret key format');

  // Safer: let SDK choose supported API version
  return new Stripe(secretKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
      recurringFrequency,
    } = body;

    if (!email || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: email, serviceType' },
        { status: 400 }
      );
    }

    assertStripeTestModeForDepositBooking();

    const priced = await resolveAuthoritativeCheckoutQuote(body as Record<string, unknown>);
    if (!priced.ok) {
      return NextResponse.json({ error: priced.error }, { status: priced.status });
    }

    const quotedTotal = priced.quote.customerTotal;
    const operationalTotal = priced.quote.operationalTotal;
    const processingAllowanceEstimated = priced.quote.processingAllowanceEstimated;
    const pricingPolicyVersion = priced.quote.pricingPolicyVersion;
    // Persist economics on Job only when protection actually applied (policy version set).
    const persistEconomics = Boolean(pricingPolicyVersion);

    const BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    if (!BASE_URL.startsWith('http')) {
      throw new Error(`BASE_URL is invalid: ${BASE_URL}`);
    }

    // Resolve branch with status check
    let branch = null;

    if (branchId) {
      try {
        branch = await prisma.branch.findUnique({
          where: { id: branchId },
        });
      } catch (dbError: unknown) {
        throw dbError;
      }
    }

    if (!branch && branchSlug) {
      try {
        branch = await prisma.branch.findUnique({
          where: { slug: branchSlug },
        });
      } catch (dbError: unknown) {
        throw dbError;
      }
    }

    if (!branch && zipCode) {
      const normalizedZip = String(zipCode).trim().toUpperCase();

      if (normalizedZip.startsWith('PA-')) {
        try {
          const serviceArea = await prisma.branchServiceArea.findFirst({
            where: { zipCode: normalizedZip },
            include: { Branch: true },
          });
          branch = serviceArea?.Branch || null;
        } catch (dbError: unknown) {
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
        } catch (dbError: unknown) {
          throw dbError;
        }
      }
    }

    if (!branch) {
      return NextResponse.json(
        { error: 'Service area not supported. Please provide a valid location/ZIP.' },
        { status: 400 }
      );
    }

    if (branch.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error: `This location is currently ${branch.status === 'COMING_SOON' ? 'coming soon' : 'paused'}. Please check back later.`,
        },
        { status: 403 }
      );
    }

    const stripe = getStripe();

    let normalizedServiceLocation = serviceLocation || 'new_jersey';
    if (serviceLocation) {
      const location = serviceLocation.toLowerCase().trim();
      if (location === 'vermont' || location === 'vt') normalizedServiceLocation = 'vermont';
      else if (location === 'new_jersey' || location === 'new jersey' || location === 'nj')
        normalizedServiceLocation = 'new_jersey';
      else if (location === 'miami' || location === 'fl' || location === 'florida')
        normalizedServiceLocation = 'miami';
      else if (
        location === 'port_antonio' ||
        location === 'port-antonio' ||
        location === 'jamaica'
      )
        normalizedServiceLocation = 'port_antonio';
    }

    const effectiveCurrency = priced.quote.currency || String(currency);

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
      currency: effectiveCurrency,
      quotedTotal: String(quotedTotal),
    };

    if (persistEconomics) {
      metadata.operationalTotal = String(operationalTotal);
      metadata.processingAllowanceEstimated = String(processingAllowanceEstimated);
      if (pricingPolicyVersion) {
        metadata.pricingPolicyVersion = pricingPolicyVersion;
      }
    }

    if (referralCode) {
      metadata.referralCode = String(referralCode);
      metadata.referralDiscount = String(referralDiscount || 0);
    }

    if (specialInstructions) {
      metadata.specialInstructions = String(specialInstructions).slice(0, 450);
    }

    if (recurringFrequency) {
      metadata.recurringFrequency = String(recurringFrequency);
    }

    if (totalPrice != null) {
      metadata.clientQuotedTotal = String(totalPrice);
    }

    const depositMode = isDepositBookingMode();
    metadata.paymentType = depositMode ? 'deposit' : 'full';
    if (depositMode) {
      metadata.depositAmount = String(getBookingDepositDollars());
    }

    const chargeCents = depositMode
      ? getBookingDepositCents()
      : dollarsToCents(quotedTotal);
    const lineItemName = depositMode
      ? 'VelocityMaid Booking Deposit'
      : 'Cleaning Service';
    const lineItemDescription = depositMode
      ? `$${getBookingDepositDollars()} deposit — service total ${quotedTotal.toFixed(2)} ${effectiveCurrency.toUpperCase()}`
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: effectiveCurrency.toLowerCase(),
            product_data: {
              name: lineItemName,
              ...(lineItemDescription ? { description: lineItemDescription } : {}),
            },
            unit_amount: chargeCents,
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${BASE_URL}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/book`,
      billing_address_collection: 'required',
    });

    if (!session.url) throw new Error('Stripe session.url missing');

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
