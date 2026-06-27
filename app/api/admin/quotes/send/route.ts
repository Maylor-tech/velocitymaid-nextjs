export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { sendQuoteEmail } from "@/lib/email/sendQuoteEmail";

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    const body = await request.json();
    const to = typeof body.to === "string" ? body.to.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const html = typeof body.html === "string" ? body.html : "";
    const replyTo =
      typeof body.replyTo === "string" && body.replyTo.trim()
        ? body.replyTo.trim()
        : undefined;

    if (!to) {
      return NextResponse.json(
        { success: false, error: "Recipient email (to) is required" },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Email subject is required" },
        { status: 400 }
      );
    }

    if (!html.trim()) {
      return NextResponse.json(
        { success: false, error: "Email HTML is required" },
        { status: 400 }
      );
    }

    const result = await sendQuoteEmail({ to, subject, html, replyTo });

    if (!result.sent) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || result.skippedReason || "Failed to send email",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
    });
  } catch (error: unknown) {
    console.error("[admin/quotes/send]", error);
    const message =
      error instanceof Error ? error.message : "Failed to send quote email";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
