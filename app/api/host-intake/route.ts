/**
 * POST /api/host-intake
 *
 * Receives Vermont host intake form submissions and notifies the team via email.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const NOTIFICATION_EMAIL =
  process.env.CONTACT_NOTIFICATIONS_EMAIL || "hello@velocitymaid.com";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatList(items: string[] | undefined): string {
  if (!items || items.length === 0) return "—";
  return items.join(", ");
}

function buildEmailBody(data: Record<string, unknown>): { html: string; text: string } {
  const propertySection = `
Property address: ${data.propertyAddress || "—"}
City / Town: ${data.city || "—"}
Bedrooms: ${data.bedrooms || "—"}
Bathrooms: ${data.bathrooms || "—"}
Booking platform(s): ${formatList(data.bookingPlatforms as string[])}
  `.trim();

  const cleaningSection = `
Service types: ${formatList(data.serviceTypes as string[])}
Turnover frequency: ${data.turnoverFrequency || "—"}
Currently has a cleaner: ${data.hasCleaner || "—"}
Special instructions: ${data.specialInstructions || "—"}
  `.trim();

  const contactSection = `
Full name: ${data.fullName || "—"}
Email: ${data.email || "—"}
Phone: ${data.phone || "—"}
Preferred contact: ${data.preferredContact || "—"}
Best time to reach: ${data.bestTimeToReach || "—"}
  `.trim();

  const text = `
NEW VERMONT HOST INQUIRY
=======================

YOUR PROPERTY
${propertySection}

CLEANING NEEDS
${cleaningSection}

CONTACT INFO
${contactSection}
  `.trim();

  const html = `
<h2>New Vermont Host Inquiry</h2>

<h3>Your property</h3>
<ul>
  <li><strong>Property address:</strong> ${data.propertyAddress || "—"}</li>
  <li><strong>City / Town:</strong> ${data.city || "—"}</li>
  <li><strong>Bedrooms:</strong> ${data.bedrooms || "—"}</li>
  <li><strong>Bathrooms:</strong> ${data.bathrooms || "—"}</li>
  <li><strong>Booking platform(s):</strong> ${formatList(data.bookingPlatforms as string[])}</li>
</ul>

<h3>Cleaning needs</h3>
<ul>
  <li><strong>Service types:</strong> ${formatList(data.serviceTypes as string[])}</li>
  <li><strong>Turnover frequency:</strong> ${data.turnoverFrequency || "—"}</li>
  <li><strong>Currently has a cleaner:</strong> ${data.hasCleaner || "—"}</li>
  <li><strong>Special instructions:</strong> ${(data.specialInstructions as string) || "—"}</li>
</ul>

<h3>Contact info</h3>
<ul>
  <li><strong>Full name:</strong> ${data.fullName || "—"}</li>
  <li><strong>Email:</strong> ${data.email || "—"}</li>
  <li><strong>Phone:</strong> ${data.phone || "—"}</li>
  <li><strong>Preferred contact:</strong> ${data.preferredContact || "—"}</li>
  <li><strong>Best time to reach:</strong> ${data.bestTimeToReach || "—"}</li>
</ul>
  `.trim();

  return { html, text };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const propertyAddress = String(body.propertyAddress ?? "").trim();
    const city = String(body.city ?? "").trim();
    const bedrooms = String(body.bedrooms ?? "").trim();
    const bathrooms = String(body.bathrooms ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!propertyAddress || !city || !bedrooms || !bathrooms || !fullName || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const payload = {
      propertyAddress,
      city,
      bedrooms,
      bathrooms,
      bookingPlatforms: Array.isArray(body.bookingPlatforms)
        ? body.bookingPlatforms
        : [],
      serviceTypes: Array.isArray(body.serviceTypes) ? body.serviceTypes : [],
      turnoverFrequency: String(body.turnoverFrequency ?? "").trim(),
      hasCleaner: String(body.hasCleaner ?? "").trim(),
      specialInstructions: String(body.specialInstructions ?? "").trim(),
      fullName,
      email,
      phone: String(body.phone ?? "").trim(),
      preferredContact: String(body.preferredContact ?? "").trim(),
      bestTimeToReach: String(body.bestTimeToReach ?? "").trim(),
    };

    const resend = getResend();

    if (!resend) {
      // TODO: Remove console.log once RESEND_API_KEY is confirmed in production.
      console.log("[HOST-INTAKE] RESEND_API_KEY not configured. Form data:", payload);
      return NextResponse.json({ success: true });
    }

    const { html, text } = buildEmailBody(payload);
    const subject = `New host inquiry — ${city}, VT — ${fullName}`;

    await resend.emails.send({
      from: "VelocityMaid <no-reply@velocitymaid.com>",
      to: [NOTIFICATION_EMAIL],
      replyTo: email,
      subject,
      html,
      text,
    });

    console.log(
      `[HOST-INTAKE] Notification sent to ${NOTIFICATION_EMAIL} for ${fullName} (${city}, VT)`
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[HOST-INTAKE] Error:", err);
    const message =
      err instanceof Error ? err.message : "Unable to submit inquiry";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
