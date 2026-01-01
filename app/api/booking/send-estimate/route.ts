import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

console.log(">>> SEND ESTIMATE ROUTE LOADED");

// Initialize Resend (lazy initialization to prevent build-time errors)
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {

  try {

    console.log("[ESTIMATE] === Incoming request ===");

    const body = await req.json();

    console.log("[ESTIMATE] Payload:", body);

    const { contact, estimate } = body;

    if (!contact?.email) {

      console.log("[ESTIMATE] Missing contact email");

      return NextResponse.json(

        { error: "Email is required to send the estimate." },

        { status: 400 }

      );

    }

    if (!estimate) {

      console.log("[ESTIMATE] Missing estimate data");

      return NextResponse.json(

        { error: "Estimate data is required." },

        { status: 400 }

      );

    }

    const normalizedEmail = contact.email.toLowerCase().trim();

    // --- UPSERT CUSTOMER ------------------------------------------------

    console.log("[ESTIMATE] Upserting customer…");

    const customer = await prisma.customer.upsert({

      where: { email: normalizedEmail },

      update: {
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
        phone: contact.phone || undefined,
        updatedAt: new Date(),
      },

      create: {
        email: normalizedEmail,
        firstName: contact.firstName || "Customer",
        lastName: contact.lastName || "",
        phone: contact.phone || null,
        updatedAt: new Date(),
      },

    });

    console.log("[ESTIMATE] Customer upserted:", customer.id);

    // --- SEND EMAIL ------------------------------------------------------

    console.log("[ESTIMATE] Sending email via Resend…");

    const resend = getResend();
    if (!resend) {
      console.error("[ESTIMATE] RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email service is not configured. Please contact support." },
        { status: 500 }
      );
    }

    const emailResponse = await resend.emails.send({

      from: "VelocityMaid <onboarding@resend.dev>",

      to: normalizedEmail,

      subject: "Your Cleaning Service Estimate",

      html: `

        <h2>Your Cleaning Estimate</h2>

        <p>Thank you, ${customer.firstName}.</p>

        <p><strong>Total Estimate:</strong> $${estimate?.total?.toFixed(2) || '0.00'}</p>

        ${estimate?.estimatedHours ? `<p><strong>Estimated Time:</strong> ${estimate.estimatedHours} hours</p>` : ''}

        ${estimate?.recommendedCleaners ? `<p>Recommended Cleaners: ${estimate.recommendedCleaners}</p>` : ''}

      `,

    });

    console.log("[ESTIMATE] Email sent:", emailResponse);

    // --- SUCCESS RESPONSE ----------------------------------------------

    return NextResponse.json({ success: true });

  } catch (err: any) {

    console.error("[ESTIMATE] ERROR:", err);
    console.error("[ESTIMATE] Error stack:", err?.stack);
    console.error("[ESTIMATE] Error details:", {
      message: err?.message,
      name: err?.name,
      code: err?.code,
    });

    return NextResponse.json(

      { error: err?.message || "Failed to send estimate" },

      { status: 500 }

    );

  }

}
