export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendCustomerConfirmation } from '@/lib/sendCustomerConfirmation';
import { prisma } from '@/lib/prisma';
import { resolveCityFromZip } from '@/utils/cityRouting';
import { getServicePrice, getAddOnPrice } from '@/utils/branchPricing';

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
    apiVersion: '2025-10-29.clover',
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
      serviceLocation,
      addOns,
      specialInstructions,
      totalPrice,
      zipCode, // ZIP code for branch routing
      branchId, // Explicit branch ID (if provided)
      currency, // Currency: 'USD' or 'JMD' (defaults to USD)
      referralCode, // Referral code if present
      referralDiscount, // Discount amount (e.g., 20)
    } = body;

    const selectedCurrency = currency || 'USD';

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
            serviceLocation: serviceLocation || 'New Jersey',
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

    // Resolve branch ID from ZIP code/routing code or use explicit branchId
    let resolvedBranchId: string | null = branchId || null;
    let resolvedBranchSlug: string | null = null;
    
    if (!resolvedBranchId && zipCode) {
      const normalizedZip = zipCode.trim().toUpperCase();
      
      // Check for Jamaica routing codes (PA-XXX)
      if (normalizedZip.startsWith('PA-')) {
        const serviceArea = await prisma.branchServiceArea.findFirst({
          where: {
            zipCode: normalizedZip,
            branch: {
              slug: 'port-antonio',
            },
          },
          include: {
            branch: {
              select: { id: true, slug: true },
            },
          },
        });
        
        if (serviceArea?.branch) {
          resolvedBranchId = serviceArea.branch.id;
          resolvedBranchSlug = serviceArea.branch.slug;
        }
      } else {
        // Standard U.S. ZIP code lookup
        const serviceArea = await prisma.branchServiceArea.findFirst({
          where: {
            zipCode: normalizedZip,
            branch: {
              status: 'ACTIVE',
            },
          },
          include: {
            branch: {
              select: { id: true, slug: true },
            },
          },
          orderBy: [
            { priority: 'asc' },
            { createdAt: 'asc' },
          ],
        });
        
        if (serviceArea?.branch) {
          resolvedBranchId = serviceArea.branch.id;
          resolvedBranchSlug = serviceArea.branch.slug;
        }
      }
    }

    // Determine city from ZIP (for New Jersey)
    let assignedCity: string | null = null;
    if (zipCode && resolvedBranchSlug === 'new-jersey') {
      assignedCity = resolveCityFromZip(zipCode);
    }

    // If JMD currency (Port Antonio local), skip Stripe and create Job directly
    if (selectedCurrency === 'JMD' && resolvedBranchSlug === 'port-antonio') {
      if (!resolvedBranchId) {
        return NextResponse.json(
          { error: 'Branch not found for Port Antonio' },
          { status: 400 }
        );
      }

      // Create Job record directly (no Stripe payment)
      const job = await prisma.job.create({
        data: {
          branchId: resolvedBranchId,
          customerName: `${firstName} ${lastInitial}`,
          preferredDate: preferredDate ? new Date(preferredDate) : null,
          preferredTime: preferredTime || null,
          serviceType: serviceType || null,
          serviceLocation: serviceLocation || null,
          address: address || null,
          status: 'pending',
          totalPrice: totalPrice,
          currency: 'JMD',
          paymentMethod: 'cash', // Default to cash, can be updated later
          appliedReferralCode: referralCode || null, // Store referral code
          // Note: assignedCity can be stored in metadata or address field if needed
        },
      });

      // Track referral event if referral code exists
      if (referralCode && resolvedBranchId) {
        try {
          // Find or create customer
          let customer = await prisma.customer.findUnique({
            where: { email },
          });

          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                firstName,
                lastName: lastInitial || '',
                email,
                phone: phone || null,
                branchId: resolvedBranchId,
              },
            });
          }

          // Track referral event
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/referrals/track-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referralCode,
              referredCustomerId: customer.id,
              branchId: resolvedBranchId,
              jobId: job.id,
            }),
          }).catch((error) => {
            console.error('Referral tracking error (non-blocking):', error);
          });
        } catch (error) {
          console.error('Referral tracking error (non-blocking):', error);
        }
      }

      // Send WhatsApp booking confirmation for Jamaica (non-blocking)
      if (phone) {
        try {
          const { sendWhatsAppBookingConfirmation } = await import('@/app/services/whatsappTemplates');
          
          // Format service type for display
          const serviceNames: Record<string, string> = {
            basic: 'Basic Clean',
            deep: 'Deep Clean',
            moveInOut: 'Move In/Out Clean',
          };
          const serviceDisplayName = serviceNames[serviceType] || serviceType;
          
          // Format date for display
          const formattedDate = preferredDate 
            ? new Date(preferredDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            : 'TBD';
          
          await sendWhatsAppBookingConfirmation({
            phone,
            branch: 'port-antonio',
            service: serviceDisplayName,
            date: formattedDate,
            price: totalPrice,
            currency: 'JMD',
          });
        } catch (error) {
          // Log but don't fail the booking
          console.error('WhatsApp booking confirmation failed:', error);
        }
      }

      // Return success response with local payment message
      return NextResponse.json({
        success: true,
        jobId: job.id,
        message: 'Booking confirmed! Payment will be collected locally (cash or bank transfer).',
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com'}/booking/success?job_id=${job.id}&currency=JMD`,
      });
    }

    // Build line items for Stripe using branch-specific pricing (USD only)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Add service with branch pricing
    const serviceNames: Record<string, string> = {
      basic: 'Basic Clean',
      deep: 'Deep Clean',
      moveInOut: 'Move In/Out Clean',
    };

    // For Port Antonio USD, use USD equivalent pricing from pricingData
    let servicePrice: number;
    if (resolvedBranchSlug === 'port-antonio' && selectedCurrency === 'USD') {
      // Fetch branch service package to get USD pricing
      const serviceCodeMap: Record<string, string> = {
        basic: 'STANDARD_CLEAN',
        deep: 'DEEP_CLEAN',
        moveInOut: 'MOVE_IN_OUT',
      };
      const packageCode = serviceCodeMap[serviceType];
      if (packageCode && resolvedBranchId) {
        const pkg = await prisma.branchServicePackage.findUnique({
          where: {
            branchId_code: {
              branchId: resolvedBranchId,
              code: packageCode,
            },
          },
        });
        if (pkg?.pricingData) {
          const pricingData = pkg.pricingData as any;
          servicePrice = pricingData.usd?.base || Number(pkg.basePrice);
        } else {
          servicePrice = getServicePrice(resolvedBranchId, serviceType as 'basic' | 'deep' | 'moveInOut');
        }
      } else {
        servicePrice = getServicePrice(resolvedBranchId, serviceType as 'basic' | 'deep' | 'moveInOut');
      }
    } else {
      servicePrice = getServicePrice(resolvedBranchId, serviceType as 'basic' | 'deep' | 'moveInOut');
    }
    
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: serviceNames[serviceType] || 'Cleaning Service',
        },
        unit_amount: Math.round(servicePrice * 100),
      },
      quantity: 1,
    });

    // Add add-ons with branch pricing
    if (addOns.laundry) {
      const addOnPrice = getAddOnPrice('laundry');
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Laundry Service',
          },
          unit_amount: Math.round(addOnPrice * 100),
        },
        quantity: 1,
      });
    }

    if (addOns.windows) {
      const addOnPrice = getAddOnPrice('windows');
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Interior Windows Cleaning',
          },
          unit_amount: Math.round(addOnPrice * 100),
        },
        quantity: 1,
      });
    }

    if (addOns.oven) {
      const addOnPrice = getAddOnPrice('oven');
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Inside Oven Cleaning',
          },
          unit_amount: Math.round(addOnPrice * 100),
        },
        quantity: 1,
      });
    }

    if (addOns.refrigerator) {
      const addOnPrice = getAddOnPrice('refrigerator');
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Inside Refrigerator Cleaning',
          },
          unit_amount: Math.round(addOnPrice * 100),
        },
        quantity: 1,
      });
    }

    // Normalize serviceLocation to expected format
    let normalizedServiceLocation = 'new_jersey'; // Default
    if (serviceLocation) {
      const location = serviceLocation.toLowerCase().trim();
      if (location === 'vermont' || location === 'vt') {
        normalizedServiceLocation = 'vermont';
      } else if (location === 'new_jersey' || location === 'new jersey' || location === 'nj') {
        normalizedServiceLocation = 'new_jersey';
      } else {
        // If unrecognized, default to new_jersey
        normalizedServiceLocation = 'new_jersey';
      }
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
      serviceLocation: normalizedServiceLocation,
    };

    // Add referral code to metadata if present
    if (referralCode) {
      metadata.referralCode = referralCode;
      metadata.referralDiscount = String(referralDiscount || 0);
    }

    // Add promo code to metadata if present
    const promoCode = body.promoCode || body.promo;
    if (promoCode) {
      metadata.promoCode = promoCode;
      metadata.promoApplied = promoCode;
    }

    // Add branch ID to metadata if resolved
    if (resolvedBranchId) {
      metadata.branchId = resolvedBranchId;
    }

    if (zipCode) {
      metadata.zipCode = zipCode;
    }

    if (specialInstructions) {
      metadata.specialInstructions = specialInstructions;
    }

    // Add currency to metadata
    metadata.currency = selectedCurrency;

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

    // Send WhatsApp confirmation (non-blocking - don't fail if this fails)
    // Note: This sends when checkout session is created, not when payment completes.
    // The webhook handler also sends confirmation after payment success.
    if (phone && process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      sendCustomerConfirmation(
        process.env.WHATSAPP_PHONE_NUMBER_ID,
        process.env.WHATSAPP_TOKEN,
        {
          firstName,
          lastInitial,
          phone,
          serviceType,
          preferredDate,
          preferredTime,
          address,
        }
      ).catch((error) => {
        // Log error but don't block checkout flow
        console.error('Customer confirmation WhatsApp failed:', error);
      });
    } else {
      if (!phone) {
        console.warn('Customer phone number not provided - skipping WhatsApp confirmation');
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

