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
    const { message } = body;

    // Validate reply message
    if (!message || typeof message !== "string" || message.trim().length === 0) {
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

    // 1️⃣ Send reply email
    const resend = getResend();
    if (!resend) {
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    try {
      await resend.emails.send({
        from: "VelocityMaid <no-reply@velocitymaid.com>",
        to: [contact.email],
        subject: "Re: Your message to VelocityMaid",
        html: `
          <p>Hello ${contact.name},</p>

          <p>${message.replace(/\n/g, "<br/>")}</p>

          <p>
            Regards,<br/>
            VelocityMaid
          </p>

          <hr/>
          <p style="font-size:12px;color:#666;">
            Infrastructure for trust at scale.
          </p>
        `,
        text: `
Hello ${contact.name},

${message}

Regards,
VelocityMaid

---
Infrastructure for trust at scale.
        `.trim(),
      });

      console.log(
        `[CONTACT_REPLY] Reply sent to ${contact.email} for message ${params.id}`
      );
    } catch (emailError: any) {
      console.error("[CONTACT_REPLY] Failed to send reply email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send reply email",
          details:
            process.env.NODE_ENV === "development"
              ? emailError.message
              : undefined,
        },
        { status: 500 }
      );
    }

    // 2️⃣ Save reply to database
    await prisma.contactReply.create({
      data: {
        contactMessageId: contact.id,
        body: message.trim(),
        repliedByAdminId: admin.userId,
      },
    });

    // 3️⃣ Update status to REPLIED
    await prisma.contactMessage.update({
      where: { id: params.id },
      data: {
        status: "REPLIED",
      },
    });

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

