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

    if (branchId) {
      branch = await prisma.branch.findUnique({ 
        where: { id: branchId },
      });
    }

    if (!branch && branchSlug) {
      branch = await prisma.branch.findUnique({ 
        where: { slug: branchSlug },
      });
    }

    if (!branch && zipCode) {
      const normalizedZip = String(zipCode).trim().toUpperCase();

      if (normalizedZip.startsWith('PA-')) {
        const serviceArea = await prisma.branchServiceArea.findFirst({
          where: { zipCode: normalizedZip },
          include: { Branch: true },
        });
        branch = serviceArea?.Branch || null;
      } else {
        const serviceArea = await prisma.branchServiceArea.findFirst({
          where: { zipCode: normalizedZip },
          include: { Branch: true },
          orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        });
        branch = serviceArea?.Branch || null;
      }
    }

    if (!branch) {
      return NextResponse.json(
        { error: 'Service area not supported. Please provide a valid location/ZIP.' },
        { status: 400 }
      );
    }

    // ✅ ENHANCEMENT: Check if branch is active
    if (branch.status !== 'ACTIVE') {
      return NextResponse.json(
        { 
          error: `This location is currently ${branch.status === 'COMING_SOON' ? 'coming soon' : 'paused'}. Please check back later.` 
        },
        { status: 403 }
      );
    }

    const stripe = getStripe();

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

    if (!session.url) throw new Error('Stripe session.url missing');

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}