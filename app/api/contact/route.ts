/**
 * Contact Form API
 * 
 * POST /api/contact
 * 
 * Receives contact form submissions, persists to database,
 * and sends email notifications routed by role.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { autoReplyTemplates } from "@/lib/contact/autoReplyTemplates";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    // Defensive guard: ensure Prisma is initialized
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const body = await req.json();
    const { role, name, email, organization, message } = body;

    // Validate required fields
    if (!role || !name || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Persist to database
    await prisma.contactMessage.create({
      data: {
        role,
        name,
        email,
        organization: organization || null,
        message: message || null,
      },
    });

    // 2️⃣ Route email by role
    const resend = getResend();
    if (resend) {
      const to =
        role === "investor"
          ? process.env.INVESTOR_NOTIFICATIONS_EMAIL ||
            process.env.CONTACT_NOTIFICATIONS_EMAIL
          : process.env.CONTACT_NOTIFICATIONS_EMAIL;

      if (to) {
        try {
          await resend.emails.send({
            from: "VelocityMaid <no-reply@velocitymaid.com>",
            to: [to],
            subject: `New Contact Message (${role})`,
            html: `
              <h3>New Contact Message</h3>
              <p><strong>Role:</strong> ${role}</p>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Organization:</strong> ${organization || "—"}</p>
              <p><strong>Message:</strong></p>
              <p>${message || "—"}</p>
            `,
            text: `
New Contact Message

Role: ${role}
Name: ${name}
Email: ${email}
Organization: ${organization || "—"}

Message:
${message || "—"}
            `.trim(),
          });

          console.log(
            `[CONTACT] Email notification sent to ${to} for ${role} contact from ${email}`
          );
        } catch (emailError: any) {
          console.error("[CONTACT] Failed to send email notification:", emailError);
          // Don't fail the request if email fails - message is already saved
        }
      } else {
        console.warn(
          "[CONTACT] No notification email configured. Message saved to database."
        );
      }

      // 3️⃣ Auto-reply acknowledgment
      try {
        const template =
          autoReplyTemplates[role] || autoReplyTemplates["other"];

        await resend.emails.send({
          from: "VelocityMaid <no-reply@velocitymaid.com>",
          to: [email],
          subject: template.subject,
          html: template.html(name),
        });

        console.log(
          `[CONTACT] Auto-reply sent to ${email} for ${role} contact`
        );
      } catch (autoReplyError: any) {
        console.error("[CONTACT] Failed to send auto-reply:", autoReplyError);
        // Don't fail the request if auto-reply fails - message is already saved
      }
    } else {
      console.warn(
        "[CONTACT] RESEND_API_KEY not configured. Message saved to database."
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[CONTACT] Error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to process contact message",
        details:
          process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}


