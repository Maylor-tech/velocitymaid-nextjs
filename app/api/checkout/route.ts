import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe only when needed (lazy initialization)
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables. Please create a .env.local file with your Stripe secret key (starts with sk_test_ or sk_live_).');
  }
  // Check if it's a publishable key (common mistake)
  if (secretKey.startsWith('pk_')) {
    throw new Error('You are using a PUBLISHABLE key (pk_...). Please use a SECRET key (sk_test_... or sk_live_...) instead. Get your secret key from https://dashboard.stripe.com/test/apikeys');
  }
  // Check if it's a valid secret key format
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format. Secret keys should start with sk_test_ (for testing) or sk_live_ (for production).');
  }
  return new Stripe(secretKey, {
    apiVersion: '2022-11-15',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastInitial,
      phone,
      email,
      address,
      serviceType,
      preferredDate,
      preferredTime,
      addOns,
      specialInstructions,
      totalPrice,
    } = body;

    // Validate required fields
    if (!firstName || !email || !serviceType || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send booking details to Zapier webhook (non-blocking)
    if (process.env.ZAPIER_WEBHOOK_URL) {
      try {
        await fetch(process.env.ZAPIER_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${firstName} ${lastInitial}`,
            email,
            phone,
            service: serviceType,
            date: preferredDate,
            time: preferredTime,
            address,
            message: specialInstructions || '',
            totalPrice,
            addOns: Object.entries(addOns)
              .filter(([_, value]) => value)
              .map(([key]) => key),
          }),
        }).catch((error) => {
          // Log error but don't block Stripe flow
          console.error('Zapier webhook error (non-blocking):', error);
        });
      } catch (error) {
        // Log error but don't block Stripe flow
        console.error('Zapier webhook error (non-blocking):', error);
      }
    }

    // Build line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Add service
    const serviceNames: Record<string, string> = {
      basic: 'Basic Clean',
      deep: 'Deep Clean',
      moveInOut: 'Move In/Out Clean',
    };

    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: serviceNames[serviceType] || 'Cleaning Service',
        },
        unit_amount: Math.round(
          (serviceType === 'basic' ? 120 : serviceType === 'deep' ? 220 : 320) * 100
        ),
      },
      quantity: 1,
    });

    // Add add-ons
    if (addOns.laundry) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Laundry Service',
          },
          unit_amount: 1500, // $15.00
        },
        quantity: 1,
      });
    }

    if (addOns.windows) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Interior Windows Cleaning',
          },
          unit_amount: 2000, // $20.00
        },
        quantity: 1,
      });
    }

    if (addOns.oven) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Inside Oven Cleaning',
          },
          unit_amount: 3000, // $30.00
        },
        quantity: 1,
      });
    }

    if (addOns.refrigerator) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Inside Refrigerator Cleaning',
          },
          unit_amount: 2500, // $25.00
        },
        quantity: 1,
      });
    }

    // Build metadata for order tracking
    const metadata: Record<string, string> = {
      firstName,
      lastInitial,
      phone,
      email,
      address,
      serviceType,
      preferredDate,
      preferredTime,
    };

    if (specialInstructions) {
      metadata.specialInstructions = specialInstructions;
    }

    // Create Stripe Checkout Session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com'}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com'}/booking/failed`,
      customer_email: email,
      metadata,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

