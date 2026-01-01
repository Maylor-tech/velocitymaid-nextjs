/**
 * Admin Contact Message Reply API
 * 
 * POST /api/admin/contact-messages/[id]/reply
 * 
 * Sends a reply email to a contact message sender
 * and automatically marks the message as REPLIED.
 * Admin-only, protected by requireRole("ADMIN")
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const admin = await requireRole(request, "ADMIN");

    const body = await request.json();
    const { body: replyBody, subject, sendEmail = true } = body;

    // Validate reply message
    if (!replyBody || typeof replyBody !== "string" || replyBody.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Reply message required" },
        { status: 400 }
      );
    }

    // Fetch contact message
    const contact = await prisma.contactMessage.findUnique({
      where: { id: params.id },
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contact message not found" },
        { status: 404 }
      );
    }

    // 1️⃣ Save reply to database FIRST (atomic, defensible)
    const reply = await prisma.contactReply.create({
      data: {
        contactMessageId: contact.id,
        body: replyBody.trim(),
        repliedByAdminId: admin.userId,
        sentViaEmail: sendEmail,
      },
    });

    // 2️⃣ Send email if requested (non-blocking)
    let emailSent = false;
    if (sendEmail) {
      const resend = getResend();
      if (resend) {
        try {
          await resend.emails.send({
            from: "VelocityMaid <no-reply@velocitymaid.com>",
            to: [contact.email],
            subject: subject?.trim() || "VelocityMaid — Follow-up",
            html: `
              <p>Hi ${contact.name},</p>
              <p>Thanks for reaching out to VelocityMaid.</p>
              <p>${replyBody.replace(/\n/g, "<br/>")}</p>
              <p>Best regards,<br/>VelocityMaid Team</p>
            `,
            text: `
Hi ${contact.name},

Thanks for reaching out to VelocityMaid.

${replyBody}

Best regards,
VelocityMaid Team
            `.trim(),
          });

          emailSent = true;
          console.log(
            `[CONTACT_REPLY] Reply sent to ${contact.email} for message ${params.id}`
          );
        } catch (emailError: any) {
          console.error("[CONTACT_REPLY] Failed to send reply email:", emailError);
          // Don't fail - reply is already saved
        }
      }
    }

    // 3️⃣ Update status to REPLIED (only if email was sent successfully)
    if (emailSent || !sendEmail) {
      await prisma.contactMessage.update({
        where: { id: params.id },
        data: {
          status: "REPLIED",
          repliedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CONTACT_REPLY] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to send reply",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

