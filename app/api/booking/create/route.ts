// 🚨 PAYMENT ENFORCEMENT
// Jobs MUST NOT be created without confirmed Stripe payment.
// Any attempt to bypass checkout is rejected.
// This route ONLY accepts requests with valid Stripe session_id where payment_status === "paid".

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import Stripe from "stripe";
import {
  COOKIE_NAME,
  COOKIE_MAX_AGE_SECONDS,
  createCustomerSessionToken,
} from "@/lib/customerSession";
import { JobStatus } from "@prisma/client";
import { validateTerritory } from "@/lib/pilot/territory";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Stripe
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

export async function POST(req: NextRequest) {
  try {
    // 🚨 STEP 1: Extract session_id from query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: "Payment session ID required. Job creation requires confirmed payment." },
        { status: 400 }
      );
    }

    // 🚨 STEP 2: Retrieve and verify Stripe session
    const stripe = getStripe();
    let session: Stripe.Checkout.Session;
    
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError: any) {
      console.error("[BOOKING CREATE] Stripe session retrieval failed:", stripeError);
      return NextResponse.json(
        { error: "Invalid payment session. Please complete checkout again." },
        { status: 400 }
      );
    }

    // 🚨 STEP 3: Verify payment status - CRITICAL ENFORCEMENT
    if (session.payment_status !== 'paid') {
      console.error("[BOOKING CREATE] Payment not completed. Status:", session.payment_status);
      return NextResponse.json(
        { error: "Payment not completed. Job cannot be created without confirmed payment." },
        { status: 400 }
      );
    }

    // 🚨 STEP 4: Extract booking data from Stripe metadata
    const metadata = session.metadata || {};
    let bookingData: any = null;
    
    // Try to reconstruct booking data from minimized metadata
    if (metadata.bookingDataMin) {
      try {
        const minimized = JSON.parse(metadata.bookingDataMin);
        // Reconstruct full booking data structure
        bookingData = {
          service: {
            type: minimized.s,
            label: minimized.s === 'STANDARD' ? 'Standard Cleaning' : minimized.s === 'DEEP_CLEAN' ? 'Deep Clean' : 'Move In / Out',
          },
          home: (() => {
            const [bedrooms, bathrooms, sqft] = minimized.h.split(',');
            return {
              bedrooms: parseInt(bedrooms) || 1,
              bathrooms: parseInt(bathrooms) || 1,
              squareFeet: sqft ? parseInt(sqft) : null,
            };
          })(),
          extras: minimized.e ? minimized.e.split(',').map((id: string) => ({
            id,
            label: id === 'insideFridge' ? 'Inside Fridge' :
                   id === 'insideOven' ? 'Inside Oven' :
                   id === 'insideCabinets' ? 'Inside Cabinets' :
                   id === 'windows' ? 'Windows' :
                   id === 'laundry' ? 'Laundry' : id,
          })) : [],
          when: {
            date: minimized.d || null,
            time: minimized.t || null,
          },
          contact: (() => {
            const [firstName, lastName, email, phone, streetAddress, city, state, zip] = minimized.c.split('|');
            return {
              firstName: firstName || '',
              lastName: lastName || '',
              email: email || session.customer_email || '',
              phone: phone || '',
              streetAddress: streetAddress || '',
              city: city || '',
              state: state || '',
              zip: zip || '',
            };
          })(),
          estimate: {
            total: parseFloat(minimized.est) || (session.amount_total ? session.amount_total / 100 : 0),
            subtotal: session.amount_subtotal ? session.amount_subtotal / 100 : 0,
            tax: 0,
          },
          branchSlug: minimized.b || metadata.branchSlug || 'new-jersey',
        };
      } catch (parseError) {
        console.error("[BOOKING CREATE] Failed to parse minimized booking data:", parseError);
        // Fall through to legacy format
      }
    }
    
    // Fallback: reconstruct from individual metadata fields
    if (!bookingData) {
      const contactParts = metadata.contactFull ? metadata.contactFull.split('|') : [];
      bookingData = {
        service: {
          label: metadata.serviceType || 'Standard Cleaning',
          type: metadata.serviceType || 'STANDARD',
        },
        home: (() => {
          const [bedrooms, bathrooms, sqft] = (metadata.homeDetails || '1,1,').split(',');
          return {
            bedrooms: parseInt(bedrooms) || 1,
            bathrooms: parseInt(bathrooms) || 1,
            squareFeet: sqft ? parseInt(sqft) : null,
          };
        })(),
        extras: metadata.extrasList ? metadata.extrasList.split(',').map((id: string) => ({
          id,
          label: id === 'insideFridge' ? 'Inside Fridge' :
                 id === 'insideOven' ? 'Inside Oven' :
                 id === 'insideCabinets' ? 'Inside Cabinets' :
                 id === 'windows' ? 'Windows' :
                 id === 'laundry' ? 'Laundry' : id,
        })) : [],
        when: {
          date: metadata.preferredDate || null,
          time: metadata.preferredTime || null,
        },
        contact: contactParts.length >= 8 ? {
          firstName: contactParts[0] || '',
          lastName: contactParts[1] || '',
          email: contactParts[2] || session.customer_email || '',
          phone: contactParts[3] || '',
          streetAddress: contactParts[4] || '',
          city: contactParts[5] || '',
          state: contactParts[6] || '',
          zip: contactParts[7] || '',
        } : {
          firstName: metadata.firstName || metadata.contactName?.split(' ')[0] || '',
          lastName: metadata.lastInitial || metadata.contactName?.split(' ').slice(1).join(' ') || '',
          email: session.customer_email || metadata.email || metadata.contactEmail || '',
          phone: metadata.phone || '',
          streetAddress: metadata.address?.split(',')[0] || '',
          city: metadata.address?.split(',')[1]?.trim() || '',
          state: metadata.address?.split(',')[2]?.trim() || '',
          zip: metadata.zipCode || '',
        },
        estimate: {
          total: parseFloat(metadata.totalPrice || '0') || (session.amount_total ? session.amount_total / 100 : 0),
          subtotal: session.amount_subtotal ? session.amount_subtotal / 100 : 0,
          tax: 0,
        },
        branchSlug: metadata.branchSlug || 'new-jersey',
      };
    }

    // Extract structured data
    const service = bookingData.service;
    const home = bookingData.home;
    const extras = bookingData.extras;
    const when = bookingData.when;
    const contact = bookingData.contact;
    const estimate = bookingData.estimate;
    const branchSlug = bookingData.branchSlug;

    console.log("[BOOKING CREATE] Received request:", { branchSlug, hasEmail: !!contact?.email });

    if (!contact?.email) {
      return NextResponse.json(
        { error: "Missing customer email." },
        { status: 400 }
      );
    }

    // Get branch: use provided slug, or fall back to ACTIVE branch
    let branch = null;

    if (branchSlug) {
      // Try to find branch by provided slug
      console.log("[BOOKING CREATE] Looking for branch with slug:", branchSlug);
      try {
        branch = await prisma.branch.findUnique({
          where: { slug: branchSlug },
          select: { id: true, name: true, slug: true, status: true },
        });
      } catch (dbError: any) {
        console.error("[BOOKING CREATE] Database error while fetching branch by slug:", dbError);
        return NextResponse.json(
          { error: "Database connection error. Please try again later." },
          { status: 500 }
        );
      }
    }

    // Fallback: if no branch found or no slug provided, use first ACTIVE branch
    if (!branch) {
      console.log("[BOOKING CREATE] Branch not found by slug, trying fallback to ACTIVE branch...");
      try {
        branch = await prisma.branch.findFirst({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, slug: true, status: true },
        });

        if (!branch) {
          return NextResponse.json(
            { error: 'No active branch found. Please contact support.' },
            { status: 400 }
          );
        }

        console.log("[BOOKING CREATE] Using fallback ACTIVE branch:", branch);
      } catch (dbError: any) {
        console.error("[BOOKING CREATE] Database error while fetching ACTIVE branch:", dbError);
        return NextResponse.json(
          { error: "Database connection error. Please try again later." },
          { status: 500 }
        );
      }
    }

    console.log("[BOOKING CREATE] Using branch:", branch);

    const normalizedEmail = contact.email.toLowerCase().trim();

    // UPSERT CUSTOMER
    // Build full address string for defaultAddress field
    const addressParts = [];
    if (contact.streetAddress) addressParts.push(contact.streetAddress);
    if (contact.city) addressParts.push(contact.city);
    if (contact.state) addressParts.push(contact.state);
    if (contact.zip) addressParts.push(contact.zip);
    const fullAddressString = addressParts.length > 0 ? addressParts.join(", ") : null;

    const customerUpdateData: any = {
      firstName: contact.firstName || undefined,
      lastName: contact.lastName || undefined,
      phone: contact.phone || undefined,
      updatedAt: new Date(),
    };
    if (fullAddressString) customerUpdateData.defaultAddress = fullAddressString;
    if (contact.zip) customerUpdateData.homeZipCode = contact.zip;

    const customerCreateData: any = {
      email: normalizedEmail,
      firstName: contact.firstName || "Customer",
      lastName: contact.lastName || "",
      phone: contact.phone || null,
      updatedAt: new Date(), // ✅ REQUIRED
    };
    if (fullAddressString) customerCreateData.defaultAddress = fullAddressString;
    if (contact.zip) customerCreateData.homeZipCode = contact.zip;

    const customer = await prisma.customer.upsert({
      where: { email: normalizedEmail },
      update: customerUpdateData,
      create: customerCreateData,
    });

    // Full address already built above for customer upsert
    const fullAddress = fullAddressString;

    // Build service location/details string with home info and extras
    const serviceDetails = [];
    if (home?.bedrooms) serviceDetails.push(`${home.bedrooms} bedrooms`);
    if (home?.bathrooms) serviceDetails.push(`${home.bathrooms} bathrooms`);
    if (home?.squareFeet) serviceDetails.push(`${home.squareFeet} sq ft`);
    if (extras && extras.length > 0) {
      const extraLabels = extras.map((e: any) => e.label || e.id).join(", ");
      serviceDetails.push(`Extras: ${extraLabels}`);
    }
    const serviceLocation = serviceDetails.length > 0 ? serviceDetails.join("; ") : null;

    // Parse date and time
    let preferredDate: Date | null = null;
    if (when?.date) {
      preferredDate = new Date(when.date);
    }

    // Phase M: Validate territory before creating job
    if (contact.zip && branch.id) {
      const territoryValidation = await validateTerritory(
        branch.id,
        contact.zip,
        when?.time || undefined
      );
      
      if (!territoryValidation.valid) {
        return NextResponse.json(
          {
            error: territoryValidation.error || "Service area validation failed",
            territoryError: true,
            zipCode: territoryValidation.zipCode,
            serviceHours: territoryValidation.serviceHours,
          },
          { status: 400 }
        );
      }
    }

    // CREATE JOB
    // 🚨 STEP 6: Set payment state - job is created ONLY after confirmed payment
    // Only set fields that exist in database (database schema is source of truth)
    const jobData: any = {
      branchId: branch.id,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      serviceType: service?.label || service?.type || "Standard Cleaning",
      serviceLocation: serviceLocation,
      address: fullAddress,
      preferredDate: preferredDate,
      preferredTime: when?.time || null,
      totalPrice: estimate?.total ? parseFloat(estimate.total.toString()) : null,
      status: JobStatus.RECEIVED,
      currency: "USD",
      paymentMethod: "stripe", // ✅ Payment confirmed via Stripe
      sessionId: sessionId, // ✅ Store Stripe session ID for reference
      // Note: paymentStatus and paidAt fields don't exist in schema yet
      // If needed, add them to schema: paymentStatus String? @default("PAID"), paidAt DateTime?
    };
    
    // Remove undefined values
    Object.keys(jobData).forEach(key => {
      if (jobData[key] === undefined) {
        delete jobData[key];
      }
    });

    const job = await prisma.job.create({
      data: jobData,
    });

    console.log("[BOOKING CREATE] ✅ Job created successfully:", {
      jobId: job.id,
      customerId: customer.id,
      branchId: branch.id,
      status: job.status,
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

    // SEND CUSTOMER EMAIL
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "VelocityMaid <onboarding@resend.dev>",
          to: customer.email,
          subject: "Your Booking Has Been Received",
          html: `
            <h2>Your Booking Request</h2>
            <p>Thank you, ${customer.firstName}!</p>
            <p>We will review your request and send confirmation shortly.</p>
            <p><strong>Service:</strong> ${service?.label || "Standard Cleaning"}</p>
            <p><strong>Estimate:</strong> $${estimate?.total?.toFixed(2) || "0.00"}</p>
            ${when?.date ? `<p><strong>Date:</strong> ${new Date(when.date).toLocaleDateString()}</p>` : ""}
            ${when?.time ? `<p><strong>Time:</strong> ${when.time}</p>` : ""}
            ${fullAddress ? `<p><strong>Address:</strong> ${fullAddress}</p>` : ""}
          `,
        });
      } catch (emailError) {
        console.error("Failed to send customer email:", emailError);
        // Don't fail the booking if email fails
      }
    }

    // SEND ADMIN NOTIFICATION
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "VelocityMaid <onboarding@resend.dev>",
          to: "hello@velocitymaid.com",
          subject: "New Booking Received",
          html: `
            <h3>New Booking</h3>
            <p><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</p>
            <p><strong>Email:</strong> ${customer.email}</p>
            <p><strong>Phone:</strong> ${customer.phone || "Not provided"}</p>
            <p><strong>Service:</strong> ${service?.label || "Standard Cleaning"}</p>
            <p><strong>Estimate:</strong> $${estimate?.total?.toFixed(2) || "0.00"}</p>
            ${when?.date ? `<p><strong>Date:</strong> ${new Date(when.date).toLocaleDateString()}</p>` : ""}
            ${when?.time ? `<p><strong>Time:</strong> ${when.time}</p>` : ""}
            ${fullAddress ? `<p><strong>Address:</strong> ${fullAddress}</p>` : ""}
            ${serviceLocation ? `<p><strong>Details:</strong> ${serviceLocation}</p>` : ""}
            <p><strong>Job ID:</strong> ${job.id}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send admin email:", emailError);
        // Don't fail the booking if email fails
      }
    }

    console.log("[BOOKING CREATE] ✅ Booking completed successfully. Creating session...");
    
    // 🔐 Auto-login customer after booking
    const sessionToken = await createCustomerSessionToken({
      customerId: customer.id,
      email: customer.email,
      issuedAt: Math.floor(Date.now() / 1000),
    });

    // 🚨 STEP 7: Return JSON response (not redirect)
    // The confirmation page handles the redirect to customer dashboard
    // This allows the confirmation page to show success UI before redirecting
    const res = NextResponse.json({
      success: true,
      jobId: job.id,
      customerId: customer.id,
      message: "Booking created successfully",
    });

    res.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });

    console.log("[BOOKING CREATE] ✅ Session cookie set. Customer auto-logged in. Job ID:", job.id);
    return res;
  } catch (err: any) {
    console.error("BOOKING ERROR:", err);
    console.error("Error stack:", err?.stack);
    return NextResponse.json(
      { error: err?.message || "Failed to create booking." },
      { status: 500 }
    );
  }
}

