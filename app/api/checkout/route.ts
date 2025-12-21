export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendCustomerConfirmation } from '@/lib/sendCustomerConfirmation';
import { prisma } from '@/lib/prisma';
import { resolveCityFromZip } from '@/utils/cityRouting';
import { getServicePrice, getAddOnPrice } from '@/utils/branchPricing';
import { autoAssignCleaner } from '@/lib/cleaner-assignment';
import { JobStatus } from '@prisma/client';
import { validateTerritory } from '@/lib/pilot/territory';

// Determine BASE URL with fallback chain
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

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
    apiVersion: "2024-06-20",
  });
}

export async function POST(request: NextRequest) {
  console.log("[CHECKOUT] Route called");
  
  try {
    // Check Stripe key exists before processing
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[CHECKOUT] STRIPE_SECRET_KEY is missing!");
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }
    
    // Check BASE_URL is configured
    if (!BASE_URL || BASE_URL === "http://localhost:3000") {
      console.warn("[CHECKOUT] BASE_URL not configured, using fallback:", BASE_URL);
    }
    
    const body = await request.json();
    console.log("[CHECKOUT] Request body received:", {
      hasBookingData: !!body.bookingData,
      branchSlug: body.branchSlug,
      bookingDataKeys: body.bookingData ? Object.keys(body.bookingData) : [],
    });
    
    // 🚨 PAYMENT-FIRST FLOW: Accept bookingData from BookingContext
    // If bookingData is provided, extract fields from it
    // Otherwise, use legacy direct field format (for backward compatibility)
    let bookingData: any = null;
    let firstName: string;
    let lastInitial: string;
    let phone: string;
    let email: string;
    let address: string;
    let serviceType: string;
    let preferredDate: string;
    let preferredTime: string;
    let serviceLocation: string;
    let addOns: any;
    let specialInstructions: string;
    let totalPrice: number;
    let zipCode: string;
    let branchId: string | undefined;
    let currency: string;
    let referralCode: string | undefined;
    let referralDiscount: number | undefined;

    if (body.bookingData) {
      // New payment-first flow: extract from bookingData
      bookingData = body.bookingData;
      const contact = bookingData.contact || {};
      const service = bookingData.service || {};
      const when = bookingData.when || {};
      const extras = bookingData.extras || [];
      const estimate = bookingData.estimate || {};
      
      firstName = contact.firstName || '';
      lastInitial = contact.lastName ? contact.lastName.charAt(0) : '';
      phone = contact.phone || '';
      email = contact.email || '';
      address = [contact.streetAddress, contact.city, contact.state, contact.zip]
        .filter(Boolean)
        .join(', ');
      serviceType = service.type || service.label || 'basic';
      preferredDate = when.date || '';
      preferredTime = when.time || '';
      serviceLocation = body.branchSlug === 'miami' ? 'Miami' : 
                       body.branchSlug === 'vermont' ? 'Vermont' : 
                       body.branchSlug === 'port-antonio' ? 'Port Antonio' : 'New Jersey';
      addOns = extras.reduce((acc: any, extra: any) => {
        const key = extra.id || extra.label?.toLowerCase().replace(/\s+/g, '');
        if (key === 'insidefridge' || key === 'inside fridge') acc.refrigerator = true;
        if (key === 'insideoven' || key === 'inside oven') acc.oven = true;
        if (key === 'windows') acc.windows = true;
        if (key === 'laundry') acc.laundry = true;
        return acc;
      }, {});
      specialInstructions = bookingData.extras?.notes || '';
      totalPrice = estimate.total || 0;
      zipCode = contact.zip || '';
      currency = 'USD';
    } else {
      // Legacy format: direct fields
      ({
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
        zipCode,
        branchId,
        currency,
        referralCode,
        referralDiscount,
      } = body);
    }

    const selectedCurrency = currency || 'USD';

    // Validate required fields
    console.log("[CHECKOUT] Validating required fields:", {
      hasFirstName: !!firstName,
      hasEmail: !!email,
      hasServiceType: !!serviceType,
      hasTotalPrice: !!totalPrice,
      totalPrice,
    });
    
    if (!firstName || !email || !serviceType || !totalPrice) {
      console.error("[CHECKOUT] Missing required fields:", {
        firstName: !!firstName,
        email: !!email,
        serviceType: !!serviceType,
        totalPrice: !!totalPrice,
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate booking data
    if (!bookingData?.serviceType && !serviceType) {
      console.error("[CHECKOUT] Invalid booking data - serviceType missing");
      return NextResponse.json(
        { error: "Invalid booking data" },
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

    // Resolve branch ID from serviceLocation, ZIP code/routing code, or use explicit branchId
    let resolvedBranchId: string | null = branchId || null;
    let resolvedBranchSlug: string | null = null;
    
    // First, try to resolve by serviceLocation (Miami, New Jersey, Vermont)
    // This is more reliable than ZIP lookup for explicit location selection
    if (!resolvedBranchId && serviceLocation) {
      const locationSlugMap: Record<string, string> = {
        'Miami': 'miami',
        'New Jersey': 'new-jersey',
        'Vermont': 'vermont',
      };
      
      const branchSlug = locationSlugMap[serviceLocation];
      if (branchSlug) {
        try {
          const branch = await prisma.branch.findUnique({
            where: { slug: branchSlug },
            select: { id: true, slug: true, status: true },
          });
          
          if (branch && branch.status === 'ACTIVE') {
            resolvedBranchId = branch.id;
            resolvedBranchSlug = branch.slug;
          }
        } catch (error) {
          console.error(`Error looking up branch by slug ${branchSlug}:`, error);
        }
      }
    }
    
    // If still not resolved, try ZIP code lookup (fallback)
    if (!resolvedBranchId && zipCode) {
      const normalizedZip = zipCode.trim().toUpperCase();
      
      // Check for Jamaica routing codes (PA-XXX)
      if (normalizedZip.startsWith('PA-')) {
        try {
          const serviceArea = await prisma.branchServiceArea.findFirst({
            where: {
              zipCode: normalizedZip,
              Branch: {
                slug: 'port-antonio',
              },
            },
            include: {
              Branch: {
                select: { id: true, slug: true },
              },
            },
          });
          
          if (serviceArea?.Branch) {
            resolvedBranchId = serviceArea.Branch.id;
            resolvedBranchSlug = serviceArea.Branch.slug;
          }
        } catch (error) {
          console.error('Error looking up Port Antonio service area:', error);
        }
      } else {
        // Standard U.S. ZIP code lookup
        try {
          const serviceArea = await prisma.branchServiceArea.findFirst({
            where: {
              zipCode: normalizedZip,
              Branch: {
                status: 'ACTIVE',
              },
            },
            include: {
              Branch: {
                select: { id: true, slug: true },
              },
            },
            orderBy: [
              { priority: 'asc' },
              { createdAt: 'asc' },
            ],
          });
          
          if (serviceArea?.Branch) {
            resolvedBranchId = serviceArea.Branch.id;
            resolvedBranchSlug = serviceArea.Branch.slug;
          }
        } catch (error) {
          console.error('Error looking up service area by ZIP:', error);
          // If ZIP lookup fails, don't block the booking - we'll use serviceLocation fallback
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
            if (address) {
              const zipMatch = address.match(/\b\d{5}\b/);
              if (zipMatch) {
                homeZipCode = zipMatch[0];
              }
            }

            customer = await prisma.customer.create({
              data: {
                firstName,
                lastName: lastInitial || '',
                email,
                phone: phone || null,
                branchId: resolvedBranchId,
                homeZipCode,
              },
            });
          } else {
            // Note: isBlocked field not in schema - removed check

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
                data: { branchId: resolvedBranchId },
              });
            }
          }

          customerId = customer.id;
        } catch (customerError: any) {
          console.error(`Error creating/finding customer for JMD booking (non-fatal):`, customerError.message);
          // Continue without customerId - job can still be created
        }
      }

      // Phase M: Validate territory before creating job
      if (zipCode && resolvedBranchId) {
        const territoryValidation = await validateTerritory(
          resolvedBranchId,
          zipCode,
          preferredTime || undefined
        );
        
        if (!territoryValidation.valid) {
          return NextResponse.json(
            {
              success: false,
              error: territoryValidation.error || "Service area validation failed",
              territoryError: true,
              zipCode: territoryValidation.zipCode,
              serviceHours: territoryValidation.serviceHours,
            },
            { status: 400 }
          );
        }
      }

      // Create Job record directly (no Stripe payment) with customerId linked
      const job = await prisma.job.create({
        data: {
          branchId: resolvedBranchId,
          customerId, // Link to customer for preferSameCleaner logic
          customerName: `${firstName} ${lastInitial}`,
          preferredDate: preferredDate ? new Date(preferredDate) : null,
          preferredTime: preferredTime || null,
          serviceType: serviceType || null,
          serviceLocation: serviceLocation || null,
          address: address || null,
          status: JobStatus.RECEIVED,
          totalPrice: totalPrice,
          currency: 'JMD',
          paymentMethod: 'cash', // Default to cash, can be updated later
          appliedReferralCode: referralCode || null, // Store referral code
          // Note: assignedCity can be stored in metadata or address field if needed
        },
      });

      // Phase M: Send immediate confirmation
      try {
        const { sendJobConfirmation } = await import("@/lib/pilot/customerExperience");
        const confirmationResult = await sendJobConfirmation(job.id);
        if (confirmationResult.sent) {
          console.log(`[PHASE_M] Confirmation sent for job ${job.id}`);
        } else {
          console.warn(`[PHASE_M] Confirmation failed for job ${job.id}: ${confirmationResult.error}`);
        }
      } catch (confirmationError: any) {
        console.error(`[PHASE_M] Error sending confirmation:`, confirmationError);
        // Don't fail job creation if confirmation fails
      }

      // Auto-assign cleaner (non-blocking - don't fail if this fails)
      try {
        const assignmentResult = await autoAssignCleaner(job.id);
        console.log('Auto-assignment result for JMD payment:', assignmentResult);
      } catch (assignError: any) {
        console.error('Auto-assignment error (non-fatal):', assignError.message || assignError);
      }

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
          } else {
            // Note: isBlocked field not in schema - removed check
          }

          // Track referral event
          await fetch(`${BASE_URL}/api/referrals/track-event`, {
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
        redirectUrl: `${BASE_URL}/booking/success?job_id=${job.id}&currency=JMD`,
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

    // 🚨 FIX: Stripe metadata has 500-char limit, so store booking data in database
    // Store booking data temporarily and reference it by ID in metadata
    let bookingDataId: string | null = null;
    if (bookingData) {
      try {
        // Store booking data in a temporary table (using Job with a special status or a separate table)
        // For now, we'll store it as JSON in a temporary Job record that we'll update after payment
        // OR: Store essential fields only in metadata and reconstruct bookingData
        
        // Option: Store only essential fields in metadata (minimized)
        // Remove estimate.lineItems and other verbose fields
        const minimizedBookingData = {
          s: bookingData.service?.type || bookingData.service?.label || 'STANDARD', // service type
          h: `${bookingData.home?.bedrooms || 1},${bookingData.home?.bathrooms || 1},${bookingData.home?.squareFeet || ''}`, // home: "bedrooms,bathrooms,sqft"
          e: bookingData.extras?.map((ex: any) => ex.id || ex.label).join(',') || '', // extras: "id1,id2"
          d: bookingData.when?.date || '', // date
          t: bookingData.when?.time || '', // time
          c: `${bookingData.contact?.firstName || ''}|${bookingData.contact?.lastName || ''}|${bookingData.contact?.email || ''}|${bookingData.contact?.phone || ''}|${bookingData.contact?.streetAddress || ''}|${bookingData.contact?.city || ''}|${bookingData.contact?.state || ''}|${bookingData.contact?.zip || ''}`, // contact: "fn|ln|email|phone|street|city|state|zip"
          est: `${bookingData.estimate?.total || 0}`, // estimate total only
          b: body.branchSlug || '', // branch slug
        };
        
        const minimizedJson = JSON.stringify(minimizedBookingData);
        if (minimizedJson.length <= 500) {
          metadata.bookingDataMin = minimizedJson;
          metadata.branchSlug = body.branchSlug || '';
        } else {
          // If still too long, store only critical fields
          metadata.serviceType = minimizedBookingData.s;
          metadata.branchSlug = body.branchSlug || '';
          metadata.contactEmail = bookingData.contact?.email || '';
          metadata.contactName = `${bookingData.contact?.firstName || ''} ${bookingData.contact?.lastName || ''}`.trim();
          metadata.homeDetails = minimizedBookingData.h;
          metadata.extrasList = minimizedBookingData.e;
          metadata.preferredDate = minimizedBookingData.d;
          metadata.preferredTime = minimizedBookingData.t;
          metadata.totalPrice = minimizedBookingData.est;
          metadata.contactFull = minimizedBookingData.c;
        }
      } catch (storageError) {
        console.error('[CHECKOUT] Error storing booking data:', storageError);
        // Fallback: store only essential fields
        metadata.branchSlug = body.branchSlug || '';
        metadata.serviceType = bookingData?.service?.type || bookingData?.service?.label || 'STANDARD';
      }
    } else {
      metadata.branchSlug = body.branchSlug || '';
    }

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

    // Phase 5 Step 4: Check if customer is blocked before creating Stripe session
    if (email) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { email },
      });

      // Note: isBlocked field not in schema - removed check
      if (false) { // Placeholder - add isBlocked field to schema if needed
        return NextResponse.json(
          {
            error: 'This account is currently restricted. Please contact support.',
            code: 'CUSTOMER_BLOCKED',
          },
          { status: 403 }
        );
      }
    }

    // Create Stripe Checkout Session
    console.log("[CHECKOUT] Creating Stripe session...", {
      lineItemsCount: lineItems.length,
      baseUrl: BASE_URL,
      customerEmail: email,
      metadataKeys: Object.keys(metadata),
    });
    
    // Validate line items before creating session
    if (lineItems.length === 0) {
      console.error("[CHECKOUT] No line items to charge");
      return NextResponse.json(
        { error: "No items to charge" },
        { status: 400 }
      );
    }
    
    // Validate line item amounts
    for (const item of lineItems) {
      if (item.price_data && typeof item.price_data.unit_amount === 'number') {
        if (item.price_data.unit_amount <= 0 || isNaN(item.price_data.unit_amount)) {
          console.error("[CHECKOUT] Invalid line item amount:", item);
          return NextResponse.json(
            { error: "Invalid pricing data" },
            { status: 400 }
          );
        }
      }
    }
    
    const stripe = getStripe();
    
    const successUrl = `${BASE_URL}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${BASE_URL}/book`;
    
    console.log("[CHECKOUT] Stripe session config:", {
      successUrl,
      cancelUrl,
      customerEmail: email,
      lineItemsCount: lineItems.length,
    });
    
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        // 🚨 PAYMENT-FIRST FLOW: Redirect to confirmation page (NOT API route)
        // The confirmation page will call the API to create the job
        // This follows Next.js best practices: pages for users, APIs for data
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: email,
        metadata,
        billing_address_collection: 'required',
      });
      
      console.log("[CHECKOUT] Session created:", {
        sessionId: session.id,
        hasUrl: !!session.url,
        urlLength: session.url?.length || 0,
      });
    } catch (stripeError: any) {
      console.error("[CHECKOUT] Stripe error:", {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        stack: stripeError.stack,
      });
      return NextResponse.json(
        { error: stripeError.message || "Stripe checkout failed" },
        { status: 500 }
      );
    }

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

    // Validate Stripe session URL before returning
    if (!session.url) {
      console.error("[CHECKOUT] Stripe session created without URL", {
        sessionId: session.id,
        sessionStatus: session.status,
        sessionObject: JSON.stringify(session, null, 2),
      });
      return NextResponse.json(
        { error: "Stripe failed to generate checkout URL" },
        { status: 500 }
      );
    }

    console.log("[CHECKOUT] ✅ Success - returning checkout URL");
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[CHECKOUT] Error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      type: typeof error,
    });
    console.error("[CHECKOUT] Error stack:", error.stack);
    console.error("[CHECKOUT] Error message:", error.message);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

